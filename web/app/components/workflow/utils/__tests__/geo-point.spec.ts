import { describe, expect, it } from 'vitest'
import {
  GEO_POINT_SCHEMA,
  getGeoPointDefaultValue,
  isGeoPointEmpty,
  normalizeGeoPointValue,
  parseGeoPointValue,
} from '../geo-point'

describe('geo-point utils', () => {
  it('should expose a fixed geo point json schema', () => {
    expect(GEO_POINT_SCHEMA).toEqual({
      type: 'object',
      properties: {
        latitude: { type: 'number' },
        longitude: { type: 'number' },
      },
      required: ['latitude', 'longitude'],
      additionalProperties: false,
    })
  })

  it('should normalize supported latitude and longitude values', () => {
    expect(normalizeGeoPointValue({ latitude: '31.23', longitude: 121.47 }))
      .toEqual({ latitude: '31.23', longitude: 121.47 })
  })

  it('should return empty defaults for missing values', () => {
    expect(getGeoPointDefaultValue()).toEqual({
      latitude: '',
      longitude: '',
    })
  })

  it('should treat missing coordinates as empty', () => {
    expect(isGeoPointEmpty(undefined)).toBe(true)
    expect(isGeoPointEmpty({ latitude: '', longitude: '' })).toBe(true)
  })

  it('should parse valid coordinates into numbers', () => {
    expect(parseGeoPointValue({ latitude: '31.23', longitude: '121.47' }))
      .toEqual({ latitude: 31.23, longitude: 121.47 })
  })

  it('should reject out-of-range latitude values', () => {
    expect(() => parseGeoPointValue({ latitude: 100, longitude: 121.47 }))
      .toThrow('latitude out of range')
  })

  it('should reject out-of-range longitude values', () => {
    expect(() => parseGeoPointValue({ latitude: 31.23, longitude: 181 }))
      .toThrow('longitude out of range')
  })
})
