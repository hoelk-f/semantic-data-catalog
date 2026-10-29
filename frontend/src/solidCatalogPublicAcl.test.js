import { TextDecoder, TextEncoder } from "util";

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

const mockGetResourceInfoWithAcl = jest.fn();
const mockHasResourceAcl = jest.fn();
const mockHasAccessibleAcl = jest.fn();
const mockGetResourceAcl = jest.fn();
const mockSetPublicResourceAccess = jest.fn();
const mockSaveAclFor = jest.fn();
const mockGetPublicResourceAccess = jest.fn();

jest.mock("@inrupt/solid-client", () => {
  const actual = jest.requireActual("@inrupt/solid-client");
  return {
    ...actual,
    getResourceInfoWithAcl: (...args) => mockGetResourceInfoWithAcl(...args),
    hasResourceAcl: (...args) => mockHasResourceAcl(...args),
    hasAccessibleAcl: (...args) => mockHasAccessibleAcl(...args),
    getResourceAcl: (...args) => mockGetResourceAcl(...args),
    setPublicResourceAccess: (...args) =>
      mockSetPublicResourceAccess(...args),
    saveAclFor: (...args) => mockSaveAclFor(...args),
    getPublicResourceAccess: (...args) =>
      mockGetPublicResourceAccess(...args),
  };
});

const { ensurePublicReadOnlyResourceAccess } = require("./solidCatalog");

const WEB_ID = "https://pod.example/laura/profile/card#me";
const POD_ROOT = "https://pod.example/laura/";
const RESOURCE_URL = `${POD_ROOT}solid-tours/public-routes/route.geojson`;
const resource = { internal_resourceInfo: { sourceIri: RESOURCE_URL } };
const resourceAcl = { id: "resource-acl" };
const updatedAcl = { id: "updated-acl" };
const session = {
  info: { webId: WEB_ID },
  fetch: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetResourceInfoWithAcl.mockResolvedValue(resource);
  mockHasResourceAcl.mockReturnValue(true);
  mockHasAccessibleAcl.mockReturnValue(true);
  mockGetResourceAcl.mockReturnValue(resourceAcl);
  mockSetPublicResourceAccess.mockReturnValue(updatedAcl);
  mockSaveAclFor.mockResolvedValue(undefined);
  mockGetPublicResourceAccess.mockReturnValue({
    read: true,
    append: false,
    write: false,
    control: false,
  });
});

test("sets and re-reads an exact public read-only ACL", async () => {
  await expect(
    ensurePublicReadOnlyResourceAccess(session, `${RESOURCE_URL}#route`, {
      podRoot: POD_ROOT,
    })
  ).resolves.toBeUndefined();

  expect(mockGetResourceInfoWithAcl).toHaveBeenCalledTimes(2);
  expect(mockGetResourceInfoWithAcl).toHaveBeenNthCalledWith(1, RESOURCE_URL, {
    fetch: session.fetch,
  });
  expect(mockGetResourceInfoWithAcl).toHaveBeenNthCalledWith(2, RESOURCE_URL, {
    fetch: session.fetch,
  });
  expect(mockSetPublicResourceAccess).toHaveBeenCalledWith(resourceAcl, {
    read: true,
    append: false,
    write: false,
    control: false,
  });
  expect(mockSaveAclFor).toHaveBeenCalledWith(resource, updatedAcl, {
    fetch: session.fetch,
  });
});

test.each([
  { read: false, append: false, write: false, control: false },
  { read: true, append: true, write: false, control: false },
  { read: true, append: false, write: true, control: false },
  { read: true, append: false, write: false, control: true },
])("fails closed when the persisted public access is not read-only", async (access) => {
  mockGetPublicResourceAccess.mockReturnValue(access);

  await expect(
    ensurePublicReadOnlyResourceAccess(session, RESOURCE_URL, {
      podRoot: POD_ROOT,
    })
  ).rejects.toThrow("verified public read-only access");
});

test.each([
  "https://pod.example/laura-other/solid-tours/route.geojson",
  "https://user:secret@pod.example/laura/solid-tours/route.geojson",
  "https://pod.example/laura/solid-tours/route.geojson?download=1",
])("rejects unsafe or near-prefix resources before ACL access (%s)", async (url) => {
  await expect(
    ensurePublicReadOnlyResourceAccess(session, url, { podRoot: POD_ROOT })
  ).rejects.toThrow("owner's Pod");
  expect(mockGetResourceInfoWithAcl).not.toHaveBeenCalled();
});

test("never makes a Pod container public through the programmatic API", async () => {
  await expect(
    ensurePublicReadOnlyResourceAccess(
      session,
      `${POD_ROOT}solid-tours/public-routes/`,
      { podRoot: POD_ROOT }
    )
  ).rejects.toThrow("non-container resource");
  expect(mockGetResourceInfoWithAcl).not.toHaveBeenCalled();
});
