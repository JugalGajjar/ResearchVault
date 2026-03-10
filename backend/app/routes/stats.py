from flask import Blueprint, jsonify
from sqlalchemy import func
from app.extensions import db
from app.models.record import Record, Author, Tag

stats_bp = Blueprint("stats", __name__)


@stats_bp.route("/", methods=["GET"])
def get_stats():
    total_records = Record.query.count()
    published = Record.query.filter_by(status="published").count()
    draft = Record.query.filter_by(status="draft").count()
    archived = Record.query.filter_by(status="archived").count()

    by_type = db.session.query(
        Record.record_type, func.count(Record.id)
    ).group_by(Record.record_type).all()

    total_authors = Author.query.count()
    total_tags = Tag.query.count()

    total_size = db.session.query(func.sum(Record.file_size)).scalar() or 0

    return jsonify({
        "total_records": total_records,
        "published": published,
        "draft": draft,
        "archived": archived,
        "by_type": {rtype: count for rtype, count in by_type},
        "total_authors": total_authors,
        "total_tags": total_tags,
        "total_storage_bytes": total_size,
    })
