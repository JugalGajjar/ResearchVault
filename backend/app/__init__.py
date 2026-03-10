import os
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate

from app.extensions import db, ma
from app.routes.records import records_bp
from app.routes.search import search_bp
from app.routes.uploads import uploads_bp
from app.routes.stats import stats_bp


def create_app(config=None):
    app = Flask(__name__)

    # Configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL", "postgresql://rv_user:rv_password@localhost:5432/researchvault"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key")
    app.config["UPLOAD_FOLDER"] = os.environ.get("UPLOAD_FOLDER", "./uploads")
    app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50MB max upload
    app.config["OPENSEARCH_URL"] = os.environ.get("OPENSEARCH_URL", "http://localhost:9200")

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Extensions
    db.init_app(app)
    ma.init_app(app)
    Migrate(app, db)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Blueprints
    app.register_blueprint(records_bp, url_prefix="/api/records")
    app.register_blueprint(search_bp, url_prefix="/api/search")
    app.register_blueprint(uploads_bp, url_prefix="/api/uploads")
    app.register_blueprint(stats_bp, url_prefix="/api/stats")

    @app.route("/api/health")
    def health():
        return {"status": "ok", "service": "ResearchVault API"}

    return app
