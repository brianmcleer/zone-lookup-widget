export default {
  _widgetLabel: 'Zone Lookup',

  // Section titles
  mapSection: 'Map',
  dataSection: 'Zone layer',
  geocoderSection: 'Geocoding',
  templateSection: 'Result template',
  textSection: 'Labels & messages',
  appearanceSection: 'Appearance',

  // Map / data source
  selectMap: 'Select a map widget',
  selectMapHint: 'The map where the address pin and zone highlight are drawn. Optional — the widget still returns results without a map.',
  selectLayer: 'Select the zone layer',
  selectLayerHint: 'The polygon feature layer that holds the zones.',

  // Geocoder
  geocodeUrl: 'Geocoding service URL',
  geocodeUrlHint: 'A REST URL to a GeocodeServer. Defaults to the ArcGIS World Geocoder. Use an internal composite locator if available.',
  constrainSearch: 'Constrain search to',
  constrainNone: 'No constraint',
  constrainMap: 'Current map extent',
  constrainLayer: 'Zone layer extent',

  // Template
  resultTemplate: 'Result HTML template',
  resultTemplateHint: 'HTML rendered after a successful lookup. Use {FIELD_NAME} tokens — they will be replaced with the matching attribute from the zone feature. Values are HTML-escaped automatically. Date fields are formatted with the user\'s locale.',
  availableFields: 'Available fields',
  availableFieldsEmpty: 'Select a zone layer above to see its fields.',
  fieldsLoading: 'Loading fields…',
  introLabel: 'Intro HTML (optional)',
  introHint: 'Shown above the address input. Plain HTML.',

  // Labels & messages
  addressLabel: 'Address input label',
  addressPlaceholder: 'Address input placeholder',
  addressTooltip: 'Address input tooltip',
  submitLabel: 'Submit button label',
  submitTooltip: 'Submit button tooltip',
  resetLabel: 'Reset button label',
  resetTooltip: 'Reset button tooltip',
  showResetButton: 'Show reset button',
  noAddressMessage: 'No-results message',
  outsideAreaMessage: 'Outside service area message',
  errorMessage: 'Generic error message',
  placeholderHeading: 'Placeholder heading (before search)',
  placeholderHeadingPlaceholder: 'e.g. "Find your area"',
  placeholderMessage: 'Placeholder message (before search)',
  placeholderMessagePlaceholder: 'e.g. "Enter an address above to see your results."',
  outsideAreaHeading: 'Outside-area heading',
  outsideAreaHeadingPlaceholder: 'e.g. "Address is outside the service area"',
  tryAnotherAddressLabel: 'Outside-area retry button label',
  tryAnotherAddressLabelPlaceholder: 'e.g. "Try another address"',
  shareEmailSubject: 'Share email subject line',
  shareEmailSubjectPlaceholder: 'e.g. "Lookup results"',
  iframeMode: 'Optimize for iframe',
  iframeModeHint: 'Widget fills its parent\u2019s height and stretches the result card to remove void space below. Use when embedding as a fixed-size iframe.',

  // Appearance
  zoomLevel: 'Zoom level after lookup',
  highlightFill: 'Highlight fill color',
  highlightOutline: 'Highlight outline color',
  highlightOutlineWidth: 'Highlight outline width (pt)',

  // Brand colors (top UI / chrome)
  brandSection: 'Brand colors',
  brandSectionHint: 'Optional. Override the theme accent and heading colors used in the top UI (label, icons, "Use my location", focus rings). Leave blank to inherit from the page theme.',
  brandPrimaryColor: 'Primary brand color',
  brandHeadingColor: 'Heading / label color',
  brandColorClear: 'Reset to theme',
  headerStyle: 'Header style',
  headerStylePlain: 'Plain (intro as ordinary text)',
  headerStyleBanner: 'Banner (colored band with optional title)',
  headerTitle: 'Header title',
  headerTitlePlaceholder: 'e.g. "Find your pickup area"',

  // Hero
  heroSection: 'Result hero',
  heroSectionHint: 'Optional. Pick a field to render as a big colored badge at the top of the result card, plus an optional subtitle underneath. Leave both blank to skip the hero and use only the HTML template.',
  heroTitleField: 'Hero title field',
  heroSubtitleField: 'Hero subtitle field',
  noField: '(none)',

  // Features
  featuresSection: 'Features',
  enableMyLocation: 'Show "Use my location" button',
  enableMapClick: 'Show "Click map" mode toggle',
  enableRecentSearches: 'Remember recent searches',
  maxRecentSearches: 'Max recent searches to keep',
  enableShare: 'Show Share button on result',
  enablePrint: 'Show Print button on result',

  // Import / Export
  importExportSection: 'Import / export',
  importExportHint: 'Save these settings as an XML file or load them from a previously exported file. The map widget and zone layer references stay app-specific and need to be re-selected after importing.',
  exportConfig: 'Export to XML',
  exportTooltip: 'Download these settings as an XML file.',
  importConfig: 'Import from XML',
  importTooltip: 'Load settings from a previously exported XML file.',
  importSuccess: 'Configuration imported successfully.',
  importErrorParse: 'Could not read the file. Make sure it is a valid Zone Lookup XML export.',
  importErrorEmpty: 'No recognized settings were found in the file.'
}