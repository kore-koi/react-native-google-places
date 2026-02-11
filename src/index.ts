import { NitroModules } from "react-native-nitro-modules"
import type { Places } from "./specs/Places.nitro"

const places = NitroModules.createHybridObject<Places>("Places")

export default places
