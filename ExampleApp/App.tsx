import { useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native"
import places, {
  CircularLocationBounds,
  RectangularLocationBounds,
  type PlaceAutocompleteResult,
  type PlaceDetails,
} from "@korekoi/react-native-google-places"

// Milan, roughly
const MILAN = { latitude: 45.4642, longitude: 9.19 }
const MILAN_RECT = {
  southWestLatitude: 45.40,
  southWestLongitude: 9.10,
  northEastLatitude: 45.52,
  northEastLongitude: 9.28,
}

type Mode = "none" | "biasCircular" | "biasRectangular" | "restrictCircular" | "restrictRectangular"

function App() {
  const isDark = useColorScheme() === "dark"
  const [query, setQuery] = useState("via")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<Mode>("none")
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<PlaceAutocompleteResult[]>([])

  // Session token handling.
  // - ON: one token is reused across every autocomplete call (and the getPlace
  //   on selection), so the whole search is billed as a single session.
  // - OFF: no token is passed, so each request mints its own single-use token
  //   and is billed separately.
  const [useSession, setUseSession] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [selected, setSelected] = useState<PlaceDetails | null>(null)

  const toggleSession = () => {
    if (useSession) {
      setUseSession(false)
      setToken(null)
    } else {
      setUseSession(true)
      setToken(places.createSessionToken())
    }
  }

  const newSession = () => setToken(places.createSessionToken())

  const run = async (selectedMode: Mode) => {
    setMode(selectedMode)
    setLoading(true)
    setError(null)
    setResults([])
    setSelected(null)
    try {
      const res = await places.autocomplete(query, {
        countries: ["it"],
        sessionToken: useSession ? token ?? undefined : undefined,
        locationBias:
          selectedMode === "biasCircular"
            ? new CircularLocationBounds({ ...MILAN, radius: 5000 })
            : selectedMode === "biasRectangular"
              ? new RectangularLocationBounds(MILAN_RECT)
              : undefined,
        locationRestriction:
          selectedMode === "restrictCircular"
            ? new CircularLocationBounds({ ...MILAN, radius: 5000 })
            : selectedMode === "restrictRectangular"
              ? new RectangularLocationBounds(MILAN_RECT)
              : undefined,
      })
      setResults(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const onSelect = async (placeId: string) => {
    setError(null)
    try {
      const detail = await places.getPlace(
        placeId,
        useSession && token ? { sessionToken: token } : undefined,
      )
      setSelected(detail)
      // Selecting a place closes the session, so rotate to a fresh token for
      // the next search.
      if (useSession) {
        setToken(places.createSessionToken())
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"}/>
      <Text style={[styles.title, isDark && styles.textDark]}>locationBias / restriction test</Text>

      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        value={query}
        onChangeText={setQuery}
        placeholder={"Query"}
        placeholderTextColor={isDark ? "#888" : "#aaa"}
        autoCapitalize={"none"}
      />

      <View style={styles.sessionRow}>
        <Checkbox label={"Reuse session token"} checked={useSession} isDark={isDark} onPress={toggleSession}/>
        {useSession && (
          <TouchableOpacity onPress={newSession}>
            <Text style={styles.newSession}>New session</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.sessionHint}>
        {useSession
          ? `Shared session — token ${token ? token.slice(0, 8) : "…"}`
          : "New single-use token per request (billed separately)"}
      </Text>

      <View style={styles.row}>
        <Button label={"None"} active={mode === "none"} onPress={() => run("none")}/>
        <Button label={"Bias ◯"} active={mode === "biasCircular"} onPress={() => run("biasCircular")}/>
        <Button label={"Bias ▭"} active={mode === "biasRectangular"} onPress={() => run("biasRectangular")}/>
        <Button label={"Restr ◯"} active={mode === "restrictCircular"} onPress={() => run("restrictCircular")}/>
        <Button label={"Restr ▭"} active={mode === "restrictRectangular"} onPress={() => run("restrictRectangular")}/>
      </View>

      {loading && <ActivityIndicator style={styles.spacer}/>}
      {error && <Text style={styles.error}>{error}</Text>}

      {selected && (
        <View style={styles.selectedBox}>
          <Text style={[styles.selectedName, isDark && styles.textDark]}>{selected.name}</Text>
          <Text style={styles.selectedAddress}>{selected.formatted_address}</Text>
        </View>
      )}

      <FlatList
        style={styles.spacer}
        data={results}
        keyExtractor={(item) => item.placeId}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.itemBox} onPress={() => onSelect(item.placeId)}>
            <Text style={[styles.itemLabel, isDark && styles.textDark]}>{item.label}</Text>
            <Text style={styles.itemId}>{item.placeId}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading && !error
            ? <Text style={[styles.empty, isDark && styles.textDark]}>No results yet</Text>
            : null
        }
      />
    </SafeAreaView>
  )
}

function Button({ label, active, onPress }: { label: string, active: boolean, onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.button, active && styles.buttonActive]} onPress={onPress}>
      <Text style={[styles.buttonText, active && styles.buttonTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

function Checkbox({ label, checked, isDark, onPress }: { label: string, checked: boolean, isDark: boolean, onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.checkboxRow} onPress={onPress}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={styles.checkboxMark}>✓</Text>}
      </View>
      <Text style={[styles.checkboxLabel, isDark && styles.textDark]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  containerDark: { backgroundColor: "#111" },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 12, color: "#111" },
  textDark: { color: "#eee" },
  input: {
    borderWidth: 1, borderColor: "#ccc", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: "#111",
  },
  inputDark: { borderColor: "#444", color: "#eee" },
  sessionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  newSession: { color: "#2563eb", fontWeight: "600", fontSize: 13 },
  sessionHint: { color: "#888", fontSize: 12, marginTop: 4 },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: "#999",
    alignItems: "center", justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  checkboxMark: { color: "#fff", fontSize: 14, fontWeight: "700", lineHeight: 16 },
  checkboxLabel: { fontSize: 14, color: "#333" },
  row: { flexDirection: "row", gap: 6, marginTop: 12 },
  button: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    backgroundColor: "#e5e5e5", alignItems: "center",
  },
  buttonActive: { backgroundColor: "#2563eb" },
  buttonText: { fontWeight: "600", color: "#333", fontSize: 12 },
  buttonTextActive: { color: "#fff" },
  spacer: { marginTop: 16 },
  error: { marginTop: 16, color: "#dc2626" },
  selectedBox: {
    marginTop: 16, padding: 12, borderRadius: 8,
    backgroundColor: "#eef2ff", borderWidth: 1, borderColor: "#c7d2fe",
  },
  selectedName: { fontSize: 15, fontWeight: "600", color: "#111" },
  selectedAddress: { fontSize: 13, color: "#555", marginTop: 2 },
  itemBox: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#ccc" },
  itemLabel: { fontSize: 15, color: "#111" },
  itemId: { fontSize: 11, color: "#888", marginTop: 2 },
  empty: { color: "#888", marginTop: 24, textAlign: "center" },
})

export default App
