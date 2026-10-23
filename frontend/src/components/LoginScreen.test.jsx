import React, { act } from "react";
import { createRoot } from "react-dom/client";
import LoginScreen from "./LoginScreen";

describe("LoginScreen", () => {
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("renders the standalone language selector directly before the login button", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <LoginScreen
          defaultIssuer="https://solid.example"
          onLogin={jest.fn()}
          languageControl={(
            <label className="language-select language-select--login">
              <select aria-label="Language" defaultValue="en">
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </label>
          )}
        />
      );
    });

    const hero = container.querySelector(".login-hero");
    const footer = container.querySelector(".login-footer");
    const language = footer?.querySelector(".language-select--login");
    const login = footer?.querySelector(".login-primary");

    expect(hero).not.toBeNull();
    expect(hero?.querySelector(".language-select--login")).toBeNull();
    expect(footer).not.toBeNull();
    expect(language).not.toBeNull();
    expect(language?.nextElementSibling).toBe(login);
    expect(language?.closest(".login-wrap")).not.toBeNull();
    expect(container.querySelector(".language-select--standalone")).toBeNull();

    await act(async () => root.unmount());
    container.remove();
  });
});
