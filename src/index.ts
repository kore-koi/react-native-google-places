/* eslint-disable @typescript-eslint/no-misused-spread */
import { NitroModules } from "react-native-nitro-modules"
import type { Places, AutocompleteOptions as NativeOptions, GetPlaceOptions } from "./specs/Places.nitro"
import { CircularLocationBounds, RectangularLocationBounds } from "./locationBounds"

const native = NitroModules.createHybridObject<Places>("Places")

export type LocationBounds = CircularLocationBounds | RectangularLocationBounds
export type AutocompleteOptions = Omit<NativeOptions, "locationBias" | "locationRestriction"> & {
  locationBias?: LocationBounds
  locationRestriction?: LocationBounds
}
export type { GetPlaceOptions }

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

/** Returns a fresh session token (v4-style UUID) to reuse across one search. */
const createSessionToken = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const places = {
  autocomplete: (query: string, options?: AutocompleteOptions) => native.autocomplete(query, toNative(options)),
  getPlace: (placeId: string, options?: GetPlaceOptions) => native.getPlace(placeId, options),
  autocompleteWithDetails: (query: string, options?: AutocompleteOptions) => native.autocompleteWithDetails(query, toNative(options)),
  createSessionToken,
}

export { CircularLocationBounds, RectangularLocationBounds }
export type { AddressComponent, PlaceAutocompleteResult, PlaceDetails } from "./specs/Places.nitro"
export default places
