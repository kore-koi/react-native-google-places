import { ConfigPlugin } from '@expo/config-plugins';
export declare const withAndroidApiKey: ConfigPlugin<{
    androidApiKey?: string | null;
}>;
export declare const withIosApiKey: ConfigPlugin<{
    iosApiKey?: string | null;
}>;
declare const withGooglePlaces: ConfigPlugin<{
    androidApiKey?: string | null;
    iosApiKey?: string | null;
}>;
export default withGooglePlaces;
