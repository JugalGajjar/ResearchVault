import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from app.extensions import db
from app.models.record import Record

uploads_bp = Blueprint("uploads", __name__)

ALLOWED_EXTENSIONS = {
    "pdf", "doc", "docx", "txt", "md",
    "csv", "json", "xml", "zip", "tar", "gz",
    "py", "ipynb", "r", "mat",
    "png", "jpg", "jpeg", "svg",
}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@uploads_bp.route("/<string:record_id>", methods=["POST"])
def upload_file(record_id):
    record = db.get_or_404(Record, record_id)

    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "File type not allowed"}), 400

    filename = secure_filename(file.filename)
    unique_name = f"{record_id}_{uuid.uuid4().hex[:8]}_{filename}"
    upload_path = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_path, exist_ok=True)
    full_path = os.path.join(upload_path, unique_name)

    file.save(full_path)
    file_size = os.path.getsize(full_path)

    record.file_path = full_path
    record.file_name = filename
    record.file_size = file_size
    record.file_type = file.content_type or "application/octet-stream"
    db.session.commit()

    return jsonify({
        "message": "File uploaded successfully",
        "file_name": filename,
        "file_size": file_size,
        "stored_name": unique_name,
    }), 200


@uploads_bp.route("/<string:record_id>/download", methods=["GET"])
def download_file(record_id):
    record = db.get_or_404(Record, record_id)
    if not record.file_path:
        return jsonify({"error": "No file attached"}), 404
    directory = os.path.dirname(record.file_path)
    filename = os.path.basename(record.file_path)
    return send_from_directory(directory, filename, as_attachment=True, download_name=record.file_name)
