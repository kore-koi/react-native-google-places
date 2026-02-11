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
                    label: prediction.attributedFullText.string,
                  )
                } ?? []

              continuation.resume(returning: mappedResults)
            }
          }
        }
      }
    }
}
