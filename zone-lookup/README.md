# Zone Lookup Widget

Address-based zone lookup widget for ArcGIS Experience Builder. A user enters an address, the widget geocodes it, finds the configured zone polygon that contains the resulting point, and renders a developer-defined HTML template populated with that zone's attributes.

Built generically: any point-in-polygon use case works (leaf pickup areas, council districts, polling places, school boundaries, service zones, snow routes, etc.). The first deployment is the City of Grand Junction's fall 2026 Leaf Removal Program lookup.

## Features

- Custom address autocomplete using any ArcGIS GeocodeServer (single-line geocoding with `magicKey` resolution)
- Point-in-polygon spatial query against any configured zone layer, with a 30m buffered fallback for geocoder precision near polygon boundaries
- Configurable result template (HTML + CSS) populated with feature attributes via `{FIELD_NAME}` tokens, plus a synthetic `{__searchedAddress}` token that interpolates the address the user typed
- Optional hero header derived from any two feature fields
- Optional features per deployment: "Use my location", "Click the map", recent searches, share menu, print
- Modern share popover: Copy link, Email, Text message, plus native share sheet where supported
- Dedicated outside-service-area card with retry button (separate from generic error states)
- Branded placeholder card before any search, sized to match the result card so the widget height stays stable in iframe embeds
- Iframe-optimization toggle that fills the parent's available height
- XML import/export of full widget configuration for portability across EB experiences
- Brand color overrides (primary and heading) via settings, cascaded through CSS custom properties
- WCAG 2.1 AA compliance: target sizes, focus indicators, reduced-motion and forced-colors support, screen reader announcements

## Requirements

- ArcGIS Experience Builder Developer Edition 1.19 or 1.20 (React 19)
- EB 1.18 and earlier are not supported (React 18 boundary)
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
   npm install
   ```
   EB auto-installs every dependency listed in any widget's `package.json` under `your-extensions/`, so no per-package commands are needed.

4. Start the EB dev server:
   ```
   npm start
   ```

5. Open the Builder, drop the Zone Lookup widget into an experience, then in the widget's settings:
   - Set the **Geocode URL** to your ArcGIS GeocodeServer
   - Set the **Zone layer** data source to your polygon FeatureLayer
   - Optionally link a Map widget for highlighting and click-to-lookup
   - Customize labels, messages, brand colors, and the result template

## Configuration

Every configurable string, color, and toggle lives in the widget's settings panel. Settings round-trip via XML export and import (in the same settings panel) so configurations can be moved between EB experiences without manual setup.

Notable fields:
- `geocodeUrl` (required), `constrainSearch`, `zoomLevel`
- `resultTemplate` (HTML with `{FIELD_NAME}` and `{__searchedAddress}` tokens)
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
  - 16px search input font — inputs under 16px trigger iOS Safari's automatic page zoom on focus, which is especially jarring inside an iframe embed
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

After importing a configuration XML, **the data source reference (zone layer) is not preserved** because EB stores it as an app-specific UUID, not a URL. Always re-link the zone layer in the settings panel after importing an XML.

## Date field rendering

Date fields (`esriFieldTypeDate`) in the result template are rendered using long month format and parsed as UTC. A `{Pickup_Date_1}` token whose value is October 20, 2026 renders as `October 20, 2026`, not `10/20/2026`.

The UTC handling matters for date-only fields. Esri stores those as midnight UTC, and the naive JavaScript default (`new Date(value).toLocaleDateString()`) interprets that timestamp in the viewer's local timezone. In Mountain Time (UTC-6/-7) and other negative-offset zones, midnight UTC is late evening the day before, so October 20 renders as October 19. Passing `timeZone: 'UTC'` to the formatter reads the date components in UTC and displays the day as stored.

Every `{FIELD_NAME}` token that resolves to a date field goes through this formatter automatically. No template-side configuration is needed.

## Troubleshooting: `<name> is duplicated`

If `npm start` reports `zone-lookup is duplicated`, a second copy of the widget is registered somewhere. EB scans `your-extensions/widgets` and throws this when it sees the same manifest `name` more than once. Check in this order:

1. **Nested folder**: `widgets/zone-lookup/zone-lookup/` (manifest must be one level inside the widget folder, not two)
2. **Leftover folder**: any `-copy` folder, a previous-name folder if the widget was renamed, or an older version of the widget folder
3. **Stale compiled build**: stop the client server, delete `client/dist/widgets/zone-lookup/` if it exists, then restart. Common after moving between EB versions, since the build can see both new source and old compiled output.

If removing one copy makes the widget disappear from the EB Entrypoint list entirely, the copy that remains is nested too deep. Move it so the manifest sits directly inside the widget folder.

## Feedback

Questions, bug reports, and feature ideas are welcome on the Esri Community thread:
https://community.esri.com/t5/experience-builder-custom-widgets/zone-lookup/ba-p/1708890

Or open an issue on the GitHub repo.

## License

Apache-2.0. See `LICENSE`.

## Contact

Brian McLeer, City of Grand Junction GIS.
