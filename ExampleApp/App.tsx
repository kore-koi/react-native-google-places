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

  const run = async (selected: Mode) => {
    setMode(selected)
    setLoading(true)
    setError(null)
    setResults([])
    try {
      const res = await places.autocomplete(query, {
        countries: ["it"],
        locationBias:
          selected === "biasCircular"
            ? new CircularLocationBounds({ ...MILAN, radius: 5000 })
            : selected === "biasRectangular"
              ? new RectangularLocationBounds(MILAN_RECT)
              : undefined,
        locationRestriction:
          selected === "restrictCircular"
            ? new CircularLocationBounds({ ...MILAN, radius: 5000 })
            : selected === "restrictRectangular"
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

      <View style={styles.row}>
        <Button label={"None"} active={mode === "none"} onPress={() => run("none")}/>
        <Button label={"Bias ◯"} active={mode === "biasCircular"} onPress={() => run("biasCircular")}/>
        <Button label={"Bias ▭"} active={mode === "biasRectangular"} onPress={() => run("biasRectangular")}/>
        <Button label={"Restr ◯"} active={mode === "restrictCircular"} onPress={() => run("restrictCircular")}/>
        <Button label={"Restr ▭"} active={mode === "restrictRectangular"} onPress={() => run("restrictRectangular")}/>
      </View>

      {loading && <ActivityIndicator style={styles.spacer}/>}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        style={styles.spacer}
        data={results}
        keyExtractor={(item) => item.placeId}
        renderItem={({ item }) => (
          <View style={styles.itemBox}>
            <Text style={[styles.itemLabel, isDark && styles.textDark]}>{item.label}</Text>
            <Text style={styles.itemId}>{item.placeId}</Text>
          </View>
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
  itemBox: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#ccc" },
  itemLabel: { fontSize: 15, color: "#111" },
  itemId: { fontSize: 11, color: "#888", marginTop: 2 },
  empty: { color: "#888", marginTop: 24, textAlign: "center" },
})

export default App
