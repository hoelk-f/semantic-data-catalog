/** @jest-environment node */
import { isVisibleCatalogEntry } from './catalogFeatures';
import { saveDataService } from './solidCatalog';

test('API metadata is hidden while datasets and series remain available', () => {
  const records = [{datasetType: 'service'}, {datasetType: 'dataset'}, {datasetType: 'series'}, {title: 'Legacy dataset'}];
  expect(records.filter(isVisibleCatalogEntry)).toEqual(records.slice(1));
  expect(records).toHaveLength(4);
});

test.each([{}, {datasetUrl: 'https://pod.example/catalog/ds/api.ttl#it'}])('disabled API writes never read or mutate Pod resources: %p', async input => {
  const session = {info: {webId: 'https://pod.example/profile/card#me'}, fetch: jest.fn()};
  await expect(saveDataService(session, input)).rejects.toThrow('currently disabled');
  expect(session.fetch).not.toHaveBeenCalled();
});
