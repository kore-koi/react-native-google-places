import Foundation
import NitroModules
import GooglePlaces

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
  
    func autocomplete(query: String) throws -> Promise<[PlaceAutocompleteResult]> {
      return Promise.async {
        try await withCheckedThrowingContinuation { continuation in
          DispatchQueue.main.async {
            let token = GMSAutocompleteSessionToken()
            let filter = GMSAutocompleteFilter()
            filter.types = ["address"]
            GMSPlacesClient.shared().findAutocompletePredictions(
              fromQuery: query,
              filter: filter,
              sessionToken: token
            ) { results, error in

              if let error = error {
                continuation.resume(
                  throwing: RuntimeError.error(
                    withMessage: error.localizedDescription
                  )
                )
                return
              }

              let mappedResults: [PlaceAutocompleteResult] =
                results?.map { prediction in
                  return PlaceAutocompleteResult(
                    placeId: prediction.placeID,
                    label: prediction.attributedFullText.string
                  )
                } ?? []

              continuation.resume(returning: mappedResults)
            }
          }
        }
      }
    }

    func getPlace(placeId: String) throws -> Promise<Variant_NullType_AnyMap> {
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
                var data: [String: Any] = [
                      "name": place.name ?? "",
                      "formatted_address": place.formattedAddress ?? "",
                      "place_id": place.placeID ?? "",
                      "latitude": place.coordinate.latitude,
                      "longitude": place.coordinate.longitude,
                  ]
                
                
                if let components = place.addressComponents {
                    for component in components {
                      let type = component.types.first ?? ""
                      if (type != "") {
                        data[type] = component.name
                      }
                    }
                }
                  
                  do {
                      let anyMap = try AnyMap.fromDictionary(data)
                      continuation.resume(returning: .second(anyMap))
                  } catch {
                      continuation.resume(throwing: RuntimeError.error(withMessage: "Errore conversione AnyMap"))
                  }
              } else {
                  continuation.resume(returning: .first(NullType.null))
              }
              
            }
          }
        }
      }
    }
}

