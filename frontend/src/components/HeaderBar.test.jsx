import React, { act } from "react";
import { createRoot } from "react-dom/client";
import HeaderBar from "./HeaderBar";
import { session } from "../solidSession";
import { getSolidDataset } from "@inrupt/solid-client";

jest.mock("@inrupt/solid-client", () => ({
  getSolidDataset: jest.fn(),
  getThing: jest.fn(),
  getStringNoLocale: jest.fn(),
  getUrl: jest.fn(),
}));

jest.mock("@inrupt/vocab-common-rdf", () => ({
  FOAF: { name: "foaf:name", img: "foaf:img" },
  VCARD: {
    fn: "vcard:fn",
    hasPhoto: "vcard:hasPhoto",
    value: "vcard:value",
    url: "vcard:url",
    hasEmail: "vcard:hasEmail",
  },
}));

jest.mock("../solidSession", () => ({
  session: {
    info: { isLoggedIn: false, webId: "" },
    login: jest.fn(),
    logout: jest.fn(),
    fetch: jest.fn(),
  },
}));

describe("HeaderBar", () => {
  test("uses the startup profile without a second request or login flash", async () => {
    session.info = { isLoggedIn: true, webId: "https://solid.example/profile/card#me" };
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => root.render(<HeaderBar initialUserInfo={{
      loggedIn: true, webId: session.info.webId, name: "Loaded User", email: "", photo: "",
    }} />));
    expect(container.textContent).toContain("Loaded User");
    expect(container.textContent).not.toContain("Not logged in");
    expect(getSolidDataset).not.toHaveBeenCalled();
    await act(async () => root.unmount());
  });
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    document.body.innerHTML = "";
    window.localStorage.clear();
    session.info = { isLoggedIn: false, webId: "" };
  });

  test("keeps the standalone language selector inside the header actions", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <HeaderBar
          languageControl={(
            <label className="language-select language-select--header">
              <select aria-label="Language" defaultValue="en">
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </label>
          )}
        />
      );
      await Promise.resolve();
    });

    const headerActions = container.querySelector(".header-right--catalog");
    expect(headerActions).not.toBeNull();
    expect(
      headerActions.querySelector(".language-select--header")
    ).not.toBeNull();
    expect(container.querySelector(".language-select--standalone")).toBeNull();

    await act(async () => root.unmount());
    container.remove();
  });

  test("a remembered login never redirects a guest; only the header button requests login", async () => {
    session.info = { isLoggedIn: false, webId: '' };
    session.login.mockClear();
    localStorage.setItem('solid-was-logged-in', 'true');
    localStorage.setItem('solid-oidc-issuer', 'https://solidcommunity.net');
    const onLogin = jest.fn();
    const container = document.createElement('div'); document.body.append(container);
    const root = createRoot(container);
    await act(async () => root.render(<HeaderBar onLogin={onLogin} />));
    expect(session.login).not.toHaveBeenCalled();
    expect(onLogin).not.toHaveBeenCalled();
    await act(async () => container.querySelector('button').click());
    expect(onLogin).toHaveBeenCalledTimes(1);
    expect(session.login).not.toHaveBeenCalled();
    await act(async () => root.unmount());
  });

  test("places the language selector immediately before logout for a logged-in user", async () => {
    session.info = {
      isLoggedIn: true,
      webId: "https://solid.example/profile/card#me",
    };
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <HeaderBar
          languageControl={(
            <label className="language-select language-select--header">
              <select aria-label="Language" defaultValue="en">
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </label>
          )}
        />
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    const user = container.querySelector(".header-user");
    const language = user?.querySelector(".language-select--header");
    const logout = user?.querySelector(".header-logout");
    expect(language).not.toBeNull();
    expect(logout).not.toBeNull();
    expect(language?.nextElementSibling).toBe(logout);

    await act(async () => root.unmount());
    container.remove();
  });
});
