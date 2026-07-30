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

// Autocomplete with full place details
const details = await places.autocompleteWithDetails('1600 Amphitheatre Pkwy')
// details: Array<PlaceDetails>

// Get details for a specific place
const place = await places.getPlace('ChIJN1t_tDeuEmsRUsoyG83frY4')
// place: PlaceDetails | null
```

## API

### `autocomplete(query: string, options?: AutocompleteOptions)`

Returns a list of autocomplete predictions.

**Parameters:**

- `query` – the search string
- `options` *(optional)* – an `AutocompleteOptions` object:
  - `types` *(optional)* – array of [place type filters](https://developers.google.com/maps/documentation/places/web-service/supported_types). Defaults to `["route", "street_address", "premise", "subpremise", "geocode"]`.
  - `countries` *(optional)* – array of [ISO 3166-1 Alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) country codes to restrict results to (e.g. `["it", "fr"]`). Max 5. When omitted, results are not restricted by country.

**Returns:** `Promise<PlaceAutocompleteResult[]>`

- `placeId`: the place id
- `label`: full display string for UI

---

### `autocompleteWithDetails(query: string, options?: AutocompleteOptions)`

Same as `autocomplete`, but fetches full place details for each result.

**Parameters:**

- `query` – the search string
- `options` *(optional)* – same `AutocompleteOptions` object as `autocomplete`

**Returns:** `Promise<PlaceDetails[]>`

---

### `getPlace(placeId: string)`

Fetches details for a single place by its ID.

**Parameters:**

- `placeId` – a Google Place ID

**Returns:** `Promise<PlaceDetails | null>`

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
