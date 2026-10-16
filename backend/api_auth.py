"""Explicit, owner-scoped grants for trusted service integrations.

Interactive users continue to use their Solid session directly against their Pod.
A Pod service credential is never treated as authentication of an API caller.
"""
import hashlib
import hmac
import json
import os
import re
from dataclasses import dataclass
from pathlib import Path

from fastapi import HTTPException, Request


@dataclass(frozen=True)
class WriteGrant:
    client_id: str
    owners: frozenset[str]
    allow_overwrite: bool = False
    allow_public: bool = False

    def authorize(self, owner, *, overwrite=False, is_public=True):
        if owner not in self.owners:
            raise HTTPException(403, "This integration cannot write to the requested owner Pod.")
        if overwrite and not self.allow_overwrite:
            raise HTTPException(403, "This integration cannot overwrite existing entries.")
        if is_public and not self.allow_public:
            raise HTTPException(403, "This integration cannot publish public resources or change their ACLs.")


def _configured_clients():
    path = os.getenv("CATALOG_WRITE_CLIENTS_FILE", "").strip()
    if not path:
        return []
    try:
        with Path(path).open("rb") as handle:
            source = handle.read(262145)
        if len(source) > 262144:
            raise ValueError("Configuration exceeds size limit")
        clients = json.loads(source)
        if not isinstance(clients, list) or len(clients) > 100:
            raise ValueError("Expected a bounded list of integrations")
        for entry in clients:
            if (not isinstance(entry, dict)
                or not isinstance(entry.get("id"), str) or not entry["id"]
                or not isinstance(entry.get("token_sha256"), str)
                or not re.fullmatch(r"[a-f0-9]{64}", entry["token_sha256"])
                or not isinstance(entry.get("owner_webids"), list) or not entry["owner_webids"]
                or not all(isinstance(owner, str) and owner.startswith("https://") and "*" not in owner for owner in entry["owner_webids"])
                or type(entry.get("allow_overwrite", False)) is not bool
                or type(entry.get("allow_public", False)) is not bool):
                raise ValueError("Invalid integration grant")
        if len({entry["token_sha256"] for entry in clients}) != len(clients):
            raise ValueError("Duplicate integration credentials")
        return clients
    except (OSError, ValueError, TypeError):
        raise HTTPException(503, "Service write authorization is not configured correctly.") from None


def require_write_grant(request: Request) -> WriteGrant:
    header = request.headers.get("Authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token or len(token) > 4096 or any(c.isspace() for c in token):
        raise HTTPException(401, "A scoped integration credential is required.", headers={"WWW-Authenticate": "Bearer"})
    digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
    selected = None
    for entry in _configured_clients():
        if hmac.compare_digest(digest, entry["token_sha256"]):
            selected = entry
    if selected is None:
        raise HTTPException(401, "Invalid integration credential.", headers={"WWW-Authenticate": "Bearer"})
    return WriteGrant(selected["id"], frozenset(selected["owner_webids"]),
                      selected.get("allow_overwrite", False), selected.get("allow_public", False))
