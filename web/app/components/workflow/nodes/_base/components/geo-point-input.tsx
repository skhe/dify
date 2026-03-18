'use client'
import type { FC } from 'react'
import type { GeoPointValue } from '@/app/components/workflow/utils/geo-point'
import * as React from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Input from '@/app/components/base/input'
import { getGeoPointDefaultValue } from '@/app/components/workflow/utils/geo-point'

type Props = {
  value?: GeoPointValue
  onChange: (value: GeoPointValue) => void
  disabled?: boolean
  autoFocus?: boolean
}

const GeoPointInput: FC<Props> = ({
  value,
  onChange,
  disabled,
  autoFocus,
}) => {
  const { t } = useTranslation()
  const normalizedValue = useMemo(() => getGeoPointDefaultValue(value), [value])

  return (
    <div className="grid grid-cols-2 gap-2">
      <Input
        type="number"
        disabled={disabled}
        autoFocus={autoFocus}
        value={normalizedValue.latitude}
        placeholder={t('variableConfig.latitude', { ns: 'appDebug' })}
        onChange={e => onChange({
          ...normalizedValue,
          latitude: e.target.value,
        })}
      />
      <Input
        type="number"
        disabled={disabled}
        value={normalizedValue.longitude}
        placeholder={t('variableConfig.longitude', { ns: 'appDebug' })}
        onChange={e => onChange({
          ...normalizedValue,
          longitude: e.target.value,
        })}
      />
    </div>
  )
}

export default React.memo(GeoPointInput)
