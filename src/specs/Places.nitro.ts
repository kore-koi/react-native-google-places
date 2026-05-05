import { type HybridObject } from "react-native-nitro-modules"

export interface PlaceAutocompleteResult {
  placeId: string
  label: string
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
  autocomplete(query: string, types?: string[]): Promise<PlaceAutocompleteResult[]>
  getPlace(placeId: string): Promise<PlaceDetails | null>
  autocompleteWithDetails(query: string, types?: string[]): Promise<PlaceDetails[]>
}
