from email.mime.image import MIMEImage
from pathlib import Path

from django.conf import settings
from django.core.mail import EmailMessage
from django.core.mail import EmailMultiAlternatives
from django.template import TemplateDoesNotExist
from django.template.loader import render_to_string
from django.utils import translation

BASE_IMAGES = []


def render_mail(template_prefix, email, context, headers=None):
    """
    Renders an e-mail to `email`.  `template_prefix` identifies the
    e-mail that is to be sent, e.g. "account/email/email_confirmation"
    """
    to = [email] if isinstance(email, str) else email

    language = context.get("language", settings.LANGUAGE_CODE)

    bodies = {}
    for ext in ["html", "txt"]:
        try:
            with translation.override(language):
                subject = render_to_string(f"{template_prefix}_subject.txt", context)
                # remove superfluous line breaks
                subject = " ".join(subject.splitlines()).strip()
                template_name = f"{template_prefix}_message.{ext}"
                body = render_to_string(template_name, context)
                bodies[ext] = body.__str__()
        except TemplateDoesNotExist:
            if ext == "txt" and not bodies:
                # We need at least one body
                raise
    if "txt" in bodies:
        msg = EmailMultiAlternatives(
            subject,
            bodies["txt"],
            from_email=None,
            to=to,
            headers=headers,
        )
        if "html" in bodies:
            msg.attach_alternative(bodies["html"], "text/html")
    else:
        msg = EmailMessage(
            subject,
            bodies["html"],
            from_email=None,
            to=to,
            headers=headers,
        )
        msg.content_subtype = "html"  # Main content is now text/html

    for image in BASE_IMAGES:
        msg = add_attachment(msg, image)

    return msg


def send_mail(template_prefix, email, context):
    msg = render_mail(template_prefix, email, context)
    msg.send()


def add_attachment(msg, image):
    static_dirs = getattr(settings, "STATICFILES_DIRS", None)
    if not static_dirs:
        return msg
    file_path = Path(settings.STATICFILES_DIRS[0]) / "images" / image
    with Path.open(file_path, "rb") as f:
        attachment = MIMEImage(f.read())
        attachment.add_header("Content-ID", f"<{image}>")
        attachment.add_header("Content-Disposition", "inline", filename=image)
    msg.attach(attachment)

    return msg
