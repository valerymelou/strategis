import pytest
from django.template import TemplateDoesNotExist

from strategis.utils.mail import render_mail


class TestEmail:
    def test_render_mail_template_missing(self):
        with pytest.raises(TemplateDoesNotExist) as exception:
            render_mail("email/email", "john@doe.com", {})

        assert "email/email" in str(exception.value)

    def test_send_txt_email(self):
        message = render_mail("email/base", "john@doe.com", {})
        assert message.to == ["john@doe.com"]
        assert message.subject == "Hello from Strategis Flow"
