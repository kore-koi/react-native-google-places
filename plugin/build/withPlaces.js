"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var withPlaces_exports = {};
__export(withPlaces_exports, {
  default: () => withPlaces_default,
  withAndroidApiKey: () => withAndroidApiKey,
  withIosApiKey: () => withIosApiKey
});
module.exports = __toCommonJS(withPlaces_exports);
var import_config_plugins = require("@expo/config-plugins");
var import_Manifest = require("@expo/config-plugins/build/android/Manifest.js");
const withAndroidApiKey = (config, { androidApiKey }) => {
  return (0, import_config_plugins.withAndroidManifest)(config, (config2) => {
    const mainApplication = (0, import_Manifest.getMainApplicationOrThrow)(config2.modResults);
    if (androidApiKey) {
      (0, import_Manifest.addMetaDataItemToMainApplication)(
        mainApplication,
        "com.google.android.geo.API_KEY",
        androidApiKey
      );
    }
    return config2;
  });
};
const withIosApiKey = (config, props) => {
  return (0, import_config_plugins.withInfoPlist)(config, (config2) => {
    config2.modResults.GMSPlacesAPIKey = props.iosApiKey;
    return config2;
  });
};
const withGooglePlaces = (config, { androidApiKey = null, iosApiKey = null }) => {
  config = withAndroidApiKey(config, { androidApiKey });
  config = withIosApiKey(config, { iosApiKey });
  return config;
};
var withPlaces_default = withGooglePlaces;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  withAndroidApiKey,
  withIosApiKey
});
