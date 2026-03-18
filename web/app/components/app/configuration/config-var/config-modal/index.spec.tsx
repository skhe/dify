import type { InputVar } from '@/app/components/workflow/types'
import { act, fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Toast from '@/app/components/base/toast'
import { InputVarType } from '@/app/components/workflow/types'
import { GEO_POINT_SCHEMA } from '@/app/components/workflow/utils/geo-point'
import DebugConfigurationContext from '@/context/debug-configuration'
import { AppModeEnum } from '@/types/app'
import ConfigModal from './index'

vi.mock('@/app/components/app/store', () => ({
  useStore: (selector: (state: { appDetail: { mode: AppModeEnum } }) => unknown) => selector({
    appDetail: {
      mode: AppModeEnum.WORKFLOW,
    },
  }),
}))

const notifySpy = vi.spyOn(Toast, 'notify').mockImplementation(vi.fn())

type DebugConfigurationState = React.ComponentProps<typeof DebugConfigurationContext.Provider>['value']

const renderModal = (payload: InputVar, onConfirm = vi.fn()) => {
  return render(
    <DebugConfigurationContext.Provider
      value={{
        mode: AppModeEnum.WORKFLOW,
        dataSets: [],
        modelConfig: {
          model_id: 'test-model',
        },
      } as unknown as DebugConfigurationState}
    >
      <ConfigModal
        isShow
        payload={payload}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        supportGeoPoint
      />
    </DebugConfigurationContext.Provider>,
  )
}

describe('ConfigModal geo point', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    notifySpy.mockClear()
  })

  it('should save a geo point variable with fixed schema', () => {
    const handleConfirm = vi.fn()
    renderModal({
      type: InputVarType.geoPoint,
      variable: 'location',
      label: 'Location',
      required: true,
      json_schema: GEO_POINT_SCHEMA,
    } as InputVar, handleConfirm)

    act(() => {
      fireEvent.change(screen.getByPlaceholderText('appDebug.variableConfig.latitude'), {
        target: { value: '31.23' },
      })
      fireEvent.change(screen.getByPlaceholderText('appDebug.variableConfig.longitude'), {
        target: { value: '121.47' },
      })
    })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'common.operation.save' }))
    })

    expect(handleConfirm).toHaveBeenCalledWith(expect.objectContaining({
      type: InputVarType.geoPoint,
      variable: 'location',
      label: 'Location',
      json_schema: GEO_POINT_SCHEMA,
      default: {
        latitude: '31.23',
        longitude: '121.47',
      },
    }), undefined)
  })

  it('should reject invalid geo point defaults', () => {
    const handleConfirm = vi.fn()
    renderModal({
      type: InputVarType.geoPoint,
      variable: 'location',
      label: 'Location',
      required: false,
      json_schema: GEO_POINT_SCHEMA,
    } as InputVar, handleConfirm)

    act(() => {
      fireEvent.change(screen.getByPlaceholderText('appDebug.variableConfig.latitude'), {
        target: { value: '100' },
      })
      fireEvent.change(screen.getByPlaceholderText('appDebug.variableConfig.longitude'), {
        target: { value: '121.47' },
      })
    })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'common.operation.save' }))
    })

    expect(handleConfirm).not.toHaveBeenCalled()
    expect(Toast.notify).toHaveBeenCalledWith(expect.objectContaining({
      type: 'error',
      message: 'appDebug.variableConfig.errorMsg.invalidGeoPointDefault',
    }))
  })
})
