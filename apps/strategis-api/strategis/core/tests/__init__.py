from django.test import TestCase
from rest_framework.reverse import reverse
from rest_framework.settings import api_settings
from rest_framework.test import APITestCase

from strategis.users.tests.factories import UserFactory


def build_view_name(name):
    return f"{api_settings.DEFAULT_VERSION}:{name}"


def build_path(path):
    return f"/{api_settings.DEFAULT_VERSION}{path}"


class BaseTestCase(TestCase):
    @staticmethod
    def make_user(
        username="claude_naelle",
        email="naelleaune@gmail.com",
        name="Claude Naelle",
        password="password",  # noqa: S107
    ):
        return UserFactory(username=username, email=email, name=name, password=password)


class BaseAPITestCase(APITestCase, BaseTestCase):
    @classmethod
    def reverse(
        cls,
        viewname,
        args=None,
        kwargs=None,
        request=None,
        format_=None,
        **extra,
    ):
        viewname = f"{api_settings.DEFAULT_VERSION}:{viewname}"

        return reverse(
            viewname=viewname,
            args=args,
            kwargs=kwargs,
            request=request,
            format=format_,
            **extra,
        )
