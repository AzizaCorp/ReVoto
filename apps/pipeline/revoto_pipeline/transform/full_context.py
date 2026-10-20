"""Legacy public import preserved; all current logic is in model.municipal_context."""
from revoto_pipeline.model.municipal_context import build_municipal_context
from revoto_pipeline.model.reglas import unique_mapping


def validate_mapping_uniqueness(rows,columns):
    return unique_mapping(rows,columns)


def build_full_context(cfg,estado):
    return build_municipal_context(cfg,estado)
