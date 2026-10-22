import unittest
from unittest.mock import patch
from rdflib import Graph
from shacl_validation import validate_documents
from solid_catalog import load_dataset

DOC="https://pod.example/alice/catalog/ds/api.ttl"
PROFILE="https://github.com/hoelk-f/semantic-data-catalog/blob/main/docs/data-service-profile-v1.md"
TTL=f'''@prefix dcat:<http://www.w3.org/ns/dcat#>. @prefix dct:<http://purl.org/dc/terms/>. @prefix foaf:<http://xmlns.com/foaf/0.1/>.
<> a dcat:CatalogRecord; foaf:primaryTopic <#it>; dct:conformsTo <{PROFILE}>.
<#it> a dcat:DataService; dct:title "Weather API";dct:description "Public observations";dct:publisher "Alice";dcat:endpointURL <https://api.example/v1>; <https://w3id.org/solid-dataspace/catalog-api#authentication> "public".
'''

class ServiceTests(unittest.TestCase):
    def test_service_profile(self):
        result=validate_documents([{"url":DOC,"turtle":TTL}])
        self.assertTrue(result['conforms'],result)
        for invalid in [TTL.replace(PROFILE,'https://wrong.example/profile'),TTL.replace('https://api.example/v1','https://api.example/v1?token=secret'),TTL.replace('dcat:DataService','dcat:Dataset')]:
            self.assertFalse(validate_documents([{"url":DOC,"turtle":invalid}])['conforms'])

    def test_read_api_record(self):
        graph=Graph().parse(data=TTL,format='turtle',publicID=DOC)
        with patch('solid_catalog._fetch_graph',return_value=graph):
            result=load_dataset(DOC)
        self.assertEqual(result['datasetType'],'service')
        self.assertEqual(result['endpointURL'],'https://api.example/v1')
        self.assertEqual(result['distributions'],[])
