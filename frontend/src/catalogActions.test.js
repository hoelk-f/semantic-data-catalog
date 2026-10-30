import {
  downloadCatalogResource,
  openDatasetAccess,
} from "./catalogActions";
import { CATALOG_EVENT_TYPES } from "./statistics";

const dataset = {
  datasetUrl: "https://pod.example/catalog/ds/air.ttl#it",
  title: "Air quality",
};

const createBrowser = (order) => ({
  document: {
    createElement: () => ({
      click: () => order.push("click"),
    }),
  },
  URL: {
    createObjectURL: () => "blob:test",
    revokeObjectURL: () => order.push("revoke"),
  },
});

describe("catalog resource actions", () => {
  test("records a dataset download only after a successful blob fetch", async () => {
    const order = [];
    const session = {
      info: { isLoggedIn: true },
      fetch: jest.fn(async () => {
        order.push("fetch");
        return {
          ok: true,
          blob: async () => {
            order.push("blob");
            return {};
          },
        };
      }),
    };
    const trackEvent = jest.fn((event) => {
      order.push(`track:${event.eventType}`);
    });

    await downloadCatalogResource({
      session,
      dataset,
      resourceUrl: "https://pod.example/files/air.csv",
      fileName: "air.csv",
      eventType: CATALOG_EVENT_TYPES.datasetDownload,
      statisticsConfig: { enabled: true },
      trackEvent,
      browser: createBrowser(order),
    });

    expect(order).toEqual([
      "fetch",
      "blob",
      "track:dataset_download",
      "click",
      "revoke",
    ]);
  });

  test("opens a download fallback without recording an access click", async () => {
    const order = [];
    const trackEvent = jest.fn((event) => {
      order.push(`track:${event.eventType}`);
    });
    const openLink = jest.fn(() => order.push("open"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await downloadCatalogResource({
      session: {
        info: { isLoggedIn: true },
        fetch: jest.fn(async () => {
          order.push("fetch");
          return { ok: false };
        }),
      },
      dataset,
      resourceUrl: "https://source.example/air.csv",
      fileName: "air.csv",
      eventType: CATALOG_EVENT_TYPES.datasetDownload,
      trackEvent,
      openLink,
    });

    expect(order).toEqual(["fetch", "open"]);
    expect(trackEvent).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test("does not count a failed semantic-model download", async () => {
    const trackEvent = jest.fn();
    const openLink = jest.fn();
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await downloadCatalogResource({
      session: { info: { isLoggedIn: true }, fetch: jest.fn().mockResolvedValue({ ok: false }) },
      dataset,
      resourceUrl: "https://source.example/model.ttl",
      fileName: "model.ttl",
      eventType: CATALOG_EVENT_TYPES.semanticModelDownload,
      trackEvent,
      openLink,
    });

    expect(trackEvent).not.toHaveBeenCalled();
    expect(openLink).toHaveBeenCalledWith("https://source.example/model.ttl");
    consoleSpy.mockRestore();
  });

  test("opens an access URL without recording a statistics event", () => {
    const order = [];
    const trackEvent = jest.fn(() => order.push("track"));
    const windowRef = {
      open: jest.fn(() => order.push("open")),
    };

    expect(openDatasetAccess({
      session: {},
      dataset,
      resourceUrl: "https://source.example/air",
      statisticsConfig: { enabled: true },
      trackEvent,
      windowRef,
    })).toBe(true);

    expect(order).toEqual(["open"]);
    expect(trackEvent).not.toHaveBeenCalled();
  });
});
