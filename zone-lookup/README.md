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
- `shareUrl` (overrides the auto-detected page URL used by the share menu)

## Configuration import

After importing a configuration XML, **the data source reference (zone layer) is not preserved** because EB stores it as an app-specific UUID, not a URL. Always re-link the zone layer in the settings panel after importing an XML.

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
