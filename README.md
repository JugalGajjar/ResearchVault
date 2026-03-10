# ResearchVault

**A full-stack institutional repository for archiving, publishing, and sharing research outputs.**

Built with Python/Flask, React, PostgreSQL, and OpenSearch — inspired by CERN's CDS and the InvenioRDM platform.

---

## Features

- **Research record management** — Create, edit, publish, and archive papers, datasets, software, reports, and presentations
- **Full-text search** — Powered by OpenSearch with fuzzy matching, field boosting (title > abstract > tags), and real-time indexing
- **Faceted filtering** — Filter by record type, status, tags, and date range with aggregation counts
- **File attachments** — Upload with progress tracking; supports PDF, CSV, ZIP, Python notebooks, images, and more
- **DOI generation** — Automatic DOI-style identifiers assigned on record creation
- **Version history** — Snapshot previous versions with changelogs; auto-bumps semantic version numbers
- **REST API** — Clean JSON API with pagination, filtering, and consistent error responses
- **Containerised** — Full Docker Compose stack: backend, frontend, PostgreSQL, OpenSearch

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, Flask 3.0, Flask-SQLAlchemy 3.1, Flask-Migrate |
| Serialisation | Marshmallow, marshmallow-sqlalchemy |
| Database | PostgreSQL 15 |
| Search | OpenSearch 2.11 (opensearch-py) |
| IDs | ULID (python-ulid) |
| Frontend | React 18.2, React Router 6, React Query v3, Axios |
| Containers | Docker, Docker Compose |
| Testing | pytest, pytest-flask |

---

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Git

> **macOS note:** macOS Monterey and later reserves port 5000 for the AirPlay Receiver. The backend is mapped to host port **5001** to avoid this conflict.

### 1. Clone and start

```bash
git clone https://github.com/JugalGajjar/ResearchVault.git
cd ResearchVault
docker compose up --build -d
```

This starts four services:

| Service | Host port |
|---------|-----------|
| PostgreSQL | `5432` |
| OpenSearch | `9200` |
| Flask API | **`5001`** |
| React frontend | `3000` |

### 2. Initialise the database

```bash
# Run migrations (first time only)
docker compose exec backend flask db init
docker compose exec backend flask db migrate -m "initial"
docker compose exec backend flask db upgrade

# Seed with sample data (optional)
docker compose exec backend flask seed
```

### 3. Open the app

Visit **http://localhost:3000**

The API is available at **http://localhost:5001/api**

---

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

export DATABASE_URL=postgresql://rv_user:rv_password@localhost:5432/researchvault
export OPENSEARCH_URL=http://localhost:9200
export SECRET_KEY=dev-secret-key
export FLASK_APP=wsgi.py

flask db upgrade
flask seed      # optional
flask run
```

### Frontend

```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:5001/api npm start
```

---

## Running Tests

The test suite uses SQLite in-memory so no running database is required.

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
pytest -v
```

```
PASSED tests/test_records.py::test_create_record
PASSED tests/test_records.py::test_create_record_missing_title
PASSED tests/test_records.py::test_get_record
PASSED tests/test_records.py::test_update_record
PASSED tests/test_records.py::test_delete_record
PASSED tests/test_records.py::test_publish_record
PASSED tests/test_records.py::test_add_version
... 17 passed in total
```

The test suite covers:

- Record CRUD (create, read, update, delete)
- Input validation (missing title → 400)
- Status transitions (draft → published)
- Version snapshots and auto-bumping
- Author and tag management
- DOI auto-generation
- API filtering and pagination
- Statistics endpoint

---

## API Reference

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service health check |

### Records

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/records/` | List records (paginated, filterable) |
| `POST` | `/api/records/` | Create a new record |
| `GET` | `/api/records/:id` | Get a single record |
| `PUT` | `/api/records/:id` | Replace a record's fields |
| `DELETE` | `/api/records/:id` | Delete a record |
| `POST` | `/api/records/:id/publish` | Publish a draft record |
| `POST` | `/api/records/:id/versions` | Snapshot the current version |

**List query parameters:** `page`, `per_page`, `status`, `type`

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/search/` | Full-text search with facet aggregations |

