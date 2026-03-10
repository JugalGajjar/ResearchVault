from app.extensions import ma
from app.models.record import Record, Author, Tag, RecordVersion
from marshmallow import fields, validate, post_load


class AuthorSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Author
        load_instance = True
        include_fk = True

    name = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    orcid = fields.Str(load_default=None)
    affiliation = fields.Str(load_default=None)
    email = fields.Email(load_default=None)


class TagSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Tag
        load_instance = True

    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))


class RecordVersionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = RecordVersion
        load_instance = True
        include_fk = True
        dump_only = ("id", "created_at")


class RecordSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Record
        load_instance = True
        include_fk = True
        dump_only = ("id", "created_at", "updated_at")

    authors = fields.List(fields.Nested(AuthorSchema))
    tags = fields.List(fields.Nested(TagSchema))
    versions = fields.List(fields.Nested(RecordVersionSchema), dump_only=True)

    title = fields.Str(required=True, validate=validate.Length(min=1, max=500))
    record_type = fields.Str(
        validate=validate.OneOf(["paper", "dataset", "software", "report", "presentation"])
    )
    status = fields.Str(
        validate=validate.OneOf(["draft", "published", "archived"])
    )
    publication_date = fields.Date(load_default=None)
    file_size = fields.Int(dump_only=True)


class RecordListSchema(ma.Schema):
    id = fields.Str()
    title = fields.Str()
    abstract = fields.Str()
    record_type = fields.Str()
    doi = fields.Str()
    publication_date = fields.Date()
    version = fields.Str()
    license = fields.Str()
    status = fields.Str()
    file_name = fields.Str()
    file_size = fields.Int()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
    authors = fields.List(fields.Nested(AuthorSchema))
    tags = fields.List(fields.Nested(TagSchema))


record_schema = RecordSchema()
records_schema = RecordListSchema(many=True)
author_schema = AuthorSchema()
tag_schema = TagSchema()
