from modeltranslation.translator import TranslationOptions
from modeltranslation.translator import register

from .models import ActorType


@register(ActorType)
class ActorTypeTranslationOptions(TranslationOptions):
    fields = ("name", "description")
