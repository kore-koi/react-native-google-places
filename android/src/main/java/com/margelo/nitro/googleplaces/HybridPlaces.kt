package com.margelo.nitro.googleplaces

import android.util.Log
import com.margelo.nitro.NitroModules
import com.google.android.libraries.places.api.Places
import com.google.android.libraries.places.api.model.AutocompleteSessionToken
import com.google.android.libraries.places.api.net.FindAutocompletePredictionsRequest
import com.google.android.libraries.places.api.net.PlacesClient
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
}