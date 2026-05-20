from __future__ import annotations

import factory
from factory.django import DjangoModelFactory

from strategis.waste.models import CEDCode


class CEDCodeFactory(DjangoModelFactory):
    code = factory.Sequence(lambda n: f"TST {n + 1:04d}")
    chapter_code = "17"
    sub_category_code = "17 02"
    sub_category_label = "Wood, glass, plastics"
    label = factory.Sequence(lambda n: f"Waste label {n + 1}")
    is_hazardous = False
    category = CEDCode.Category.A
    sub_category_a = ""
    sub_category_a_label = ""
    allowed_units = factory.LazyFunction(list)
    points_per_unit = None
    reference_scenario = ""
    is_active = True

    class Meta:
        model = CEDCode
