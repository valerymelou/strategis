import re
from unittest import TestCase

from strategis.utils.uploads import upload_to
from strategis.utils.uploads import upload_to_factory


class TestModel:
    class _meta:  # noqa: N801
        app_label = "test"


class StorageTest(TestCase):
    def test_upload_to_factory(self):
        assert re.search(
            "^test/[a-zA-Z0-9\\-_]{22}\\.txt$",
            upload_to_factory("test")(object(), "test.txt"),
        )

    def test_upload_to(self):
        assert re.search(
            "^test/testmodel/[a-zA-Z0-9\\-_]{22}\\.txt$",
            upload_to(TestModel(), "test.txt"),
        )
