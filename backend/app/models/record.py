from datetime import datetime, timezone
from ulid import ULID
from app.extensions import db


record_authors = db.Table(
    "record_authors",
    db.Column("record_id", db.String(26), db.ForeignKey("records.id"), primary_key=True),
    db.Column("author_id", db.Integer, db.ForeignKey("authors.id"), primary_key=True),
)

record_tags = db.Table(
    "record_tags",
    db.Column("record_id", db.String(26), db.ForeignKey("records.id"), primary_key=True),
    db.Column("tag_id", db.Integer, db.ForeignKey("tags.id"), primary_key=True),
)


class Record(db.Model):
    __tablename__ = "records"

    id = db.Column(db.String(26), primary_key=True, default=lambda: str(ULID()))
    title = db.Column(db.String(500), nullable=False)
    abstract = db.Column(db.Text)
    record_type = db.Column(
        db.Enum("paper", "dataset", "software", "report", "presentation", name="record_type_enum"),
        nullable=False,
        default="paper",
    )
    doi = db.Column(db.String(255), unique=True)
    publication_date = db.Column(db.Date)
    version = db.Column(db.String(50), default="1.0.0")
    license = db.Column(db.String(100), default="CC-BY-4.0")
    status = db.Column(
        db.Enum("draft", "published", "archived", name="record_status_enum"),
        default="draft",
    )
    file_path = db.Column(db.String(500))
    file_name = db.Column(db.String(255))
    file_size = db.Column(db.BigInteger)
    file_type = db.Column(db.String(100))

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    authors = db.relationship("Author", secondary=record_authors, back_populates="records", lazy="subquery")
    tags = db.relationship("Tag", secondary=record_tags, back_populates="records", lazy="subquery")
    versions = db.relationship("RecordVersion", back_populates="record", cascade="all, delete-orphan")

    def to_search_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "abstract": self.abstract or "",
            "record_type": self.record_type,
            "doi": self.doi or "",
            "publication_date": self.publication_date.isoformat() if self.publication_date else None,
            "version": self.version,
            "license": self.license,
            "status": self.status,
            "authors": [a.name for a in self.authors],
            "tags": [t.name for t in self.tags],
            "created_at": self.created_at.isoformat(),
        }


class Author(db.Model):
    __tablename__ = "authors"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    orcid = db.Column(db.String(50), unique=True)
    affiliation = db.Column(db.String(500))
    email = db.Column(db.String(255))

    records = db.relationship("Record", secondary=record_authors, back_populates="authors")


class Tag(db.Model):
    __tablename__ = "tags"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False, unique=True)

    records = db.relationship("Record", secondary=record_tags, back_populates="tags")


class RecordVersion(db.Model):
    __tablename__ = "record_versions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    record_id = db.Column(db.String(26), db.ForeignKey("records.id"), nullable=False)
    version = db.Column(db.String(50), nullable=False)
    changelog = db.Column(db.Text)
    file_path = db.Column(db.String(500))
    file_name = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    record = db.relationship("Record", back_populates="versions")
