import pathlib
import re

from django.db import migrations


DATA_FILE = (
    pathlib.Path(__file__).parent.parent
    / "data"
    / "codes_dechets_modele_enrichi_v11_expert_final.xlsx"
)

_POINTS_RE = re.compile(r"(\d+(?:\.\d+)?)")


def _str(value) -> str:
    """Return a stripped string or empty string for None."""
    if value is None:
        return ""
    return str(value).strip()


def _parse_points(value) -> str | None:
    """Extract the leading number from strings like '10 pts/kg'. Returns None on failure."""
    if value is None:
        return None
    match = _POINTS_RE.search(str(value))
    return match.group(1) if match else None


def seed_ced_codes(apps, schema_editor):
    import openpyxl

    CEDCode = apps.get_model("waste", "CEDCode")

    wb = openpyxl.load_workbook(DATA_FILE, data_only=True)
    ws = wb.active  # "Codes déchets" is the first/active sheet

    for row in ws.iter_rows(min_row=5, values_only=True):
        # Column 3 (0-indexed) is the CED code — skip if absent
        code_raw = row[3]
        if code_raw is None or _str(code_raw) == "":
            continue

        code = _str(code_raw)
        chapter_code = _str(row[0])
        sub_category_code = _str(row[1])
        sub_category_label = _str(row[2])
        label = _str(row[4])

        # is_hazardous: prefer column value, fall back to code suffix
        hazardous_raw = _str(row[5])
        if hazardous_raw.lower() == "oui":
            is_hazardous = True
        elif hazardous_raw.lower() == "non":
            is_hazardous = False
        else:
            is_hazardous = code.endswith("*")

        unit = _str(row[6])
        allowed_units = [unit] if unit else []

        category = _str(row[7])

        # Sub-category A: only populate when category == "A"
        sub_category_a = ""
        sub_category_a_label = ""
        if category == "A" and row[8] is not None:
            specs = _str(row[8])
            if " - " in specs:
                parts = specs.split(" - ", 1)
                sub_category_a = parts[0].strip()
                sub_category_a_label = parts[1].strip()

        # Points per unit: only meaningful for category A
        points_per_unit = _parse_points(row[9]) if row[9] is not None else None

        reference_scenario = _str(row[10])

        CEDCode.objects.get_or_create(
            code=code,
            defaults={
                "chapter_code": chapter_code,
                "sub_category_code": sub_category_code,
                "sub_category_label": sub_category_label,
                "label": label,
                "is_hazardous": is_hazardous,
                "category": category,
                "sub_category_a": sub_category_a,
                "sub_category_a_label": sub_category_a_label,
                "allowed_units": allowed_units,
                "points_per_unit": points_per_unit,
                "reference_scenario": reference_scenario,
                "is_active": True,
            },
        )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("waste", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_ced_codes, noop),
    ]
