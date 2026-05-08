"""Patched JsonApiAutoSchema that guards against the missing '$ref' KeyError.

drf_spectacular_jsonapi 0.5.2 has a bug in ``_get_response_for_code`` where it
accesses ``schema["$ref"]`` without first checking whether the key exists.
This happens for any view whose response schema is an inline object rather than
a ``$ref`` — e.g. a list view with ``pagination_class = None`` or a custom
``@action`` endpoint that returns a plain Serializer.

Upstream issue: the condition on line 290 of drf_spectacular_jsonapi/schemas/openapi.py
reads ``content[...]["schema"]["$ref"]`` unconditionally, crashing with KeyError
when the schema has no ``$ref`` key (inline schema).

Fix: reproduce the same logic but guard the ``$ref`` access.
"""

from drf_spectacular.plumbing import ResolvedComponent
from drf_spectacular.plumbing import is_list_serializer
from drf_spectacular_jsonapi.schemas.openapi import JsonApiAutoSchema
from drf_spectacular_jsonapi.schemas.plumbing import build_json_api_data_frame


class PatchedJsonApiAutoSchema(JsonApiAutoSchema):
    """Drop-in replacement for JsonApiAutoSchema with the $ref KeyError fixed."""

    def _get_response_for_code(
        self,
        serializer,
        status_code,
        media_types=None,
        direction="response",
    ):
        response = super(JsonApiAutoSchema, self)._get_response_for_code(
            serializer,
            status_code,
            media_types,
            direction,
        )
        content = response.get("content")
        vnd = "application/vnd.api+json"

        if content and vnd in content:
            schema = content[vnd].get("schema", {})
            ref = schema.get("$ref", "")
            # Only wrap in the JSON:API data frame when:
            #   - there IS a $ref (not an inline schema), and
            #   - it's not already the paginated wrapper
            if ref and "Paginated" not in ref:
                response_component = ResolvedComponent(
                    name=self._get_serializer_name(
                        serializer=serializer,
                        direction=direction,
                    )
                    + "Response",
                    type=ResolvedComponent.SCHEMA,
                    schema=build_json_api_data_frame(schema),
                    object=serializer.child
                    if is_list_serializer(serializer)
                    else serializer,
                )
                self.registry.register_on_missing(response_component)
                content[vnd]["schema"] = response_component.ref

        return response
