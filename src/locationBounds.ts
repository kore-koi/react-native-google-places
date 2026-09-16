export class CircularLocationBounds {
  readonly type = "circular"
  readonly latitude: number
  readonly longitude: number
  readonly radius: number

  constructor(options: { latitude: number, longitude: number, radius: number }) {
    this.latitude = options.latitude
    this.longitude = options.longitude
    this.radius = options.radius
  }
}

export class RectangularLocationBounds {
  readonly type = "rectangular"
  readonly southWestLatitude: number
  readonly southWestLongitude: number
  readonly northEastLatitude: number
  readonly northEastLongitude: number

  constructor(options: {
    southWestLatitude: number
    southWestLongitude: number
    northEastLatitude: number
    northEastLongitude: number
  }) {
    this.southWestLatitude = options.southWestLatitude
    this.southWestLongitude = options.southWestLongitude
    this.northEastLatitude = options.northEastLatitude
    this.northEastLongitude = options.northEastLongitude
  }
}
