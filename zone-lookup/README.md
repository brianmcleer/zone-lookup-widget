# Zone Lookup Widget

Address-based zone lookup widget for ArcGIS Experience Builder. A user enters an address, the widget geocodes it, finds the configured zone polygon that contains the resulting point, and renders a developer-defined HTML template populated with that zone's attributes.

Built generically: any point-in-polygon use case works (leaf pickup areas, council districts, polling places, school boundaries, service zones, snow routes, etc.). The first deployment is the City of Grand Junction's fall 2026 Leaf Removal Program lookup.

## Features

- Custom address autocomplete using any ArcGIS GeocodeServer (single-line geocoding with `magicKey` resolution)
- Point-in-polygon spatial query against any configured zone layer, with a 30m buffered fallback for geocoder precision near polygon boundaries
- Configurable result template (HTML + CSS) populated with feature attributes via `{FIELD_NAME}` tokens, plus a synthetic `{__searchedAddress}` token that interpolates the address the user typed
- Conditional result text using `{{#if FIELD}}...{{else}}...{{/if}}`, including Municipality/Township fallback and nested conditions
- Optional hero header derived from any two feature fields
- Optional features per deployment: "Use my location", "Click the map", recent searches, share menu, print
- Modern share popover: Copy link, Email, Text message, plus native share sheet where supported
- Dedicated outside-service-area card with retry button (separate from generic error states)
- Branded placeholder card before any search, sized to match the result card so the widget height stays stable in iframe embeds
- Iframe-optimization toggle that fills the parent's available height
- XML import/export of full widget configuration for portability across EB experiences
- Brand color overrides (primary and heading) via settings, cascaded through CSS custom properties
- Help guide: a question button at the top right opens a short, searchable, plain-language guide that adapts to the options the app author enabled; a one-time hint points new users at it
- Accessibility features: target sizes, focus indicators, reduced-motion and forced-colors support, and screen reader announcements. Live accessibility testing is still required for each deployment.

## Requirements

- Target: ArcGIS Experience Builder Developer Edition 1.21.0, matching the supplied manifest and source
- Other versions have not been validated for this update
- A configured ArcGIS GeocodeServer URL
- A polygon FeatureLayer holding the zones, added as a data source in the EB app

## Install

1. Download or clone this widget folder.

2. Drop the folder into your EB extensions directory so the structure is:
   ```
   client/your-extensions/widgets/zone-lookup/
       manifest.json
       config.json
       package.json
       src/
       ...
   ```
   The `manifest.json` must sit **directly** inside the widget folder, never nested a second level deep (such as `widgets/zone-lookup/zone-lookup/`). Nesting is the most common reason a widget does not register.

3. From the `client/` directory, run:
   ```
   pnpm ci
   ```
   Use the setup instructions for your Experience Builder version. This widget adds no third-party dependencies. An existing installation receiving only this update does not need another dependency installation. See Esri's installation guide: https://developers.arcgis.com/experience-builder/guide/install-guide/

4. Start the EB dev server:
   ```
   pnpm start
   ```

5. Open the Builder, drop the Zone Lookup widget into an experience, then in the widget's settings:
   - Set the **Geocode URL** to your ArcGIS GeocodeServer
   - Set the **Zone layer** data source to your polygon FeatureLayer
   - Optionally link a Map widget for highlighting and click-to-lookup
   - Customize labels, messages, brand colors, and the result template

### The release zip and the editor shims

The zip is the widget only. The Visual Studio type shims in the repo (`zone-lookup/src/exb-editor-shims.d.ts`, `zone-lookup/src/editor-shims.d.ts`, `zone-lookup/src/vendor-shims.d.ts`) are left out on purpose: their ambient `declare module` blocks are not file-scoped and would rewrite the react, jimu and esri types for every other widget in your `your-extensions` folder.

If you clone the repository instead of using the zip, delete `zone-lookup/src/exb-editor-shims.d.ts` and the other shim files listed above before building; nothing else depends on them.

### Updating an existing installation

Stop the client watcher before copying the files, then restart it after the copy finishes. This update introduces `src/runtime/template.ts`; copying only `widget.tsx` is not sufficient. Keep only one registered `zone-lookup` folder. Existing app settings and the default config have not been changed.

The public release ZIP omits editor shims. The separate development-source ZIP retains the supplied shims and tests for an isolated editing setup; do not redistribute it as the public release or use its shims in another developer's shared type-checking environment.

## Conditional result text

In **Result HTML template**, use:

```html
{{#if Municipality}}
  <p>Incorporated {Municipality}</p>
{{else}}
  <p>Unincorporated {Township} Township</p>
{{/if}}
```

The Municipality branch wins when populated. Missing, null, empty, or whitespace-only values use Township instead. Zero and false count as populated. Field-name capitalization is ignored when no exact match exists. This is widget template syntax, not Arcade.

Examples are in `examples/`. The XML example changes only `resultTemplate`. See `docs/CONDITIONAL_TEMPLATES.md` for nested fallback, hero-field behavior, validation, and the HTML trust model.

## Configuration

Every configurable string, color, and toggle lives in the widget's settings panel. Settings round-trip via XML export and import (in the same settings panel) so configurations can be moved between EB experiences without manual setup.

