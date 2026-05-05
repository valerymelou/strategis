import posixpath

from .uid import uuid


def upload_to_factory(prefix):
    """
    An upload path generator that uses compact UUIDs for filenames.
    """

    def get_upload_path(_, filename):
        _unused, ext = posixpath.splitext(filename)
        return posixpath.join(prefix, uuid() + ext)

    return get_upload_path


def upload_to(instance, filename):
    """
    An upload path generator that generates an upload prefix based
    on the instance model name, and uses a compact UUID for the filename.
    """

    opts = instance._meta  # noqa: SLF001
    folder = (
        instance.content_type.model.lower()
        if hasattr(instance, "content_type") and instance.content_type is not None
        else instance.__class__.__name__.lower()
    )

    return upload_to_factory(
        posixpath.join(
            opts.app_label,
            folder,
        ),
    )(instance, filename)
