import uuid

from django.db import models
from model_utils.models import TimeStampedModel


class BaseModel(TimeStampedModel):
    """
    Abstract base model for all models in the application.
    Uses a UUID as primary key and automatic `created` and `modified` fields.
    """

    id = models.UUIDField(
        primary_key=True,
        db_index=True,
        default=uuid.uuid4,
        editable=False,
    )

    class Meta:
        abstract = True
