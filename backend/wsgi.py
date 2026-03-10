import os
from app import create_app
from app.extensions import db
from app.models.record import Record, Author, Tag, RecordVersion

app = create_app()


@app.shell_context_processor
def make_shell_context():
    return {"db": db, "Record": Record, "Author": Author, "Tag": Tag}


@app.cli.command("seed")
def seed_db():
    """Seed the database with sample data."""
    from app.services.search import index_record
    from app.services.doi import generate_doi
    from datetime import date

    print("Seeding database...")

    sample_records = [
        {
            "title": "Cross-Language Vulnerability Detection Using Graph Neural Networks",
            "abstract": "We present a novel approach for detecting security vulnerabilities across Java, Python, and C++ codebases using a Universal Abstract Syntax Tree (uAST) representation combined with GraphSAGE embeddings. Our hybrid detection model achieves 89-92% accuracy across benchmarks.",
            "record_type": "paper",
            "status": "published",
            "publication_date": date(2024, 11, 15),
            "version": "1.0.0",
            "license": "CC-BY-4.0",
            "authors": [
                {"name": "J. Kim", "orcid": "0000-0001-2345-6789", "affiliation": "CERN IT Department"},
                {"name": "M. Alioto", "affiliation": "University of Geneva"},
            ],
            "tags": ["security", "graph-neural-networks", "vulnerability-detection", "static-analysis"],
        },
        {
            "title": "LHC Collision Dataset - Run 3 Proton-Proton 13.6 TeV",
            "abstract": "Open dataset from LHC Run 3 proton-proton collisions at 13.6 TeV centre-of-mass energy. Contains 1.2 TB of reconstructed collision events in ROOT format, suitable for outreach and educational purposes.",
            "record_type": "dataset",
            "status": "published",
            "publication_date": date(2024, 9, 1),
            "version": "3.0.0",
            "license": "CC0-1.0",
            "authors": [
                {"name": "CMS Collaboration", "affiliation": "CERN"},
            ],
            "tags": ["lhc", "particle-physics", "open-data", "cms", "collisions"],
        },
        {
            "title": "InvenioRDM Migration Toolkit",
            "abstract": "A Python-based toolkit for migrating legacy CDS records to the InvenioRDM platform. Supports batch processing, schema transformation, and data quality validation with detailed reporting.",
            "record_type": "software",
            "status": "published",
            "publication_date": date(2024, 10, 20),
            "version": "2.1.3",
            "license": "MIT",
            "authors": [
                {"name": "CERN Digital Library Team", "affiliation": "CERN IT"},
            ],
            "tags": ["migration", "invenio", "python", "data-quality", "open-source"],
        },
        {
            "title": "CERN Accelerator Performance Summary 2024",
            "abstract": "Annual summary of accelerator performance metrics for the LHC and its injector chain during the 2024 physics run. Includes luminosity performance, availability statistics, and upgrade progress.",
            "record_type": "report",
            "status": "published",
            "publication_date": date(2025, 1, 10),
            "version": "1.0.0",
            "license": "CC-BY-4.0",
            "authors": [
                {"name": "BE Department", "affiliation": "CERN"},
                {"name": "TE Department", "affiliation": "CERN"},
            ],
            "tags": ["lhc", "accelerator", "performance", "luminosity", "annual-report"],
        },
        {
            "title": "Introduction to Quantum Computing with Qiskit",
            "abstract": "Educational presentation covering the fundamentals of quantum computing, quantum gates, and practical examples using IBM's Qiskit framework. Developed for the CERN openlab summer student programme.",
            "record_type": "presentation",
            "status": "draft",
            "version": "1.0.0",
            "license": "CC-BY-4.0",
            "authors": [
                {"name": "A. Martinez", "affiliation": "CERN openlab"},
            ],
            "tags": ["quantum-computing", "qiskit", "education", "openlab"],
        },
    ]

    for data in sample_records:
        authors_data = data.pop("authors")
        tags_data = data.pop("tags")

        record = Record(**data)
        record.doi = generate_doi(record.record_type)

        for a in authors_data:
            existing = Author.query.filter_by(name=a["name"]).first()
            if not existing:
                existing = Author(**a)
                db.session.add(existing)
            record.authors.append(existing)

        for tag_name in tags_data:
            existing_tag = Tag.query.filter_by(name=tag_name).first()
            if not existing_tag:
                existing_tag = Tag(name=tag_name)
                db.session.add(existing_tag)
            record.tags.append(existing_tag)

        db.session.add(record)

    db.session.commit()
    print(f"Created {len(sample_records)} records.")

    print("Indexing in OpenSearch...")
    records = Record.query.all()
    for r in records:
        try:
            index_record(r)
        except Exception as e:
            print(f"  Warning: Could not index {r.id}: {e}")

    print("Seed complete!")


@app.cli.command("reindex")
def reindex():
    """Re-index all records in OpenSearch."""
    from app.services.search import reindex_all
    records = Record.query.all()
    count = reindex_all(records)
    print(f"Re-indexed {count} records.")


if __name__ == "__main__":
    app.run(debug=True)
