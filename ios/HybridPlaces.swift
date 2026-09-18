import Foundation
import CoreLocation
import NitroModules
import GooglePlaces


class HybridPlaces : HybridPlacesSpec {
      /// Native session tokens keyed by the caller-provided session id, so a
      /// single search reuses one token across keystrokes instead of minting a
      /// fresh (separately billed) token on every call. Accessed only on the
      /// main queue, matching where the Places SDK requests are issued.
      private var sessionTokens: [String: GMSAutocompleteSessionToken] = [:]
      /// Guards against unbounded growth from abandoned searches (a session that
      /// never reaches `getPlace`). Tokens also expire server-side after a few
      /// minutes, so evicting the oldest here is safe.
      private var sessionTokenOrder: [String] = []
      private let maxSessionTokens = 100

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

    /// Returns the session token to use for a request. When `sessionId` is nil a
    /// fresh single-use token is returned (legacy behaviour). Otherwise the token
    /// for that id is reused, creating one on first use. When `consume` is true
    /// (a `getPlace` call) the token is removed afterwards, closing the session.
    private func sessionToken(for sessionId: String?, consume: Bool) -> GMSAutocompleteSessionToken {
      guard let sessionId = sessionId else {
        return GMSAutocompleteSessionToken()
      }

      let token: GMSAutocompleteSessionToken
      if let existing = sessionTokens[sessionId] {
        token = existing
      } else {
        token = GMSAutocompleteSessionToken()
        sessionTokens[sessionId] = token
        sessionTokenOrder.append(sessionId)
        if sessionTokenOrder.count > maxSessionTokens {
          let oldest = sessionTokenOrder.removeFirst()
          sessionTokens.removeValue(forKey: oldest)
        }
      }

      if consume {
        sessionTokens.removeValue(forKey: sessionId)
        sessionTokenOrder.removeAll { $0 == sessionId }
      }

      return token
    }

    func autocomplete(query: String, options: AutocompleteOptions?) throws -> Promise<[PlaceAutocompleteResult]> {
      return Promise.async {
        try await withCheckedThrowingContinuation { continuation in
          DispatchQueue.main.async {
            let token = self.sessionToken(for: options?.sessionToken, consume: false)
            let filter = GMSAutocompleteFilter()
            filter.types = options?.types ?? ["route", "street_address", "premise", "subpremise", "geocode"]
            if let countries = options?.countries {
              filter.countries = countries
            }
            func toLocationOption(
              _ bounds: Variant_CircularLocationBounds_RectangularLocationBounds
            ) -> any GMSPlaceLocationBias & GMSPlaceLocationRestriction {
              switch bounds {
              case .first(let circular):
                let center = CLLocationCoordinate2D(
                  latitude: circular.latitude,
                  longitude: circular.longitude
                )
                return GMSPlaceCircularLocationOption(center, circular.radius)
              case .second(let rectangular):
                let northEast = CLLocationCoordinate2D(
                  latitude: rectangular.northEastLatitude,
                  longitude: rectangular.northEastLongitude
                )
                let southWest = CLLocationCoordinate2D(
                  latitude: rectangular.southWestLatitude,
                  longitude: rectangular.southWestLongitude
                )
                return GMSPlaceRectangularLocationOption(northEast, southWest)
              }
            }

            if let locationBias = options?.locationBias {
              filter.locationBias = toLocationOption(locationBias)
            }
            if let locationRestriction = options?.locationRestriction {
              filter.locationRestriction = toLocationOption(locationRestriction)
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

    func getPlace(placeId: String, options: GetPlaceOptions?) throws -> Promise<Variant_NullType_PlaceDetails> {
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
            let token = self.sessionToken(for: options?.sessionToken, consume: true)
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

    func autocompleteWithDetails(query: String, options: AutocompleteOptions?) throws -> Promise<[PlaceDetails]> {
        return Promise.async {
            let predictions = try await self.autocomplete(query: query, options: options).await()
            
            var detailedResults: [PlaceDetails] = []
            
            for (index, prediction) in predictions.enumerated() {
                // Only the first detail fetch closes the shared session; the rest
                // use their own single-use tokens so we don't reuse a consumed one.
                let detailToken = index == 0 ? options?.sessionToken : nil
                let placeResult = try await self.getPlace(placeId: prediction.placeId, options: GetPlaceOptions(sessionToken: detailToken)).await()
                
                if case .second(let details) = placeResult {
                  detailedResults.append(details)
                }
            }
            
            return detailedResults
        }
    }
}