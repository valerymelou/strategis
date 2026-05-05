import re
from unittest import TestCase

from strategis.utils.uid import uuid


class UuidTest(TestCase):
    # It's hard to test random data, but more iterations makes the tests
    # more robust.
    TEST_ITERATIONS = 1000

    def test_uuid_format(self):
        for _ in range(self.TEST_ITERATIONS):
            assert re.search("^[a-zA-Z0-9\\-_]{22}$", uuid())

    def test_uuid_unique(self):
        generated_uuids = set()
        for _ in range(self.TEST_ITERATIONS):
            new_uuid = uuid()
            assert new_uuid not in generated_uuids
            generated_uuids.add(new_uuid)
