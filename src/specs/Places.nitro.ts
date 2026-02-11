import { type HybridObject } from "react-native-nitro-modules"

interface PlaceAutocompleteResult {
  placeId: string
  label: string
}

export interface Places extends HybridObject<{
  ios: "swift"
  android: "kotlin"
}> {
  autocomplete(query: string): Promise<PlaceAutocompleteResult[]>
}
