package com.margelo.nitro.googleplaces

import android.util.Log
import com.margelo.nitro.NitroModules
import com.google.android.libraries.places.api.Places
import com.google.android.libraries.places.api.model.AutocompleteSessionToken
import com.google.android.libraries.places.api.model.Place
import com.google.android.libraries.places.api.model.CircularBounds
import com.google.android.gms.maps.model.LatLng
import com.google.android.libraries.places.api.net.FetchPlaceRequest
import com.google.android.libraries.places.api.net.FindAutocompletePredictionsRequest
import com.google.android.libraries.places.api.net.PlacesClient
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
                Places.initializeWithNewPlacesApiEnabled(context, apiKey)
            }
            println("[HybridPlaces] Places SDK initialized successfully.")
        } else {
            println("[HybridPlaces] ERROR: Missing API Key in AndroidManifest.xml")
        }
        
        placesClient = Places.createClient(context)
    }

    override fun autocomplete(query: String, lat: Double?, lng: Double?, radius: Double?): Promise<Array<PlaceAutocompleteResult>> {
        return Promise.async {
            val token = AutocompleteSessionToken.newInstance()
            val requestBuilder = FindAutocompletePredictionsRequest.builder()
                .setSessionToken(token)
                .setQuery(query)
                .setTypesFilter(listOf("route", "street_address", "premise", "subpremise", "geocode")) 

            if (lat != null && lng != null && radius != null) {
                val center = LatLng(lat, lng)
                val circle = CircularBounds.newInstance(center, radius)
                requestBuilder.setLocationBias(circle)
            }

            val response = placesClient.findAutocompletePredictions(requestBuilder.build()).await()
            
            response.getAutocompletePredictions().map { suggestion ->
                PlaceAutocompleteResult(
                    suggestion.placeId,
                    suggestion.getFullText(null).toString()
                )
            }.toTypedArray()
        }
    }

    override fun getPlace(placeId: String): Promise<Variant_NullType_PlaceDetails> {
        return Promise.async {
            try {
                val placeFields = listOf(
                    Place.Field.ID,
                    Place.Field.DISPLAY_NAME,
                    Place.Field.FORMATTED_ADDRESS,
                    Place.Field.ADDRESS_COMPONENTS,
                    Place.Field.LOCATION
                )

                val request = FetchPlaceRequest.builder(placeId, placeFields)
                    .setSessionToken(AutocompleteSessionToken.newInstance())
                    .build()

                val response = placesClient.fetchPlace(request).await()
                val place = response.place

                val components = place.addressComponents?.asList()?.map { component ->
                    AddressComponent(
                        component.name,
                        component.shortName ?: "",
                        component.types.toTypedArray()
                    )
                }?.toTypedArray() ?: emptyArray()

                val details = PlaceDetails(
                    place.displayName ?: "",
                    place.formattedAddress ?: "",
                    place.id ?: "",
                    place.location?.latitude ?: 0.0,
                    place.location?.longitude ?: 0.0,
                    components
                )

                Variant_NullType_PlaceDetails.create(details)
            } catch (e: Exception) {
                Log.e("HybridPlaces", "getPlace error: ${e.message}")
                Variant_NullType_PlaceDetails.create(NullType.NULL)
            }
        }
    }

    override fun autocompleteWithDetails(query: String, lat: Double?, lng: Double?, radius: Double?): Promise<Array<PlaceDetails>> {
        return Promise.async {
            val predictions = autocomplete(query, lat, lng, radius).await()
            val detailedResults = predictions.mapNotNull { prediction ->
                try {
                    val variant = getPlace(prediction.placeId).await()
                    variant.asSecondOrNull()
                } catch (e: Exception) {
                    null
                }
            }
            detailedResults.toTypedArray()
        }
    }
}