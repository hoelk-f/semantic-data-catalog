import { applyDocumentTranslations, translateText } from "./i18n";

describe("UI translation boundaries", () => {
  afterEach(() => { document.body.innerHTML = ""; document.documentElement.lang = "en"; });

  test("translates controls while preserving names, code, attributes and editable content in both languages", () => {
    document.body.innerHTML = '<button title="Language">Language</button><div translate="no"><span title="Language">Language</span><span>Settings</span><span>settings</span><span>Profile</span><span>Sprache</span></div><code>Language</code><pre>Language</pre><textarea>Language</textarea><div contenteditable="true">Language</div><span class="notranslate">Language</span><input value="Language" placeholder="Language">';
    const protectedContent = document.querySelector('[translate="no"]');
    const original = protectedContent.outerHTML;
    for (const language of ["de", "en", "de"]) {
      applyDocumentTranslations(language);
      const label = language === "de" ? "Sprache" : "Language";
      expect(document.querySelector("button").textContent).toBe(label);
      expect(document.querySelector("button").title).toBe(label);
      expect(protectedContent.outerHTML).toBe(original);
      for (const selector of ["code", "pre", "textarea", "[contenteditable]", ".notranslate"]) {
        expect(document.querySelector(selector).textContent).toBe("Language");
      }
      expect(document.querySelector("input").value).toBe("Language");
      expect(document.querySelector("input").placeholder).toBe(label);
    }
  });

  test("keeps newly rendered descendants and direct subtree translation inside the data boundary", () => {
    document.body.innerHTML = '<section translate="no"><span id="data">Language</span></section><span id="ui">Language</span>';
    const data = document.querySelector("#data");
    applyDocumentTranslations("de", data);
    expect(data.textContent).toBe("Language");
    data.innerHTML = '<strong title="Language">Language</strong>';
    applyDocumentTranslations("de");
    expect(data.textContent).toBe("Language");
    expect(data.firstChild.title).toBe("Language");
    expect(document.querySelector("#ui").textContent).toBe("Sprache");
  });

  test("does not treat object prototype names as translation keys", () => {
    for (const language of ["de", "en"]) {
      for (const value of ["constructor", "toString", "__proto__", "Pod Root", "WebID", "SPARQL", "settings", "settings/", "profile/card#me"]) {
        expect(translateText(value, language)).toBe(value);
      }
    }
  });
});
