# Changelog

All notable changes to the Zone Lookup widget. Newest first.

## 1.5.0 (2026-10-06)

### Added

- Conditional result HTML: `{{#if FIELD}}...{{else}}...{{/if}}`, including nested blocks and a Municipality/Township example. This is template syntax, not an Arcade evaluator.
- A dependency-free pure template helper shared by runtime and settings. Missing, null, empty, and whitespace-only values select the else branch; zero and false remain populated.
- Settings guidance, syntax validation, a keyboard-scrollable example, and a fixed runtime error message for invalid templates.
- A paste-ready HTML example, a partial XML example, template documentation, a validation record, and 70 Node tests.

### Changed

- Token and condition field lookup is case-insensitive when an exact field name is not present. Existing HTML escaping, UTC date formatting, metadata tokens, and cascade-template selection remain in place.
- Help text explains that the answer can vary by area. The shared help components, theme, first-run hint, beacon, default config, and compiler setup are unchanged.
- README setup now targets the supplied Experience Builder 1.21 source. Manifest author is Brian McLeer. Manifest, package, and npm lockfile root versions are synchronized.

### Fixed

- Inherited object properties are not treated as feature attributes.
- The main result announcement is atomic. Template help IDs are unique to each widget instance.
- Public release packaging excludes Visual Studio caches, node_modules, all editor shims, and source-only tests. Local editing shims remain available only in the development-source package.

## 1.4.4 (2026-09-24)

- Fixed: "TypeError: Promise.withResolvers is not a function" on older browsers (iOS/Safari before 17.4). The ArcGIS Maps SDK in Experience Builder 1.21 calls `Promise.withResolvers` when it builds layers, so the lookup failed before it could query. The widget now installs a small polyfill at load when the browser lacks it. Seen in Leaf Pickup via beacon telemetry.

## 1.4.3 (2026-09-18)

- Settings: a **Show help guide** option. Turn it off and the question-mark button and the first-run hint both disappear; the guide itself is untouched. Undefined means on, so apps configured before this release keep their help button.

## 1.4.2 (2026-09-18)

- Security: the beacon's session id now falls back to `crypto.getRandomValues` and then to a clock value instead of `Math.random`, which CodeQL flags as insecure randomness (shared beacon 1.1.1). The id only groups one page load's events; it is never a secret or a credential.
- Build: `tsconfig.json` is `jsx: react-jsx` with `jsxImportSource: @emotion/react`, matching the Experience Builder client. ts-loader reads the widget tsconfig, and the previous classic `jsx: react` setting made the settings panel and runtime fail with "Cannot convert undefined or null to object" after a full rebuild. No functional change.

## 1.4.1 (2026-09-18)

- Added: anonymous usage and error telemetry (shared beacon module; off unless the portal publishes an exb-beacon-sink table; telemetry: false in config disables it).

## 1.4.0 (2026-09-17)

- Added: in-widget help guide (Help button, searchable guide, first-run hint)
- Packaging: the Visual Studio editor shims are no longer in the release zip. `publish.ps1` strips them from a staging copy (`$ReleaseOnlyExclude`) and refuses to zip if any ambient `declare module` of react, jimu or esri survives. The shims stay in the GitHub repo; clone users delete them before building.
- Packaging: `package.json` gained the `exb-widget`, `experience-builder` and `exb` keywords used by the community `exb search` CLI.

## 1.3.0 and earlier

Prior releases: see the GitHub releases page.
