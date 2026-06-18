import { type ImmutableObject } from 'seamless-immutable'

export type SearchConstraint = 'none' | 'mapExtent' | 'layerExtent'

export type ColorRGBA = [number, number, number, number]

export interface Config {
  /** Geocoding service URL. World Geocoder by default; can be swapped for an internal composite locator. */
  geocodeUrl: string
  /** Limit geocoder candidates to map extent, configured layer's extent, or no constraint. */
  constrainSearch: SearchConstraint
  /** Zoom level applied to the map after a successful lookup. */
  zoomLevel: number
  /** Highlight polygon fill color [r, g, b, a]. */
  highlightFillColor: ColorRGBA
  /** Highlight polygon outline color [r, g, b, a]. */
  highlightOutlineColor: ColorRGBA
  /** Highlight polygon outline width in points. */
  highlightOutlineWidth: number
  /** Visible label rendered above the address input. */
  addressLabel: string
  /** Placeholder text inside the address input. */
  addressPlaceholder: string
  /** Tooltip / accessible help text for the address input. */
  addressTooltip: string
  /** Submit button label. */
  submitLabel: string
  /** Submit button tooltip. */
  submitTooltip: string
  /** Reset button label. */
  resetLabel: string
  /** Reset button tooltip. */
  resetTooltip: string
  /** Whether to show the reset/clear button. */
  showResetButton: boolean
  /** Optional intro HTML rendered above the address input. */
  intro: string
  /**
   * Result HTML template. Use {FIELD_NAME} tokens that will be replaced with the
   * matching attribute value from the zone feature. Values are HTML-escaped at render time.
   */
  resultTemplate: string
  /** Message shown when the geocoder returns no candidates. */
  noAddressMessage: string
  /** Message shown when the address geocodes but doesn't fall in any zone. */
  outsideAreaMessage: string
  /** Generic error message. */
  errorMessage: string

  // ----- v1.1 additions -----

  /** Field name from the zone layer to render as the big hero title (e.g. "ZONE_NAME"). Optional. */
  heroTitleField?: string
  /** Field name from the zone layer to render as the hero subtitle (e.g. "PICKUP_DATE"). Optional. */
  heroSubtitleField?: string
  /** Show the "Use my location" button. */
  enableMyLocation: boolean
  /** Show the "Click map" mode toggle (lets users click the map to look up that point's zone). */
  enableMapClick: boolean
  /** Remember the last few successful lookups in the browser and show them when the search bar is empty. */
  enableRecentSearches: boolean
  /** Show the Share button on the result card. */
  enableShare: boolean
  /** Show the Print button on the result card. */
  enablePrint: boolean
  /** How many recent searches to remember (default 5). */
  maxRecentSearches: number

  // ----- v1.2 additions: brand color overrides -----

  /**
   * Optional brand primary color used for the widget chrome (icons, focus rings,
   * "Use my location" / "Click map" chips, active suggestion background).
   * When set, this overrides the theme's --primary inside the widget so the form
   * area picks up the host org's brand. Falls back to theme primary if undefined.
   */
  brandPrimaryColor?: ColorRGBA
  /**
   * Optional heading/label color used for the address label and intro text emphasis.
   * Falls back to the theme's normal heading color if undefined.
   */
  brandHeadingColor?: ColorRGBA
  /**
   * Optional title shown above the intro inside the header banner.
   * Has no effect when headerStyle is 'plain'.
   */
  headerTitle?: string
  /**
   * Header treatment:
   *   'plain'  — intro renders as ordinary text (default, backwards compatible)
   *   'banner' — intro + optional title render inside a colored banner using
   *              brandHeadingColor as the background and a thin accent stripe
   *              in brandPrimaryColor at the top.
   */
  headerStyle?: 'plain' | 'banner'
  /**
   * Optional heading shown inside the pre-search placeholder card.
   * Falls back to a generic message if undefined.
   */
  placeholderHeading?: string
  /**
   * Optional body text shown inside the pre-search placeholder card.
   * Falls back to a generic message if undefined.
   */
  placeholderMessage?: string
  /**
   * Heading shown inside the outside-area card when an address geocodes
   * successfully but doesn't fall within any zone polygon.
   * Falls back to "Address is outside the service area" if undefined.
   */
  outsideAreaHeading?: string
  /**
   * Label for the "try another address" button shown inside the outside-area card.
   * Falls back to "Try another address" if undefined.
   */
  tryAnotherAddressLabel?: string
  /**
   * Subject line used when the user picks "Email" from the share menu.
   * Falls back to a generic "Lookup results" string if undefined.
   */
  shareEmailSubject?: string
  /**
   * When true, the widget fills its parent's height and stretches the
   * placeholder/result/outside-area card to take up remaining vertical space.
   * Designed for iframe embeds where the host page sets a fixed iframe height
   * — eliminates void space below the content. Leave off (default) for EB
   * experience layouts that auto-size to content.
   */
  iframeMode?: boolean
}

export type IMConfig = ImmutableObject<Config>
