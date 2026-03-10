"""
Pytest configuration: override DATABASE_URL before create_app() is called.

Flask-SQLAlchemy 3.1+ creates engines eagerly inside init_app(), so the URI
must be in os.environ when create_app() runs — overriding app.config afterwards
has no effect on the already-built engine.
"""
import os

# Force SQLite for all tests; must happen before any app import
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
