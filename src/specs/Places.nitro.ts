import { type HybridObject } from "react-native-nitro-modules"

export interface PlaceAutocompleteResult {
  placeId: string
  label: string
}

export interface AutocompleteOptions {
  /** Array of place type filters. Defaults to ["route", "street_address", "premise", "subpremise", "geocode"]. */
  types?: string[]
  /** ISO 3166-1 Alpha-2 country codes to restrict results to (e.g. ["it", "fr"]). Max 5. */
  countries?: string[]
}
export interface AddressComponent {
  name: string
  short_name: string
  types: string[]
}

export interface PlaceDetails {
  name: string
  formatted_address: string
  place_id: string
  latitude: number
  longitude: number
  address_components: AddressComponent[]
}

export interface Places extends HybridObject<{
  ios: "swift"
  android: "kotlin"
}> {
  autocomplete(query: string, options?: AutocompleteOptions): Promise<PlaceAutocompleteResult[]>
  getPlace(placeId: string): Promise<PlaceDetails | null>
  autocompleteWithDetails(query: string, options?: AutocompleteOptions): Promise<PlaceDetails[]>
}
