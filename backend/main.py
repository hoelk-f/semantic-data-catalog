from typing import Optional

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

from semantic_search import create_router as create_semantic_search_router
from shacl_validation import validate_documents
from solid_catalog import (
    CatalogLoadError,
    build_merged_catalog_turtle,
    load_catalog,
    load_catalog_datasets,
    load_dataset,
)
from solid_writer import create_dataset as create_dataset_with_service

app = FastAPI(
    title="Semantic Data Catalog API",
    description="Solid/DCAT reader, validator, exporter, and service-account writer.",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.include_router(create_semantic_search_router())

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MetadataDocument(BaseModel):
    url: str = Field(..., min_length=1)
    turtle: str = Field(..., min_length=1)


class ValidationRequest(BaseModel):
    turtle: Optional[str] = None
    base_uri: Optional[str] = None
    documents: Optional[list[MetadataDocument]] = None
    root_url: Optional[str] = None


class DatasetWriteRequest(BaseModel):
    ownerWebId: str = Field(..., min_length=1)
    identifier: Optional[str] = None
    title: str = Field(..., min_length=1)
    description: Optional[str] = ""
    issued: Optional[str] = None
    modified: Optional[str] = None
    publisher: Optional[str] = ""
    contact_point: Optional[str] = ""
    is_public: bool = True
    access_url_dataset: str = ""
    distributions: Optional[list[dict]] = None
    conformsTo: Optional[list[str]] = None
    distribution_access_type: str = "download"
    access_url_semantic_model: Optional[str] = ""
    file_format: Optional[str] = ""
    theme: Optional[str] = ""
    overwrite: bool = False


def _as_http_error(error: CatalogLoadError) -> HTTPException:
    return HTTPException(status_code=error.status_code, detail=error.message)


def _filter_datasets(
    datasets: list[dict],
    q: Optional[str],
    theme: Optional[str],
    dataset_type: Optional[str],
) -> list[dict]:
    filtered = datasets

    if dataset_type:
        normalized_type = dataset_type.strip().lower()
        if normalized_type not in {"dataset", "series"}:
            raise HTTPException(status_code=400, detail="type must be 'dataset' or 'series'.")
        filtered = [
            dataset
            for dataset in filtered
            if dataset.get("datasetType") == normalized_type
        ]

    if theme:
        normalized_theme = theme.strip().lower()
        filtered = [
            dataset
            for dataset in filtered
            if normalized_theme in str(dataset.get("theme", "")).lower()
        ]

    if q:
        query = q.strip().lower()
        searchable_fields = [
            "identifier",
            "title",
            "description",
            "publisher",
            "theme",
            "file_format",
        ]
        filtered = [
            dataset
            for dataset in filtered
            if any(query in str(dataset.get(field, "")).lower() for field in searchable_fields)
        ]

    return filtered


@app.get("/api")
def read_root():
    return {
        "message": "Semantic Data Catalog API",
        "storage": "solid",
        "endpoints": [
            "GET /api/health",
            "GET /api/semantic-search/status",
            "POST /api/semantic-search/query",
            "GET /api/catalog?webId=... or catalogUrl=...",
            "GET /api/datasets?webId=... or catalogUrl=...",
            "GET /api/datasets/count?webId=... or catalogUrl=...",
            "GET /api/datasets/resolve?url=...",
            "POST /api/datasets",
            "POST /api/validate",
            "GET /api/export/catalog?webId=... or catalogUrl=...",
        ],
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "storage": "solid"}


@app.get("/api/catalog")
def read_catalog(
    webId: Optional[str] = Query(None, description="Owner WebID used to discover the catalog."),
    catalogUrl: Optional[str] = Query(None, description="Direct dcat:Catalog resource URL."),
):
    try:
        return load_catalog(web_id=webId, catalog_url=catalogUrl)
    except CatalogLoadError as error:
        raise _as_http_error(error) from error


@app.get("/api/datasets")
def read_datasets(
    webId: Optional[str] = Query(None, description="Owner WebID used to discover the catalog."),
    catalogUrl: Optional[str] = Query(None, description="Direct dcat:Catalog resource URL."),
    q: Optional[str] = Query(None, description="Case-insensitive search over common fields."),
    theme: Optional[str] = Query(None, description="Case-insensitive theme filter."),
    dataset_type: Optional[str] = Query(None, alias="type", description="'dataset' or 'series'."),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    try:
        catalog, datasets, errors = load_catalog_datasets(web_id=webId, catalog_url=catalogUrl)
    except CatalogLoadError as error:
        raise _as_http_error(error) from error

    filtered = _filter_datasets(datasets, q=q, theme=theme, dataset_type=dataset_type)
    page = filtered[skip : skip + limit]
    return {
        "catalog": catalog,
        "datasets": page,
        "count": len(page),
        "total": len(filtered),
        "unfilteredTotal": len(datasets),
        "errors": errors,
    }


@app.get("/api/datasets/count")
def get_dataset_count_endpoint(
    webId: Optional[str] = Query(None, description="Owner WebID used to discover the catalog."),
    catalogUrl: Optional[str] = Query(None, description="Direct dcat:Catalog resource URL."),
    q: Optional[str] = Query(None, description="Case-insensitive search over common fields."),
    theme: Optional[str] = Query(None, description="Case-insensitive theme filter."),
    dataset_type: Optional[str] = Query(None, alias="type", description="'dataset' or 'series'."),
):
    try:
        _, datasets, errors = load_catalog_datasets(web_id=webId, catalog_url=catalogUrl)
    except CatalogLoadError as error:
        raise _as_http_error(error) from error

    filtered = _filter_datasets(datasets, q=q, theme=theme, dataset_type=dataset_type)
    return {"count": len(filtered), "unfilteredTotal": len(datasets), "errors": errors}


@app.get("/api/datasets/resolve")
def resolve_dataset(url: str = Query(..., description="Dataset or dataset series resource URL.")):
    try:
        return load_dataset(url)
    except CatalogLoadError as error:
        raise _as_http_error(error) from error


@app.post("/api/datasets", status_code=201)
def create_dataset(payload: DatasetWriteRequest):
    write_payload = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    write_payload["owner_web_id"] = write_payload.pop("ownerWebId")
    try:
        return create_dataset_with_service(write_payload)
    except CatalogLoadError as error:
        raise _as_http_error(error) from error


@app.post("/api/validate")
def validate_catalog_turtle(payload: ValidationRequest):
    try:
        if payload.documents:
            documents = [item.model_dump() for item in payload.documents]
        elif payload.turtle:
            documents = [{"url": payload.base_uri or "https://validation.invalid/record.ttl", "turtle": payload.turtle}]
        else:
            raise ValueError("Supply turtle or a metadata document bundle.")
        return validate_documents(documents, root_url=payload.root_url)
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.get("/api/export/catalog")
def export_catalog(
    webId: Optional[str] = Query(None, description="Owner WebID used to discover the catalog."),
    catalogUrl: Optional[str] = Query(None, description="Direct dcat:Catalog resource URL."),
):
    try:
        turtle = build_merged_catalog_turtle(web_id=webId, catalog_url=catalogUrl)
    except CatalogLoadError as error:
        raise _as_http_error(error) from error

    return Response(
        content=turtle,
        media_type="text/turtle",
        headers={"Content-Disposition": "attachment; filename=semantic_data_catalog.ttl"},
    )


@app.put("/api/datasets/{identifier}")
@app.delete("/api/datasets/{identifier}")
def write_operations_are_client_side(
    request: Request,
    identifier: Optional[str] = None,
):
    raise HTTPException(
        status_code=501,
        detail=(
            "Dataset update and delete operations are not implemented yet. Use POST "
            "/api/datasets to create catalog entries with the configured service account."
        ),
    )


@app.post("/api/datasets/{identifier}/request-access")
def request_dataset_access(identifier: str):
    raise HTTPException(
        status_code=410,
        detail="Access requests are delivered as Solid inbox notifications by the client application.",
    )
