"""Bounded, anonymous RDF reads. Never use the catalog service credentials here."""
import hashlib
import ipaddress
import socket
from dataclasses import dataclass
from urllib.parse import urljoin, urlsplit, urlunsplit

import urllib3
from rdflib import Graph


class FetchError(Exception):
    def __init__(self, message, *, kind="fetch"):
        super().__init__(message)
        self.kind = kind


def document_url(url):
    url = str(url)
    if any(ord(char) < 33 or ord(char) == 127 or char in '<>"{}|^`\\' for char in url):
        raise FetchError("Source URL contains invalid IRI characters.")
    parts = urlsplit(url)
    if parts.scheme not in {"http", "https"} or not parts.hostname or parts.username or parts.password:
        raise FetchError("Expected an absolute HTTP(S) URL without credentials.")
    return urlunsplit((parts.scheme, parts.netloc, parts.path or "/", parts.query, ""))


@dataclass
class Document:
    graph: Graph
    digest: str
    etag: str = ""
    modified: str = ""
    byte_count: int = 0


class PublicRdfFetcher:
    def __init__(self, max_bytes=4_000_000, timeout=10):
        self.max_bytes = max_bytes
        self.timeout = timeout
        self.cache = {}
        self.used = set()

    def begin(self):
        self.used.clear()

    def finish(self):
        self.cache = {url: doc for url, doc in self.cache.items() if url in self.used}

    def _read(self, url, headers):
        parts = urlsplit(url)
        host = parts.hostname
        port = parts.port or (443 if parts.scheme == "https" else 80)
        addresses = {entry[4][0] for entry in socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)}
        if not addresses or any(not ipaddress.ip_address(addr).is_global or ipaddress.ip_address(addr).is_multicast for addr in addresses):
            raise FetchError("Source resolves to a non-public address.")
        # Pin the validated address; retain the hostname for TLS verification/SNI.
        address = sorted(addresses, key=lambda addr: (ipaddress.ip_address(addr).version, addr))[0]
        options = dict(port=port, timeout=urllib3.Timeout(connect=self.timeout, read=self.timeout), retries=False)
        if parts.scheme == "https":
            pool = urllib3.HTTPSConnectionPool(address, server_hostname=host, assert_hostname=host, **options)
        else:
            pool = urllib3.HTTPConnectionPool(address, **options)
        response = None
        try:
            path = urlunsplit(("", "", parts.path or "/", parts.query, ""))
            response = pool.urlopen("GET", path, headers={**headers, "Host": parts.netloc}, redirect=False, preload_content=False)
            body = response.read(self.max_bytes + 1, decode_content=True)
            if len(body) > self.max_bytes:
                raise FetchError("RDF document exceeds the size limit.")
            return response.status, dict(response.headers), body
        finally:
            if response:
                response.close()
            pool.close()

    def get(self, resource):
        url = document_url(resource)
        self.used.add(url)
        cached = self.cache.get(url)
        headers = {"Accept": "text/turtle, application/n-triples;q=0.9", "Cache-Control": "no-cache"}
        if cached and cached.etag:
            headers["If-None-Match"] = cached.etag
        elif cached and cached.modified:
            headers["If-Modified-Since"] = cached.modified
        target = url
        try:
            for _ in range(6):
                status, raw_headers, body = self._read(target, headers)
                response_headers = {k.lower(): v for k, v in raw_headers.items()}
                if status in {301, 302, 303, 307, 308}:
                    target = document_url(urljoin(target, response_headers.get("location", "")))
                    if not response_headers.get("location"):
                        raise FetchError("Redirect without a location.")
                    headers = {"Accept": headers["Accept"], "Cache-Control": "no-cache"}
                    continue
                if status == 304 and cached:
                    return cached
                if status != 200:
                    raise FetchError(f"Public read returned HTTP {status}.")
                # Turtle/N-Triples parsers do not resolve remote contexts or imports.
                media_type = response_headers.get("content-type", "").split(";", 1)[0].strip().lower()
                if media_type not in {"text/turtle", "application/n-triples", "text/plain", "application/octet-stream"}:
                    raise FetchError("Expected a Turtle or N-Triples document.", kind="non-rdf")
                graph = Graph().parse(data=body, publicID=target, format="nt" if media_type == "application/n-triples" else "turtle")
                doc = Document(graph, hashlib.sha256(body).hexdigest(), response_headers.get("etag", ""), response_headers.get("last-modified", ""), len(body))
                self.cache[url] = doc
                return doc
            raise FetchError("Too many redirects.")
        except Exception as error:
            # Never serve previously public contents after a failed access check.
            self.cache.pop(url, None)
            if isinstance(error, FetchError):
                raise
            raise FetchError("Public RDF read or parsing failed.") from error
