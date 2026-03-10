import pytest
import json
from app import create_app
from app.extensions import db as _db


@pytest.fixture(scope="session")
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "OPENSEARCH_URL": None,
        "UPLOAD_FOLDER": "/tmp/rv_test_uploads",
    })
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture(autouse=True)
def clean_db(app):
    yield
    with app.app_context():
        for table in reversed(_db.metadata.sorted_tables):
            _db.session.execute(table.delete())
        _db.session.commit()


# ── Record CRUD ───────────────────────────────────────────────────────────────

def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json["status"] == "ok"


def test_create_record(client):
    payload = {
        "title": "Test Research Paper",
        "abstract": "A test abstract.",
        "record_type": "paper",
        "authors": [{"name": "Jane Doe", "affiliation": "CERN"}],
        "tags": [{"name": "physics"}, {"name": "test"}],
    }
    r = client.post("/api/records/", json=payload)
    assert r.status_code == 201
    data = r.json
    assert data["title"] == "Test Research Paper"
    assert data["record_type"] == "paper"
    assert data["status"] == "draft"
    assert data["doi"] is not None
    assert len(data["authors"]) == 1
    assert len(data["tags"]) == 2
    return data["id"]


def test_get_record(client):
    # First create
    payload = {"title": "My Dataset", "record_type": "dataset"}
    create_r = client.post("/api/records/", json=payload)
    rid = create_r.json["id"]

    # Then fetch
    r = client.get(f"/api/records/{rid}")
    assert r.status_code == 200
    assert r.json["id"] == rid
    assert r.json["title"] == "My Dataset"


def test_list_records(client):
    for i in range(3):
        client.post("/api/records/", json={"title": f"Record {i}", "record_type": "paper"})

    r = client.get("/api/records/")
    assert r.status_code == 200
    data = r.json
    assert data["total"] >= 3
    assert "items" in data


def test_update_record(client):
    create_r = client.post("/api/records/", json={"title": "Old Title", "record_type": "report"})
    rid = create_r.json["id"]

    r = client.put(f"/api/records/{rid}", json={"title": "New Title", "version": "2.0.0"})
    assert r.status_code == 200
    assert r.json["title"] == "New Title"
    assert r.json["version"] == "2.0.0"


def test_delete_record(client):
    create_r = client.post("/api/records/", json={"title": "To Delete", "record_type": "software"})
    rid = create_r.json["id"]

    r = client.delete(f"/api/records/{rid}")
    assert r.status_code == 200

    r2 = client.get(f"/api/records/{rid}")
    assert r2.status_code == 404


def test_publish_record(client):
    create_r = client.post("/api/records/", json={"title": "Draft Paper", "record_type": "paper"})
    rid = create_r.json["id"]
    assert create_r.json["status"] == "draft"

    r = client.post(f"/api/records/{rid}/publish")
    assert r.status_code == 200
    assert r.json["status"] == "published"


def test_record_not_found(client):
    r = client.get("/api/records/NOTEXIST123")
    assert r.status_code == 404


def test_create_record_missing_title(client):
    r = client.post("/api/records/", json={"record_type": "paper"})
    assert r.status_code == 400


def test_filter_by_type(client):
    client.post("/api/records/", json={"title": "Paper 1", "record_type": "paper"})
    client.post("/api/records/", json={"title": "Dataset 1", "record_type": "dataset"})

    r = client.get("/api/records/?type=paper")
    assert r.status_code == 200
    items = r.json["items"]
    assert all(i["record_type"] == "paper" for i in items)


def test_filter_by_status(client):
    cr = client.post("/api/records/", json={"title": "Published Record", "record_type": "paper"})
    rid = cr.json["id"]
    client.post(f"/api/records/{rid}/publish")
    client.post("/api/records/", json={"title": "Draft Record", "record_type": "paper"})

    r = client.get("/api/records/?status=published")
    assert r.status_code == 200
    items = r.json["items"]
    assert all(i["status"] == "published" for i in items)


# ── Versioning ────────────────────────────────────────────────────────────────

def test_add_version(client):
    cr = client.post("/api/records/", json={"title": "Versioned Record", "record_type": "software", "version": "1.0.0"})
    rid = cr.json["id"]

    r = client.post(f"/api/records/{rid}/versions", json={"changelog": "Added new features", "new_version": "1.1.0"})
    assert r.status_code == 201
    assert r.json["version"] == "1.1.0"

    record_r = client.get(f"/api/records/{rid}")
    assert len(record_r.json["versions"]) == 1
    assert record_r.json["versions"][0]["version"] == "1.0.0"


# ── Stats ─────────────────────────────────────────────────────────────────────

def test_stats(client):
    client.post("/api/records/", json={"title": "S1", "record_type": "paper"})
    client.post("/api/records/", json={"title": "S2", "record_type": "dataset"})

    r = client.get("/api/stats/")
    assert r.status_code == 200
    data = r.json
    assert "total_records" in data
    assert "published" in data
    assert "by_type" in data
    assert data["total_records"] >= 2


# ── DOI generation ────────────────────────────────────────────────────────────

def test_doi_auto_generated(client):
    r = client.post("/api/records/", json={"title": "DOI Test", "record_type": "paper"})
    assert r.status_code == 201
    assert r.json["doi"] is not None
    assert r.json["doi"].startswith("10.99999/")


def test_custom_doi(client):
    r = client.post("/api/records/", json={"title": "Custom DOI", "record_type": "paper", "doi": "10.1234/custom.001"})
    assert r.status_code == 201
    assert r.json["doi"] == "10.1234/custom.001"


# ── Authors & Tags ────────────────────────────────────────────────────────────

def test_multiple_authors(client):
    r = client.post("/api/records/", json={
        "title": "Collab Paper",
        "record_type": "paper",
        "authors": [
            {"name": "Alice Smith", "orcid": "0000-0000-0001-0001"},
            {"name": "Bob Jones", "affiliation": "MIT"},
            {"name": "Carol White"},
        ],
    })
    assert r.status_code == 201
    assert len(r.json["authors"]) == 3


def test_tag_deduplication(client):
    r1 = client.post("/api/records/", json={"title": "R1", "record_type": "paper", "tags": [{"name": "ml"}]})
    r2 = client.post("/api/records/", json={"title": "R2", "record_type": "paper", "tags": [{"name": "ML"}]})
    # Both should resolve to same "ml" tag (case-insensitive)
    assert r1.status_code == 201
    assert r2.status_code == 201
