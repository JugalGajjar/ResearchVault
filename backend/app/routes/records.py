import os
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from sqlalchemy import func
from app.extensions import db
from app.models.record import Record, Author, Tag, RecordVersion
from app.schemas.record import record_schema, records_schema, RecordSchema
from app.services.search import index_record, delete_record
from app.services.doi import generate_doi

records_bp = Blueprint("records", __name__)


def get_or_create_author(author_data):
    orcid = author_data.get("orcid")
    if orcid:
        author = Author.query.filter_by(orcid=orcid).first()
        if author:
            author.name = author_data["name"]
            author.affiliation = author_data.get("affiliation", author.affiliation)
            return author
    author = Author.query.filter_by(name=author_data["name"]).first()
    if not author:
        author = Author(
            name=author_data["name"],
            orcid=orcid,
            affiliation=author_data.get("affiliation"),
            email=author_data.get("email"),
        )
        db.session.add(author)
    return author


def get_or_create_tag(tag_name):
    tag = Tag.query.filter(func.lower(Tag.name) == tag_name.lower()).first()
    if not tag:
        tag = Tag(name=tag_name.lower().strip())
        db.session.add(tag)
    return tag


@records_bp.route("/", methods=["GET"])
def list_records():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    status = request.args.get("status")
    record_type = request.args.get("type")

    query = Record.query.order_by(Record.created_at.desc())
    if status:
        query = query.filter_by(status=status)
    if record_type:
        query = query.filter_by(record_type=record_type)

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        "items": records_schema.dump(pagination.items),
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
        "per_page": per_page,
    })


@records_bp.route("/<string:record_id>", methods=["GET"])
def get_record(record_id):
    record = db.get_or_404(Record, record_id)
    return jsonify(record_schema.dump(record))


@records_bp.route("/", methods=["POST"])
def create_record():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    authors_data = data.pop("authors", [])
    tags_data = data.pop("tags", [])

    if not data.get("title", "").strip():
        return jsonify({"error": "title is required"}), 400

    try:
        record = Record(**{
            k: v for k, v in data.items()
            if k in Record.__table__.columns.keys() and k not in ("id", "created_at", "updated_at")
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    if not record.doi:
        record.doi = generate_doi(record.record_type or "paper")

    db.session.add(record)

    for a in authors_data:
        if isinstance(a, dict):
            record.authors.append(get_or_create_author(a))

    for t in tags_data:
        tag_name = t.get("name") if isinstance(t, dict) else t
        if tag_name:
            record.tags.append(get_or_create_tag(tag_name))

    db.session.commit()

    try:
        index_record(record)
    except Exception as e:
        current_app.logger.warning(f"Search indexing failed: {e}")

    return jsonify(record_schema.dump(record)), 201


@records_bp.route("/<string:record_id>", methods=["PUT"])
def update_record(record_id):
    record = db.get_or_404(Record, record_id)
    data = request.get_json()

    authors_data = data.pop("authors", None)
    tags_data = data.pop("tags", None)

    for key, value in data.items():
        if hasattr(record, key) and key not in ("id", "created_at"):
            setattr(record, key, value)

    if authors_data is not None:
        record.authors = [get_or_create_author(a) for a in authors_data if isinstance(a, dict)]

    if tags_data is not None:
        record.tags = []
        for t in tags_data:
            tag_name = t.get("name") if isinstance(t, dict) else t
            if tag_name:
                record.tags.append(get_or_create_tag(tag_name))

    db.session.commit()

    try:
        index_record(record)
    except Exception as e:
        current_app.logger.warning(f"Search indexing failed: {e}")

    return jsonify(record_schema.dump(record))


@records_bp.route("/<string:record_id>", methods=["DELETE"])
def delete_record_route(record_id):
    record = db.get_or_404(Record, record_id)
    try:
        delete_record(record_id)
    except Exception:
        pass
    db.session.delete(record)
    db.session.commit()
    return jsonify({"message": "Record deleted"}), 200


@records_bp.route("/<string:record_id>/publish", methods=["POST"])
def publish_record(record_id):
    record = db.get_or_404(Record, record_id)
    record.status = "published"
    db.session.commit()
    try:
        index_record(record)
    except Exception:
        pass
    return jsonify(record_schema.dump(record))


@records_bp.route("/<string:record_id>/versions", methods=["POST"])
def add_version(record_id):
    record = db.get_or_404(Record, record_id)
    data = request.get_json()

    # Save current state as a version snapshot
    version = RecordVersion(
        record_id=record.id,
        version=record.version,
        changelog=data.get("changelog", ""),
        file_path=record.file_path,
        file_name=record.file_name,
    )
    db.session.add(version)

    # Bump version
    record.version = data.get("new_version", _bump_version(record.version))
    db.session.commit()

    try:
        index_record(record)
    except Exception:
        pass

    return jsonify(record_schema.dump(record)), 201


def _bump_version(version_str):
    try:
        parts = version_str.split(".")
        parts[-1] = str(int(parts[-1]) + 1)
        return ".".join(parts)
    except Exception:
        return "1.0.1"
