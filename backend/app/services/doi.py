import random
import string
from datetime import datetime


DOI_PREFIX = "10.99999"  # Fake prefix for demo purposes


def generate_doi(record_type: str, year: int = None) -> str:
    """Generate a DOI-style identifier for a record."""
    if year is None:
        year = datetime.now().year
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    type_code = record_type[:3].upper()
    return f"{DOI_PREFIX}/RV.{type_code}.{year}.{suffix}"
