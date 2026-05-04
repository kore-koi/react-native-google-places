import Foundation
import NitroModules
import GooglePlaces
import CoreLocation

class HybridPlaces : HybridPlacesSpec {
      override init() {
          super.init()
        DispatchQueue.main.async {
                if let apiKey = Bundle.main.object(forInfoDictionaryKey: "GMSPlacesAPIKey") as? String {
                    GMSPlacesClient.provideAPIKey(apiKey)
                    print("[HybridPlaces] GMSPlacesClient API key provided successfully.")
                } else {
                    print("[HybridPlaces] ERROR: Missing GMSPlacesAPIKey in Info.plist")
                }
            }
      }
  
    func autocomplete(query: String, lat: Double?, lng: Double?, radius: Double?) throws -> Promise<[PlaceAutocompleteResult]> {
      return Promise.async {
        try await withCheckedThrowingContinuation { continuation in
          DispatchQueue.main.async {
            let token = GMSAutocompleteSessionToken()
            let filter = GMSAutocompleteFilter()
            filter.types = ["route", "street_address", "premise", "subpremise", "geocode"]
            if let lat = lat, let lng = lng, let radius = radius {
                let center = CLLocationCoordinate2D(latitude: lat, longitude: lng)
                filter.locationBias = GMSPlaceCircularLocationOption(center, radius)
            }

            let request = GMSAutocompleteRequest(query: query)
            request.filter = filter
            request.sessionToken = token

            GMSPlacesClient.shared().fetchAutocompleteSuggestions(
              from: request,
              callback: { (results, error) in

              if let error = error {
                continuation.resume(
                  throwing: RuntimeError.error(
                    withMessage: error.localizedDescription
                  )
                )
                return
              }
                
              let mappedResults: [PlaceAutocompleteResult] =
                results?.reduce(into: []) { (acc, prediction) in
                  if let suggestion = prediction.placeSuggestion {
                    let item = PlaceAutocompleteResult(
                      placeId: suggestion.placeID,
                      label: suggestion.attributedFullText.string
                    )
                    acc.append(item)
                  }
                } ?? []

              continuation.resume(returning: mappedResults)
            })
          }
        }
      }
    }

    func getPlace(placeId: String) throws -> Promise<Variant_NullType_PlaceDetails> {
      return Promise.async {
        try await withCheckedThrowingContinuation { continuation in
          DispatchQueue.main.async {
            let myProperties = [
                GMSPlaceProperty.placeID,
                GMSPlaceProperty.name,
                GMSPlaceProperty.formattedAddress,
                GMSPlaceProperty.addressComponents,
                GMSPlaceProperty.coordinate
            ].map {$0.rawValue}
            let token = GMSAutocompleteSessionToken()
            let fetchPlaceRequest = GMSFetchPlaceRequest(placeID: placeId, placeProperties: myProperties, sessionToken: token)
                    
            GMSPlacesClient.shared().fetchPlace(with: fetchPlaceRequest) { place, error in
              if let error = error as NSError? {
                if error.domain == kGMSPlacesErrorDomain && error.code == 400 {
                    continuation.resume(returning: .first(NullType.null))
                    return
                }
                
                continuation.resume(
                  throwing: error
                )
                return
              }

              if let place = place {
                  let components = place.addressComponents?.map { component in
                      AddressComponent(
                          name: component.name,
                          short_name: component.shortName ?? "",
                          types: component.types
                      )
                  } ?? []
                  
                  let details = PlaceDetails(
                      name: place.name ?? "",
                      formatted_address: place.formattedAddress ?? "",
                      place_id: place.placeID ?? "",
                      latitude: place.coordinate.latitude,
                      longitude: place.coordinate.longitude,
                      address_components: components
                  )
                  
                  continuation.resume(returning: .second(details))
              } else {
                  continuation.resume(returning: .first(NullType.null))
              }
              
            }
          }
        }
      }
    }

    func autocompleteWithDetails(query: String, lat: Double?, lng: Double?, radius: Double?) throws -> Promise<[PlaceDetails]> {
        return Promise.async {
            let predictions = try await self.autocomplete(query: query, lat: lat, lng: lng, radius: radius).await()
            
            var detailedResults: [PlaceDetails] = []
            
            for prediction in predictions {
                let placeResult = try await self.getPlace(placeId: prediction.placeId).await()
                
                if case .second(let details) = placeResult {
                  detailedResults.append(details)
                }
            }
            
            return detailedResults
        }
    }
}