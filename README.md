# @korekoi/react-native-google-places

Nitro wrapper around the Google Places SDK with a single API for address autocomplete.

## Reasons to use this module:
- You can now use the Google Places SDK in your React Native app providing a restricted API key on your bundle identifiers so that you don't have to expose an open API key to the public.
- The module provides a simple API for address autocomplete, returning only the place ID and a display string for UI

## Install

```bash
npm install @korekoi/react-native-google-places react-native-nitro-modules
```

```bash
cd ios && pod install
```

## API key setup

You can set the API key either manually or via the Expo config plugin.

### Expo config plugin (iOS + Android)

```json
{
  "expo": {
    "plugins": [
      [
        "@korekoi/react-native-google-places",
        { "androidApiKey": "YOUR_ANDROID_API_KEY", "iosApiKey": "YOUR_IOS_API_KEY" }
      ]
    ]
  }
}
```

### Manual setup

#### iOS

Add `GMSPlacesAPIKey` to `Info.plist`:

```xml
<key>GMSPlacesAPIKey</key>
<string>YOUR_IOS_API_KEY</string>
```

#### Android

Add the meta-data entry in `AndroidManifest.xml`:

```xml
<application>
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_ANDROID_API_KEY" />
</application>
```

## Usage

```ts
import places from '@korekoi/react-native-google-places'

// Basic autocomplete
const results = await places.autocomplete('1600 Amphitheatre Pkwy, Mountain View')
// results: Array<{ placeId: string; label: string }>

// Autocomplete with custom type filters
const results2 = await places.autocomplete('Roma', {
  types: ['locality', 'administrative_area_level_3'],
})

// Autocomplete restricted to one or more countries (ISO 3166-1 Alpha-2, max 5)
const results3 = await places.autocomplete('Roma', { countries: ['it'] })

// Bias results towards an area (soft: prefers, does not exclude)
import places, { CircularLocationBounds, RectangularLocationBounds } from '@korekoi/react-native-google-places'

await places.autocomplete('Roma', {
  locationBias: new CircularLocationBounds({ latitude: 45.46, longitude: 9.19, radius: 5000 }),
})

// Restrict results strictly within an area (hard: excludes the rest)
await places.autocomplete('Roma', {
  locationRestriction: new RectangularLocationBounds({
    southWestLatitude: 45.40, southWestLongitude: 9.10,
    northEastLatitude: 45.52, northEastLongitude: 9.28,
  }),
})

// Autocomplete with full place details
const details = await places.autocompleteWithDetails('1600 Amphitheatre Pkwy')
// details: Array<PlaceDetails>

// Get details for a specific place
const place = await places.getPlace('ChIJN1t_tDeuEmsRUsoyG83frY4')
// place: PlaceDetails | null
```

## Session tokens (optional, reduces billing)

Google bills **per session**, not per request. A session groups all
the autocomplete requests plus the final place-details lookup,
and is billed once. Without a session token, every request is billed
individually — so reusing one token across a search can cut costs.

