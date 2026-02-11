#include <jni.h>
#include "NitroGooglePlacesOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::googleplaces::initialize(vm);
}
