export type GeoPointValue = {
  latitude?: string | number
  longitude?: string | number
}

export const GEO_POINT_SCHEMA = {
  type: 'object',
  properties: {
    latitude: {
      type: 'number',
    },
    longitude: {
      type: 'number',
    },
  },
  required: ['latitude', 'longitude'],
  additionalProperties: false,
} as const

const isGeoPointObject = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export const normalizeGeoPointValue = (value: unknown): GeoPointValue | undefined => {
  if (!isGeoPointObject(value))
    return undefined

  return {
    latitude: typeof value.latitude === 'number' || typeof value.latitude === 'string' ? value.latitude : undefined,
    longitude: typeof value.longitude === 'number' || typeof value.longitude === 'string' ? value.longitude : undefined,
  }
}

const parseCoordinate = (value: unknown) => {
  if (value === '' || value === undefined || value === null)
    return undefined

  if (typeof value === 'number')
    return Number.isFinite(value) ? value : Number.NaN

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed)
      return undefined
    const parsed = Number.parseFloat(trimmed)
    return Number.isFinite(parsed) ? parsed : Number.NaN
  }

  return Number.NaN
}

export const getGeoPointDefaultValue = (value?: GeoPointValue) => {
  return {
    latitude: value?.latitude ?? '',
    longitude: value?.longitude ?? '',
  }
}

export const isGeoPointEmpty = (value: unknown) => {
  const normalized = normalizeGeoPointValue(value)
  if (!normalized)
    return true

  return parseCoordinate(normalized.latitude) === undefined && parseCoordinate(normalized.longitude) === undefined
}

export const parseGeoPointValue = (value: unknown) => {
  const normalized = normalizeGeoPointValue(value)
  if (!normalized)
    throw new Error('invalid geo point value')

  const latitude = parseCoordinate(normalized.latitude)
  const longitude = parseCoordinate(normalized.longitude)

  if (latitude === undefined || longitude === undefined)
    throw new Error('geo point coordinates are required')
  if (Number.isNaN(latitude) || Number.isNaN(longitude))
    throw new Error('geo point coordinates must be numbers')
  if (latitude < -90 || latitude > 90)
    throw new Error('latitude out of range')
  if (longitude < -180 || longitude > 180)
    throw new Error('longitude out of range')

  return {
    latitude,
    longitude,
  }
}