**Important**: by _Google's_ own definition, a session starts with an
`autocomplete` request (optionally followed by further `autocomplete` requests)
and ends with a single `getPlace` call. If you do NOT end the session with a
`getPlace` call, each `autocomplete` request is billed individually, as if no
session token were used (see
[pricing for incomplete or abandoned sessions](https://developers.google.com/maps/documentation/places/web-service/session-pricing#pricing-for-incomplete-or-abandoned-sessions)).

To opt in, create one token per search, pass it via `options.sessionToken` on
every `autocomplete` call, then hand it to `getPlace` to close the session:

```ts
import places from '@korekoi/react-native-google-places'

// Start of a search: create one token
let sessionToken = places.createSessionToken()

// As the user types, reuse the same token on each keystroke
await places.autocomplete('via ro', { sessionToken })
await places.autocomplete('via roma', { sessionToken })

// User picks a result: close the session with the same token
const place = await places.getPlace(selectedPlaceId, { sessionToken })

// For the next search, create a fresh token
sessionToken = places.createSessionToken()
```

Good to know:

- **Omitting `sessionToken` is fine.** Each call then mints its own single-use
  token and every request is billed separately. Use tokens only when you want
  the session-based billing.
- **You must pass the token to `getPlace` for the savings to apply.** A session
  only becomes billable as a session when the terminating `getPlace` carries the
  same token — that is what makes the in-session `autocomplete` requests free. If
  no `getPlace` closes the session, it counts as *abandoned* and every
  `autocomplete` reverts to per-request billing, so the token brings no benefit.
  This is why `sessionToken` lives on both `autocomplete` and `getPlace`. See
  [session pricing](https://developers.google.com/maps/documentation/places/web-service/session-pricing).
- **Recreate the token for each new search.** A token is valid for one search
  and sessions are short-lived (a few minutes). Reusing a concluded or expired
  token simply falls back to per-request billing — nothing breaks.
- **Abandoned searches** (no selection, so no `getPlace`) are billed per
  request; just create a new token when the next search starts.
- The token can be any unique string; `createSessionToken()` is a convenience
  that returns a v4-style UUID.

### Session tokens with `autocompleteWithDetails`

`autocompleteWithDetails` accepts `sessionToken` in its options, but keep in
mind what the method does: it runs one `autocomplete` and then **one place
details fetch per prediction**. A Google session, however, allows only *one*
place details request — so the token is applied to the first details fetch,
which bills that fetch together with the `autocomplete` as a single session.
The remaining details fetches are billed separately no matter what (that is
inherent to the method, not a limitation of the token). Passing a token is
still worthwhile: it folds the `autocomplete` into a real session instead of
leaving it billed per request.

See Google's [session tokens](https://developers.google.com/maps/documentation/places/web-service/place-session-tokens)
and [session pricing](https://developers.google.com/maps/documentation/places/web-service/session-pricing) docs.

## API

### `autocomplete(query: string, options?: AutocompleteOptions)`

Returns a list of autocomplete predictions.

**Parameters:**

- `query` – the search string
- `options` *(optional)* – an `AutocompleteOptions` object:
  - `types` *(optional)* – array of [place type filters](https://developers.google.com/maps/documentation/places/web-service/supported_types). Defaults to `["route", "street_address", "premise", "subpremise", "geocode"]`.
  - `countries` *(optional)* – array of [ISO 3166-1 Alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) country codes to restrict results to (e.g. `["it", "fr"]`). Max 5. When omitted, results are not restricted by country.
  - `locationBias` *(optional)* – `CircularLocationBounds` or `RectangularLocationBounds`. Prefers results in the area without excluding others.
  - `locationRestriction` *(optional)* – `CircularLocationBounds` or `RectangularLocationBounds`. Excludes results outside the area.
  - `sessionToken` *(optional)* – groups this search into one billing session. See [Session tokens](#session-tokens-optional-reduces-billing).

**Returns:** `Promise<PlaceAutocompleteResult[]>`

- `placeId`: the place id
- `label`: full display string for UI

---

### `autocompleteWithDetails(query: string, options?: AutocompleteOptions)`

Same as `autocomplete`, but fetches full place details for each result.

**Parameters:**

- `query` – the search string
- `options` *(optional)* – same `AutocompleteOptions` object as `autocomplete`, including `sessionToken` (see [Session tokens with `autocompleteWithDetails`](#session-tokens-with-autocompletewithdetails) for how it applies here)

**Returns:** `Promise<PlaceDetails[]>`

---

### `getPlace(placeId: string, options?: GetPlaceOptions)`

Fetches details for a single place by its ID.

**Parameters:**

- `placeId` – a Google Place ID
- `options` *(optional)* – a `GetPlaceOptions` object:
  - `sessionToken` *(optional)* – the token from the preceding `autocomplete` calls. Passing it closes that billing session. See [Session tokens](#session-tokens-optional-reduces-billing).

**Returns:** `Promise<PlaceDetails | null>`

---

### `createSessionToken()`

Returns a new session token (v4-style UUID string) to reuse across the requests of a single search. See [Session tokens](#session-tokens-optional-reduces-billing).

**Returns:** `string`

---

### Types

```ts
interface PlaceAutocompleteResult {
  placeId: string
  label: string
}

interface PlaceDetails {
  name: string
  formatted_address: string
  place_id: string
  latitude: number
  longitude: number
  address_components: AddressComponent[]
}

interface AddressComponent {
  name: string
  short_name: string
  types: string[]
}

// Both bounds work as either locationBias or locationRestriction.
new CircularLocationBounds({ latitude, longitude, radius }) // radius in meters
new RectangularLocationBounds({ southWestLatitude, southWestLongitude, northEastLatitude, northEastLongitude })
```

## Notes

- iOS initializes the SDK using `GMSPlacesAPIKey` from `Info.plist`.
- Android reads the key from `com.google.android.geo.API_KEY` in the manifest.
- Requires `react-native-nitro-modules` and generated Nitro code in `nitrogen/`.

## Development

```bash
npm run specs
```

## License

MIT
