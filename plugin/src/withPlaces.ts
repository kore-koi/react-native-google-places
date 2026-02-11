import { ConfigPlugin, withAndroidManifest, withInfoPlist } from '@expo/config-plugins'
import { addMetaDataItemToMainApplication, getMainApplicationOrThrow } from '@expo/config-plugins/build/android/Manifest.js';

export const withAndroidApiKey: ConfigPlugin<{ androidApiKey?: string | null }> = (
  config,
  { androidApiKey }
) => {
  return withAndroidManifest(config, (config) => {
    const mainApplication = getMainApplicationOrThrow(config.modResults)

    if (androidApiKey) {
      addMetaDataItemToMainApplication(
        mainApplication,
        'com.google.android.geo.API_KEY',
        androidApiKey
      )
    }

    return config
  })
}

export const withIosApiKey: ConfigPlugin<{ iosApiKey?: string | null }> = (config, { iosApiKey }) => {
  return withInfoPlist(config, (config) => {
    if (iosApiKey) {
      config.modResults.GMSPlacesAPIKey = iosApiKey
    }
    return config
  })
}

const withGooglePlaces: ConfigPlugin<{ androidApiKey?: string | null; iosApiKey?: string | null }> = (config, { androidApiKey = null, iosApiKey = null }) => {
  config = withAndroidApiKey(config, { androidApiKey })
  config = withIosApiKey(config, { iosApiKey })
  return config;
}

export default withGooglePlaces
