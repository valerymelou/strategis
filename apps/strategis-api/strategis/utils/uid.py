from base64 import urlsafe_b64encode
from uuid import uuid4


def uuid():
    """
    Returns a URL safe UUID.
    """
    return urlsafe_b64encode(uuid4().bytes).decode("ascii").rstrip("=")