Notable fields:
- `geocodeUrl` (required), `constrainSearch`, `zoomLevel`
- `resultTemplate` (HTML with `{FIELD_NAME}`, `{__searchedAddress}`, and `{{#if FIELD_NAME}}...{{else}}...{{/if}}`)
- `heroTitleField`, `heroSubtitleField` (optional hero header above the result template)
- `brandPrimaryColor`, `brandHeadingColor`, `highlightFillColor`, `highlightOutlineColor`
- `placeholderHeading`, `placeholderMessage`, `outsideAreaHeading`, `outsideAreaMessage`, `tryAnotherAddressLabel`, `errorMessage`, `noAddressMessage`
- `enableMyLocation`, `enableMapClick`, `enableShare`, `enablePrint`, `enableRecentSearches`
- `iframeMode` (fills parent height, removes void space below the card)
- `mobileOptimized` (touch/mobile ergonomics, **default on**; see Mobile support below)
- `shareUrl` (overrides the auto-detected page URL used by the share menu)

## Mobile support

The **Optimize for mobile** toggle (settings panel, `mobileOptimized` in XML) is on by default and applies:

- **Touch screens and narrow viewports** (`pointer: coarse` or ≤480px):
  - 16px search input font - inputs under 16px trigger iOS Safari's automatic page zoom on focus, which is especially jarring inside an iframe embed
  - 44px minimum touch targets on the input, clear button, action chips, suggestion rows, recent-search rows, toolbar buttons, and share menu items (Apple HIG / WCAG 2.5.8)
  - `touch-action: manipulation` on interactive elements to remove double-tap zoom delay
  - Suggestion list capped at 45% of viewport height so it stays visible above the on-screen keyboard
- **Narrow viewports only** (≤480px):
  - Tighter root gutters (12px) so the address field gets more characters on screen
  - Action chips ("Use my location", "Click map") expand to full-width buttons
  - Share menu renders as a fixed bottom sheet within thumb reach instead of a small anchored popover
  - Outside-area card stacks vertically and centers
  - Result hero and body paddings tighten; card min-heights reduce from 340px to 300px

Turning the toggle off keeps desktop metrics on all screens. The widget also sets `enterKeyHint="search"`, disables autocorrect/spellcheck, and uses word capitalization on the address input for better mobile keyboards (always on, independent of the toggle).

## Configuration import

XML contains settings, not app-specific map and data-source references. Importing into the same configured widget keeps its current references. After importing into a different experience, select the map and zone layer there. A partial XML containing only `resultTemplate` updates only that setting.

## Date field rendering

Date fields (`esriFieldTypeDate`) in the result template are rendered using long month format and parsed as UTC. A `{Pickup_Date_1}` token whose value is October 20, 2026 renders as `October 20, 2026`, not `10/20/2026`.

The UTC handling matters for date-only fields. Esri stores those as midnight UTC, and the naive JavaScript default (`new Date(value).toLocaleDateString()`) interprets that timestamp in the viewer's local timezone. In Mountain Time (UTC-6/-7) and other negative-offset zones, midnight UTC is late evening the day before, so October 20 renders as October 19. Passing `timeZone: 'UTC'` to the formatter reads the date components in UTC and displays the day as stored.

Every `{FIELD_NAME}` token that resolves to a date field goes through this formatter automatically. No template-side configuration is needed.

## Usage telemetry

This widget records anonymous usage counts and errors so the GIS Division can see which widgets and versions are in use and which errors users hit. It records the app id and title, widget name and version, the action name, a truncated error message, the site host name and browser family. It never records usernames, coordinates, addresses, attribute values or URLs with query strings. Where the data goes: on page load the widget asks the app's portal for a public item tagged `exb-beacon-sink` and posts to that table. If your portal has no such item, nothing is sent anywhere. To turn it off for an app, set `"telemetry": false` in the widget's config, or users can enable Do Not Track in their browser. The shared module is `src/shared/beacon.ts`.

## Troubleshooting: `<name> is duplicated`

If the client build reports `zone-lookup is duplicated`, a second copy of the widget is registered somewhere. EB scans `your-extensions/widgets` and throws this when it sees the same manifest `name` more than once. Check in this order:

1. **Nested folder**: `widgets/zone-lookup/zone-lookup/` (manifest must be one level inside the widget folder, not two)
2. **Leftover folder**: any `-copy` folder, a previous-name folder if the widget was renamed, or an older version of the widget folder
3. **Stale compiled build**: stop the client server, delete `client/dist/widgets/zone-lookup/` if it exists, then restart. Common after moving between EB versions, since the build can see both new source and old compiled output.

If removing one copy makes the widget disappear from the EB Entrypoint list entirely, the copy that remains is nested too deep. Move it so the manifest sits directly inside the widget folder.

## Developer checks

Run from the development-source widget folder or the repository clone using the Experience Builder client's TypeScript installation:

```text
npx tsc -p .
node --test tests/*.test.cjs
```

Tests and local editor shims are omitted from the public release ZIP. The existing JSX compiler settings must remain `react-jsx` with `jsxImportSource: @emotion/react`.

This update passed 70 standalone tests and TypeScript checking. A complete Experience Builder webpack build and live browser/mobile checks were not available in the delivery environment. See `docs/VALIDATION-1.5.0.md` for the checked scope and remaining deployment checks.

## Feedback

Questions, bug reports, and feature ideas are welcome on the Esri Community thread:
https://community.esri.com/t5/experience-builder-custom-widgets/zone-lookup/ba-p/1708890

Or open an issue on the GitHub repo.

## License

Apache-2.0. See `LICENSE`.

## Contact

Brian McLeer, City of Grand Junction GIS.

## Localization verification

The October 2026 i18n pass connects local UI helpers, messages and metadata to the app locale and uses the app locale for date/number formatting. Existing units, currencies and configured format options are preserved. Translation files use Esri wording, shared memory and English fallbacks; machine translations still need language review. Catalog coverage is separate from UI coverage. Changes were checked with the widget’s Experience Builder webpack build and compared against its existing TypeScript diagnostics. Test runtime, settings, accessibility text and locale switching in your target languages.
