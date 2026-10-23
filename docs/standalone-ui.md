# Standalone application frame

The catalog, Data Manager, Health App, Health Questionnaire, City Tours and Environmental Monitoring use the same standalone design contract. The canonical stylesheet is `frontend/src/standalone/shell.css`; each app carries its own copy so standalone deployments never depend on a running catalog or Dataspace Manager.

Run `node frontend/scripts/sync-standalone-shell.mjs` from this repository to check the sibling checkouts. Pass `--write` to copy the canonical stylesheet and legal content to them. Review and release the changed application repositories together. Legal content originates in the Dataspace Manager's `legal/content.json`; preserve its revision and draft status when updating the standalone copies.

Only standalone entry points import the shell and app-specific layout styles and set the `dataspace-standalone` body class. Environmental Monitoring checks the authenticated host bridge before enabling the shell. Embedded libraries do not import these styles. Header markers are added only to standalone headers. Application-specific layouts belong in `src/standalone/layout.css` rather than the shared file.

The common frame has a white 76px desktop header, 18px app title, blue icon tile, 44px language/session controls, and a white footer with partner logos, legal dialogs and an app/version badge. Narrow screens wrap controls and footer rows without hiding the application name. The login provider cards share geometry while preserving each app's authentication and validation. Health Questionnaire also retains the required license and third-party notices.

Browser verification should include 1600px, 390px and 320px widths, both languages, authenticated and anonymous views, legal-dialog focus restoration and an embedded view. Use synthetic fixtures for private data; no Pod writes are needed for layout verification.

The five standalone login screens also share `src/standalone/LoginParticleCloud.jsx`, its declaration and stylesheet. The visual uses the original Dataspace Manager geometry, colours and connecting signals. Each app supplies its own label. The consistency script checks these files as well; Environmental Monitoring remains public and has no login visual. The renderer pauses in hidden tabs, honours reduced motion and falls back to a static background when WebGL is unavailable. Mobile touch scrolling and provider controls remain available.
