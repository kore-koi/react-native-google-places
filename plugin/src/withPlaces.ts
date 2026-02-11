import { ConfigPlugin, withAndroidManifest, withInfoPlist } from '@expo/config-plugins'
import { addMetaDataItemToMainApplication, getMainApplicationOrThrow } from '@expo/config-plugins/build/android/Manifest.js';

type Props = {
  iosApiKey?: string | null
  androidApiKey?: string | null
}

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

export const withIosApiKey: ConfigPlugin<{ iosApiKey?: string | null }> = (config, props) => {
  return withInfoPlist(config, (config) => {
    config.modResults.GMSPlacesAPIKey = props.iosApiKey
    return config
  })
}

const withGooglePlaces: ConfigPlugin<Props> = (config, { androidApiKey = null, iosApiKey = null }) => {
  config = withAndroidApiKey(config, { androidApiKey })
  config = withIosApiKey(config, { iosApiKey })
  return config;
}

export default withGooglePlaces
