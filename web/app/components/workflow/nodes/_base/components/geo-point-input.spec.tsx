import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GeoPointInput from './geo-point-input'

describe('GeoPointInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render latitude and longitude inputs', () => {
    render(
      <GeoPointInput
        value={{ latitude: '', longitude: '' }}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByPlaceholderText('appDebug.variableConfig.latitude')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('appDebug.variableConfig.longitude')).toBeInTheDocument()
  })

  it('should update latitude without dropping longitude', () => {
    const handleChange = vi.fn()
    render(
      <GeoPointInput
        value={{ latitude: '', longitude: '121.47' }}
        onChange={handleChange}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('appDebug.variableConfig.latitude'), {
      target: { value: '31.23' },
    })

    expect(handleChange).toHaveBeenCalledWith({
      latitude: '31.23',
      longitude: '121.47',
    })
  })

  it('should update longitude without dropping latitude', () => {
    const handleChange = vi.fn()
    render(
      <GeoPointInput
        value={{ latitude: '31.23', longitude: '' }}
        onChange={handleChange}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('appDebug.variableConfig.longitude'), {
      target: { value: '121.47' },
    })

    expect(handleChange).toHaveBeenCalledWith({
      latitude: '31.23',
      longitude: '121.47',
    })
  })
})
