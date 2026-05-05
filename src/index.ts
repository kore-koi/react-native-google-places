import { NitroModules } from "react-native-nitro-modules"
import type { Places, AddressComponent, PlaceAutocompleteResult, PlaceDetails } from "./specs/Places.nitro"
const places = NitroModules.createHybridObject<Places>("Places")

export type { AddressComponent, PlaceAutocompleteResult, PlaceDetails }
export default places
