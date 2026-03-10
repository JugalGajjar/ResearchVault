from flask import Blueprint, request, jsonify
from app.services.search import search_records

search_bp = Blueprint("search", __name__)


@search_bp.route("/", methods=["GET"])
def search():
    query = request.args.get("q", "").strip() or None
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)

    filters = {}
    if request.args.get("type"):
        filters["record_type"] = request.args.get("type")
    if request.args.get("status"):
        filters["status"] = request.args.get("status")
    if request.args.get("tags"):
        filters["tags"] = request.args.get("tags").split(",")
    if request.args.get("date_from"):
        filters["date_from"] = request.args.get("date_from")
    if request.args.get("date_to"):
        filters["date_to"] = request.args.get("date_to")

    try:
        result = search_records(query=query, filters=filters, page=page, per_page=per_page)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Search unavailable: {str(e)}", "items": [], "total": 0}), 200
