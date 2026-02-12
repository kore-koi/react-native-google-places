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

const results = await places.autocomplete('1600 Amphitheatre Pkwy, Mountain View')
// results: Array<{ placeId: string; label: string }>
```

## API

### `autocomplete(query: string)`

Returns a list of results with:

- `placeId`: the place id
- `label`: full display string for UI

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
