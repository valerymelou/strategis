from django.db import migrations

ACTOR_TYPES = [
    {
        "slug": "producer",
        "name": "Producer",
        "name_en": "Producer",
        "name_fr": "Producteur",
        "description": "Entity generating waste lots to be processed.",
        "description_en": "Entity generating waste lots to be processed.",
        "description_fr": "Entité générant des lots de déchets à traiter.",
        "requires_validation": False,
        "is_active": True,
        "required_documents": [],
    },
    {
        "slug": "collector",
        "name": "Collector",
        "name_en": "Collector",
        "name_fr": "Collecteur",
        "description": (
            "Collects small to medium volumes of waste. Operates targeted collection using light "
            "logistics (e.g. tricycles). Lower priority than Transporter when both are eligible "
            "for a route step."
        ),
        "description_en": (
            "Collects small to medium volumes of waste. Operates targeted collection using light "
            "logistics (e.g. tricycles). Lower priority than Transporter when both are eligible "
            "for a route step."
        ),
        "description_fr": (
            "Collecte des volumes faibles à moyens de déchets. Opère une collecte ciblée avec "
            "une logistique légère (ex. tricycles). Priorité inférieure au Transporteur lorsque "
            "les deux sont éligibles pour une même étape de circuit."
        ),
        "requires_validation": True,
        "is_active": True,
        "required_documents": [
            {
                "label": "Collection authorization",
                "required": True,
                "accepted_formats": ["pdf", "jpg", "png"],
            },
            {
                "label": "Professional ID card",
                "required": True,
                "accepted_formats": ["pdf", "jpg", "png"],
            },
        ],
    },
    {
        "slug": "transporter",
        "name": "Transporter",
        "name_en": "Transporter",
        "name_fr": "Transporteur",
        "description": (
            "Handles large volume transport between actors. May operate storage facilities. "
            "Takes priority over Collector when both are eligible for the same route step."
        ),
        "description_en": (
            "Handles large volume transport between actors. May operate storage facilities. "
            "Takes priority over Collector when both are eligible for the same route step."
        ),
        "description_fr": (
            "Assure le transport de grands volumes entre acteurs. Peut exploiter des installations "
            "de stockage. Prioritaire sur le Collecteur lorsque les deux sont éligibles pour une "
            "même étape de circuit."
        ),
        "requires_validation": True,
        "is_active": True,
        "required_documents": [
            {
                "label": "Transport license",
                "required": True,
                "accepted_formats": ["pdf"],
            },
            {
                "label": "Vehicle insurance",
                "required": True,
                "accepted_formats": ["pdf", "jpg", "png"],
            },
        ],
    },
    {
        "slug": "sorter",
        "name": "Sorter",
        "name_en": "Sorter",
        "name_fr": "Trieur",
        "description": (
            "Performs sorting and separation of waste prior to valorization or elimination."
        ),
        "description_en": (
            "Performs sorting and separation of waste prior to valorization or elimination."
        ),
        "description_fr": (
            "Effectue le tri et la séparation des déchets en amont de la valorisation ou de "
            "l'élimination."
        ),
        "requires_validation": True,
        "is_active": True,
        "required_documents": [
            {
                "label": "Operating license",
                "required": True,
                "accepted_formats": ["pdf"],
            },
            {
                "label": "Site justification document",
                "required": True,
                "accepted_formats": ["pdf", "jpg", "png"],
            },
        ],
    },
    {
        "slug": "valorizer",
        "name": "Valorizer",
        "name_en": "Valorizer",
        "name_fr": "Valorisateur",
        "description": (
            "Transforms waste into material or energy. Supports multiple variants: material "
            "valorization, energy valorization, material buyer. Variant(s) declared on the actor "
            "profile determine which scenarios the actor is eligible for."
        ),
        "description_en": (
            "Transforms waste into material or energy. Supports multiple variants: material "
            "valorization, energy valorization, material buyer. Variant(s) declared on the actor "
            "profile determine which scenarios the actor is eligible for."
        ),
        "description_fr": (
            "Transforme les déchets en matière ou en énergie. Prend en charge plusieurs variantes : "
            "valorisation matière, valorisation énergétique, acheteur de matière. La ou les "
            "variante(s) déclarées sur le profil de l'acteur déterminent les scénarios auxquels "
            "il est éligible."
        ),
        "requires_validation": True,
        "is_active": True,
        "required_documents": [
            {
                "label": "Valorization accreditation",
                "required": True,
                "accepted_formats": ["pdf"],
            },
            {
                "label": "Environmental certificate",
                "required": False,
                "accepted_formats": ["pdf", "jpg", "png"],
            },
        ],
    },
    {
        "slug": "processor",
        "name": "Processor",
        "name_en": "Processor",
        "name_fr": "Prétraiteur",
        "description": (
            "Performs intermediate treatment of waste before elimination or further processing. "
            "Supports multiple variants: stabilization, neutralization, volume reduction, secure "
            "treatment, on-site treatment. Variant(s) declared on the actor profile determine "
            "which scenarios the actor is eligible for."
        ),
        "description_en": (
            "Performs intermediate treatment of waste before elimination or further processing. "
            "Supports multiple variants: stabilization, neutralization, volume reduction, secure "
            "treatment, on-site treatment. Variant(s) declared on the actor profile determine "
            "which scenarios the actor is eligible for."
        ),
        "description_fr": (
            "Effectue un traitement intermédiaire des déchets avant élimination ou traitement "
            "complémentaire. Prend en charge plusieurs variantes : stabilisation, neutralisation, "
            "réduction de volume, traitement sécurisé, traitement sur site. La ou les variante(s) "
            "déclarées sur le profil de l'acteur déterminent les scénarios auxquels il est éligible."
        ),
        "requires_validation": True,
        "is_active": True,
        "required_documents": [
            {
                "label": "Treatment accreditation",
                "required": True,
                "accepted_formats": ["pdf"],
            },
            {
                "label": "Variant justification documents",
                "required": True,
                "accepted_formats": ["pdf", "jpg", "png"],
            },
        ],
    },
    {
        "slug": "eliminator",
        "name": "Eliminator",
        "name_en": "Eliminator",
        "name_fr": "Éliminateur",
        "description": (
            "Handles final disposal of waste (landfill, incineration, controlled elimination). "
            "Operates on category B and C lots."
        ),
        "description_en": (
            "Handles final disposal of waste (landfill, incineration, controlled elimination). "
            "Operates on category B and C lots."
        ),
        "description_fr": (
            "Assure l'élimination finale des déchets (mise en décharge, incinération, "
            "élimination contrôlée). Intervient sur les lots de catégorie B et C."
        ),
        "requires_validation": True,
        "is_active": True,
        "required_documents": [
            {
                "label": "Elimination accreditation",
                "required": True,
                "accepted_formats": ["pdf"],
            },
            {
                "label": "Regulatory compliance certificate",
                "required": True,
                "accepted_formats": ["pdf"],
            },
        ],
    },
]


def seed_actor_types(apps, schema_editor):
    ActorType = apps.get_model("profiles", "ActorType")
    for data in ACTOR_TYPES:
        ActorType.objects.get_or_create(slug=data["slug"], defaults=data)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("profiles", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_actor_types, noop),
    ]
