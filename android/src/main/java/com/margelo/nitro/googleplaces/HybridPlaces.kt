package com.margelo.nitro.googleplaces

import android.util.Log
import com.margelo.nitro.NitroModules
import com.google.android.libraries.places.api.Places
import com.google.android.libraries.places.api.model.AutocompleteSessionToken
import com.google.android.libraries.places.api.model.Place
import com.google.android.libraries.places.api.net.FetchPlaceRequest
import com.google.android.libraries.places.api.net.FindAutocompletePredictionsRequest
import com.google.android.libraries.places.api.net.PlacesClient
import com.margelo.nitro.core.AnyMap
import com.margelo.nitro.core.AnyValue
import com.margelo.nitro.core.NullType
import com.margelo.nitro.core.Promise
import kotlinx.coroutines.tasks.await
class HybridPlaces() : HybridPlacesSpec() {

    private val placesClient: PlacesClient

    init {
        val context =
            NitroModules.applicationContext
                ?: throw IllegalStateException("React Context is not initialized")
        // Recupera l'API Key dal Manifest (meta-data) o stringhe
        val apiKey = context.packageManager
            .getApplicationInfo(context.packageName, android.content.pm.PackageManager.GET_META_DATA)
            .metaData.getString("com.google.android.geo.API_KEY")

        if (apiKey != null) {
            if (!Places.isInitialized()) {
                Places.initialize(context, apiKey)
            }
            println("[HybridPlaces] Places SDK initialized successfully.")
        } else {
            println("[HybridPlaces] ERROR: Missing API Key in AndroidManifest.xml")
        }
        
        placesClient = Places.createClient(context)
    }

    override fun autocomplete(query: String): Promise<Array<PlaceAutocompleteResult>> {

        return Promise.async {
            try {
                val token = AutocompleteSessionToken.newInstance()
                val typeFilter = listOf("address")

                val request = FindAutocompletePredictionsRequest.builder()
                    .setSessionToken(token)
                    .setQuery(query)
                    .setTypesFilter(typeFilter)
                    .build()

                val response = placesClient.findAutocompletePredictions(request).await()
                
                response.autocompletePredictions.map { prediction ->
                    PlaceAutocompleteResult(
                        prediction.placeId,
                        prediction.getFullText(null).toString()
                    )
                }.toTypedArray()

            } catch (e: Exception) {
                Log.e("HybridPlaces", "Errore SDK v5: ${e.message}")
                throw e
            }
        }
    }

    override fun getPlace(placeId: String): Promise<Variant_NullType_AnyMap> {
        return Promise.async {
            try {
                val placeFields = listOf(
                    Place.Field.ID,
                    Place.Field.DISPLAY_NAME,
                    Place.Field.FORMATTED_ADDRESS,
                    Place.Field.ADDRESS_COMPONENTS,
                    Place.Field.LOCATION
                )

                val token = AutocompleteSessionToken.newInstance()
                val request = FetchPlaceRequest.builder(placeId, placeFields)
                    .setSessionToken(token)
                    .build()

                val response = placesClient.fetchPlace(request).await()
                val place = response.place

                val data = AnyMap()
                data.setString("name", place.displayName ?: "")
                data.setString("formatted_address", place.formattedAddress ?: "")
                data.setString("place_id", place.id ?: "")
                data.setDouble("latitude", place.location?.latitude ?: 0.0)
                data.setDouble("longitude", place.location?.longitude ?: 0.0)

                place.addressComponents?.asList()?.forEach { component ->
                    val type = component.types.firstOrNull() ?: ""
                    if (type.isNotEmpty()) {
                        data.setString(type, component.name)
                    }
                }

                Variant_NullType_AnyMap.create(data)
            } catch (e: Exception) {
                Log.e("HybridPlaces", "getPlace error: ${e.message}")
                // Se il place non viene trovato, ritorna null
                if (e.message?.contains("NOT_FOUND") == true || e.message?.contains("INVALID_ARGUMENT") == true) {
                    Variant_NullType_AnyMap.create(NullType.INSTANCE)
                } else {
                    throw e
                }
            }
        }
    }
}