**Query parameters:** `q`, `type`, `status`, `tags`, `date_from`, `date_to`, `page`, `per_page`

### File uploads

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/uploads/:id` | Upload a file to a record |
| `GET` | `/api/uploads/:id/download` | Download a record's attached file |

**Allowed types:** `pdf`, `doc`, `docx`, `txt`, `md`, `csv`, `json`, `xml`, `zip`, `tar`, `gz`, `py`, `ipynb`, `r`, `mat`, `png`, `jpg`, `jpeg`, `svg`

### Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/stats/` | Repository-wide statistics |

---

## Data Model

```
Record
├── id              ULID (26-char, URL-safe, sortable)
├── title           string (required)
├── abstract        text
├── record_type     paper | dataset | software | report | presentation
├── status          draft | published | archived
├── doi             string (auto-generated on creation)
├── version         semver string (default "1.0.0", auto-bumped)
├── license         string (e.g. "CC-BY-4.0", "MIT")
├── publication_date date
├── file_name       string
├── file_path       string
├── file_size       integer (bytes)
├── file_type       string (MIME type)
├── created_at      datetime
├── updated_at      datetime
├── authors[]       many-to-many → Author
│   ├── name
│   ├── orcid
│   ├── affiliation
│   └── email
├── tags[]          many-to-many → Tag
│   └── name
└── versions[]      RecordVersion snapshots
    ├── version     semver at time of snapshot
    ├── changelog   text
    └── file_path   path at time of snapshot
```

---

## Project Structure

```
ResearchVault/
├── backend/
│   ├── app/
│   │   ├── __init__.py         # App factory (create_app)
│   │   ├── extensions.py       # db, ma singletons
│   │   ├── models/
│   │   │   └── record.py       # Record, Author, Tag, RecordVersion
│   │   ├── routes/
│   │   │   ├── records.py      # CRUD + publish + versioning
│   │   │   ├── search.py       # OpenSearch query endpoint
│   │   │   ├── uploads.py      # File upload / download
│   │   │   └── stats.py        # Repository statistics
│   │   ├── schemas/
│   │   │   └── record.py       # Marshmallow serialisation schemas
│   │   └── services/
│   │       ├── search.py       # OpenSearch client & indexing
│   │       └── doi.py          # DOI generation
│   ├── tests/
│   │   ├── conftest.py         # SQLite override (must run before app import)
│   │   └── test_records.py     # 17 API tests
│   ├── requirements.txt
│   ├── Dockerfile
│   └── wsgi.py                 # App entry point + flask seed CLI command
├── frontend/
│   └── src/
│       ├── api/                # Axios client
│       ├── components/         # RecordForm, FileUpload, SearchBar, etc.
│       ├── pages/              # Dashboard, Search, RecordDetail, Submit
│       └── utils/              # Formatters, type/status helpers
├── docker-compose.yml
└── README.md
```

---

## Design Decisions

**Why ULID for record IDs?**
ULIDs are sortable by creation time, URL-safe, and don't reveal sequential record counts — better than auto-increment integers for a public repository.

**Why OpenSearch over PostgreSQL full-text search?**
OpenSearch enables fuzzy matching, field boosting, real-time facet aggregations, and horizontal scaling — the same infrastructure used by InvenioRDM at CERN.

**Why React Query?**
Provides server state caching, background refetching, and loading/error states out of the box — eliminating manual state management for a data-heavy UI.

**Why Flask-SQLAlchemy 3.x?**
SQLAlchemy 2.0 style brings typed queries, eager loading improvements, and better async support. Note: `db.get_or_404(Model, id)` replaces the legacy `Model.query.get_or_404(id)` API.

---

## Roadmap

- [ ] JWT authentication with role-based access (admin / submitter / viewer)
- [ ] OAI-PMH metadata harvesting endpoint
- [ ] BibTeX / DataCite XML export
- [ ] Email notifications on record state changes
- [ ] Advanced analytics dashboard
- [ ] OpenSearch Dashboards integration

---

## License

MIT
