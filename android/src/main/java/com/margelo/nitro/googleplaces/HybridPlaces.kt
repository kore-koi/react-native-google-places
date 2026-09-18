package com.margelo.nitro.googleplaces

import android.util.Log
import com.margelo.nitro.NitroModules
import com.google.android.gms.maps.model.LatLng
import com.google.android.libraries.places.api.Places
import com.google.android.libraries.places.api.model.AutocompleteSessionToken
import com.google.android.libraries.places.api.model.CircularBounds
import com.google.android.libraries.places.api.model.Place
import com.google.android.libraries.places.api.model.RectangularBounds

import com.google.android.libraries.places.api.net.FetchPlaceRequest
import com.google.android.libraries.places.api.net.FindAutocompletePredictionsRequest
import com.google.android.libraries.places.api.net.PlacesClient
import com.margelo.nitro.core.NullType
import com.margelo.nitro.core.Promise
import kotlinx.coroutines.tasks.await

class HybridPlaces() : HybridPlacesSpec() {

    private val placesClient: PlacesClient

    // Accessed only inside synchronized(sessionTokens) in sessionTokenFor, so a
    // plain map is enough (getOrPut + remove is a compound op that a
    // synchronizedMap would not make atomic anyway). Insertion-ordered so the
    // eldest abandoned session is evicted once the cap is reached.
    private val sessionTokens =
        object : LinkedHashMap<String, AutocompleteSessionToken>() {
            override fun removeEldestEntry(
                eldest: MutableMap.MutableEntry<String, AutocompleteSessionToken>
            ): Boolean = size > MAX_SESSION_TOKENS
        }

    private fun sessionTokenFor(sessionId: String?, consume: Boolean): AutocompleteSessionToken {
        if (sessionId == null) {
            return AutocompleteSessionToken.newInstance()
        }
        synchronized(sessionTokens) {
            val token = sessionTokens.getOrPut(sessionId) { AutocompleteSessionToken.newInstance() }
            if (consume) {
                sessionTokens.remove(sessionId)
            }
            return token
        }
    }

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

    override fun autocomplete(query: String, options: AutocompleteOptions?): Promise<Array<PlaceAutocompleteResult>> {
        return Promise.async {
            val token = sessionTokenFor(options?.sessionToken, consume = false)
            val effectiveTypes = options?.types?.toList() ?: listOf("route", "street_address", "premise", "subpremise", "geocode")
            val requestBuilder = FindAutocompletePredictionsRequest.builder()
                .setSessionToken(token)
                .setQuery(query)
                .setTypesFilter(effectiveTypes)

            options?.countries?.let { requestBuilder.setCountries(it.toList()) }

            options?.locationBias?.let { bias ->
                bias.match(
                    first = { circular ->
                        requestBuilder.setLocationBias(
                            CircularBounds.newInstance(
                                LatLng(circular.latitude, circular.longitude),
                                circular.radius
                            )
                        )
                    },
                    second = { rectangular ->
                        requestBuilder.setLocationBias(
                            RectangularBounds.newInstance(
                                LatLng(rectangular.southWestLatitude, rectangular.southWestLongitude),
                                LatLng(rectangular.northEastLatitude, rectangular.northEastLongitude)
                            )
                        )
                    }
                )
            }

            options?.locationRestriction?.let { restriction ->
                restriction.match(
                    first = { circular ->
                        requestBuilder.setLocationRestriction(
                            CircularBounds.newInstance(
                                LatLng(circular.latitude, circular.longitude),
                                circular.radius
                            )
                        )
                    },
                    second = { rectangular ->
                        requestBuilder.setLocationRestriction(
                            RectangularBounds.newInstance(
                                LatLng(rectangular.southWestLatitude, rectangular.southWestLongitude),
                                LatLng(rectangular.northEastLatitude, rectangular.northEastLongitude)
                            )
                        )
                    }
                )
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

    override fun getPlace(placeId: String, options: GetPlaceOptions?): Promise<Variant_NullType_PlaceDetails> {
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
                    .setSessionToken(sessionTokenFor(options?.sessionToken, consume = true))
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

    override fun autocompleteWithDetails(query: String, options: AutocompleteOptions?): Promise<Array<PlaceDetails>> {
        return Promise.async {
            val predictions = autocomplete(query, options).await()
            val detailedResults = predictions.mapIndexedNotNull { index, prediction ->
                try {
                    // Only the first detail fetch closes the shared session; the
                    // rest use their own single-use tokens so we don't reuse a
                    // consumed one.
                    val detailToken = if (index == 0) options?.sessionToken else null
                    val variant = getPlace(prediction.placeId, GetPlaceOptions(detailToken)).await()
                    variant.asSecondOrNull()
                } catch (e: Exception) {
                    null
                }
            }
            detailedResults.toTypedArray()
        }
    }

    companion object {
        private const val MAX_SESSION_TOKENS = 100
    }
}