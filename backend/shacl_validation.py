import os
from rdflib import Graph
from pyshacl import validate


def _shape_path() -> str:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_dir, "shapes", "sdcat-shape.ttl")


def validate_turtle(ttl_data: str) -> tuple[bool, str]:
    data_graph = Graph()
    data_graph.parse(data=ttl_data, format="turtle")

    shape_graph = Graph()
    shape_graph.parse(_shape_path(), format="turtle")

    conforms, _, results_text = validate(
        data_graph=data_graph,
        shacl_graph=shape_graph,
        inference="rdfs",
        debug=False,
    )

    return conforms, results_text
