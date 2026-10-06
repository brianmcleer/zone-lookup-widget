# Validation record: 1.5.0

Date: 2026-10-06. Input: the supplied Zone Lookup 1.4.4 archive. Target manifest: Experience Builder 1.21.0.

## Completed in this environment

- `tsc -p .` with TypeScript 5.8.3: no errors, using the supplied development shims.
- `node --test tests/*.test.cjs` with Node 22.16.0: 70 tests passed.
- Template tests cover both requested outcomes, both fields populated, missing/null/empty/whitespace fields, zero/false, case-insensitive fields and date metadata, nested/sibling blocks, omitted else, malformed syntax, depth bounds, escaped field values, inherited object properties, error-message privacy, original default-template output, and the settings example.
- Help tests cover all flags on, all flags off, each flag alone, custom button labels, unique keys/icons, no missing translations, section gating, and guide writing rules.
- All runtime and settings TypeScript/TSX files transpile with the existing automatic Emotion JSX settings.
- Tests check synchronized manifest/package/lockfile versions, manifest dependencies, no new package dependencies, no Maps SDK imports in settings or the new helper, and the existing all-fields query and cascade-template integration.
- The original `theme.ts`, `HelpPopup.tsx`, `FirstRunHint.tsx`, `beacon.ts`, `tsconfig.json`, `config.json`, and development shim files are unchanged byte for byte.

- The unchanged XML serializer was exercised with the conditional example and a CDATA terminator. Standard XML parsing returned the original strings exactly. The partial XML was checked to contain only `resultTemplate`. Live builder import/export remains untested.

## Package boundaries

The release ZIP contains one `zone-lookup` folder, with `manifest.json` directly inside it. It excludes `node_modules`, `.vs`, editor shims, tests that depend on those shims, generated working files, and nested archives. The separate development-source ZIP retains the existing shims and tests for the author's isolated local editing setup. It is not the community release ZIP.

No repository was changed, no GitHub release was published, and no server or app configuration was updated by this work. The version bump is local to these deliverables. The existing npm lockfile's root version metadata was corrected; no dependency resolutions were regenerated or upgraded, and the pnpm lockfile is unchanged.

## Scope of the standards check

The conditional-template update uses the existing Jimu controls, shared theme tokens, translated settings messages, accessible labels and error announcements, and a pure helper that is safe to import from settings. It adds no icons, browser code evaluation, dependencies, network requests, telemetry payloads, or config keys. The shared help presentation and beacon are untouched.

This is not a full redesign or accessibility certification of the inherited widget. Existing custom icons, controls, and legacy color styling elsewhere in the original widget have not been replaced. The prior mobile scrolling, telephone-link handling, map interactions, graphics, and Safari Promise fallback were deliberately left unchanged.

## Checks still required in Experience Builder

This environment does not contain the user's Experience Builder client or a browser connected to the configured services. The following checks have not been run here:

1. Stop the client watcher, replace the widget source, and restart the client. Confirm the runtime and settings webpack entries compile and load.
2. In Result HTML template, paste the example. Query a known incorporated address and a known unincorporated address. Check the pin, polygon highlight, and displayed result.
3. Check the separate hero fields, print/share behavior, and a cascade priority result when used by the app.
4. Export and re-import XML in the builder and confirm the template is preserved. Import the partial example only into a test app first.
5. Test the new settings example and error with keyboard navigation and narrow/light/dark layouts. Test the existing result panel in portrait and landscape iOS, including phone links.
6. Confirm the help button/first-run hint and existing optional controls still follow app configuration. Check network traffic against the app's expected locator, layer, and portal endpoints.

The successful standalone checks are not a substitute for that live smoke test.
