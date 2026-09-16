/* eslint-disable @typescript-eslint/no-misused-spread */
import { NitroModules } from "react-native-nitro-modules"
import type { Places, AutocompleteOptions as NativeOptions } from "./specs/Places.nitro"
import { CircularLocationBounds, RectangularLocationBounds } from "./locationBounds"

const native = NitroModules.createHybridObject<Places>("Places")

export type LocationBounds = CircularLocationBounds | RectangularLocationBounds
export type AutocompleteOptions = Omit<NativeOptions, "locationBias" | "locationRestriction"> & {
  locationBias?: LocationBounds
  locationRestriction?: LocationBounds
}

const toNative = (options?: AutocompleteOptions): NativeOptions | undefined => {
  if (!options) {
    return options
  }
  return {
    ...options,
    locationBias: options.locationBias ? { ...options.locationBias } : undefined,
    locationRestriction: options.locationRestriction ? { ...options.locationRestriction } : undefined,
  }
}

const places = {
  autocomplete: (query: string, options?: AutocompleteOptions) => native.autocomplete(query, toNative(options)),
  getPlace: (placeId: string) => native.getPlace(placeId),
  autocompleteWithDetails: (query: string, options?: AutocompleteOptions) => native.autocompleteWithDetails(query, toNative(options)),
}

export { CircularLocationBounds, RectangularLocationBounds }
export type { AddressComponent, PlaceAutocompleteResult, PlaceDetails } from "./specs/Places.nitro"
export default places
