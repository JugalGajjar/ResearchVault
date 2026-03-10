import os
from opensearchpy import OpenSearch, RequestsHttpConnection
from flask import current_app

INDEX_NAME = "researchvault_records"

INDEX_MAPPING = {
    "mappings": {
        "properties": {
            "id": {"type": "keyword"},
            "title": {
                "type": "text",
                "analyzer": "english",
                "fields": {"keyword": {"type": "keyword"}},
            },
            "abstract": {"type": "text", "analyzer": "english"},
            "record_type": {"type": "keyword"},
            "doi": {"type": "keyword"},
            "publication_date": {"type": "date"},
            "version": {"type": "keyword"},
            "license": {"type": "keyword"},
            "status": {"type": "keyword"},
            "authors": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
            "tags": {"type": "keyword"},
            "created_at": {"type": "date"},
        }
    },
    "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0,
    },
}


def get_client():
    url = current_app.config.get("OPENSEARCH_URL", "http://localhost:9200")
    return OpenSearch(
        hosts=[url],
        use_ssl=False,
        verify_certs=False,
        connection_class=RequestsHttpConnection,
    )


def ensure_index():
    client = get_client()
    if not client.indices.exists(INDEX_NAME):
        client.indices.create(index=INDEX_NAME, body=INDEX_MAPPING)
    return client


def index_record(record):
    client = ensure_index()
    doc = record.to_search_dict()
    client.index(index=INDEX_NAME, id=record.id, body=doc, refresh=True)


def delete_record(record_id):
    client = ensure_index()
    try:
        client.delete(index=INDEX_NAME, id=record_id, refresh=True)
    except Exception:
        pass


def search_records(query=None, filters=None, page=1, per_page=10, sort="created_at"):
    client = ensure_index()

    must_clauses = []
    filter_clauses = []

    if query:
        must_clauses.append({
            "multi_match": {
                "query": query,
                "fields": ["title^3", "abstract^2", "authors", "tags"],
                "type": "best_fields",
                "fuzziness": "AUTO",
            }
        })
    else:
        must_clauses.append({"match_all": {}})

    if filters:
        if filters.get("record_type"):
            filter_clauses.append({"term": {"record_type": filters["record_type"]}})
        if filters.get("status"):
            filter_clauses.append({"term": {"status": filters["status"]}})
        if filters.get("tags"):
            for tag in filters["tags"]:
                filter_clauses.append({"term": {"tags": tag}})
        if filters.get("date_from") or filters.get("date_to"):
            date_range = {}
            if filters.get("date_from"):
                date_range["gte"] = filters["date_from"]
            if filters.get("date_to"):
                date_range["lte"] = filters["date_to"]
            filter_clauses.append({"range": {"publication_date": date_range}})

    body = {
        "query": {
            "bool": {
                "must": must_clauses,
                "filter": filter_clauses,
            }
        },
        "from": (page - 1) * per_page,
        "size": per_page,
        "sort": [{"created_at": {"order": "desc"}}],
        "aggs": {
            "record_types": {"terms": {"field": "record_type"}},
            "statuses": {"terms": {"field": "status"}},
            "top_tags": {"terms": {"field": "tags", "size": 20}},
        },
    }

    result = client.search(index=INDEX_NAME, body=body)

    hits = result["hits"]["hits"]
    total = result["hits"]["total"]["value"]
    aggs = result.get("aggregations", {})

    return {
        "items": [h["_source"] for h in hits],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
        "aggregations": {
            "record_types": {
                b["key"]: b["doc_count"]
                for b in aggs.get("record_types", {}).get("buckets", [])
            },
            "statuses": {
                b["key"]: b["doc_count"]
                for b in aggs.get("statuses", {}).get("buckets", [])
            },
            "top_tags": [
                {"tag": b["key"], "count": b["doc_count"]}
                for b in aggs.get("top_tags", {}).get("buckets", [])
            ],
        },
    }


def reindex_all(records):
    """Re-index all records from scratch."""
    client = get_client()
    if client.indices.exists(INDEX_NAME):
        client.indices.delete(INDEX_NAME)
    client.indices.create(index=INDEX_NAME, body=INDEX_MAPPING)
    for record in records:
        client.index(index=INDEX_NAME, id=record.id, body=record.to_search_dict())
    client.indices.refresh(INDEX_NAME)
    return len(records)
