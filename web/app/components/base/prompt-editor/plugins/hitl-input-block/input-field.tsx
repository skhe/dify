import type { FormInputItem, FormInputItemDefault } from '@/app/components/workflow/nodes/human-input/types'
import type { ValueSelector } from '@/app/components/workflow/types'
import { produce } from 'immer'
import * as React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Input from '@/app/components/base/input'
import { PortalSelect } from '@/app/components/base/select'
import Textarea from '@/app/components/base/textarea'
import { InputVarType } from '@/app/components/workflow/types'
import { getKeyboardKeyNameBySystem } from '@/app/components/workflow/utils'
import Button from '../../../button'
import PrePopulate from './pre-populate'

const i18nPrefix = 'nodes.humanInput.insertInputField'

type InputFieldProps = {
  nodeId: string
  isEdit: boolean
  payload?: FormInputItem
  existingNames?: string[]
  availableOptionsVars?: Array<{
    value: ValueSelector
    name: string
  }>
  onChange: (newPayload: FormInputItem) => void
  onCancel: () => void
}
const defaultPayload: FormInputItem = {
  type: InputVarType.paragraph,
  output_variable_name: '',
  default: { type: 'constant', selector: [], value: '' },
}
const InputField: React.FC<InputFieldProps> = ({
  nodeId,
  isEdit,
  payload,
  existingNames = [],
  availableOptionsVars = [],
  onChange,
  onCancel,
}) => {
  const { t } = useTranslation()
  const [tempPayload, setTempPayload] = useState(payload || defaultPayload)
  const nameValid = useMemo(() => {
    const name = tempPayload.output_variable_name.trim()
    if (!name)
      return false
    if (name.includes(' '))
      return false
    return /^[a-z_]\w{0,29}$/.test(name)
  }, [tempPayload.output_variable_name])
  const nameDuplicated = useMemo(() => {
    const name = tempPayload.output_variable_name.trim()
    if (!name)
      return false

    const originalName = payload?.output_variable_name.trim()
    return existingNames.some(existingName => existingName === name && existingName !== originalName)
  }, [existingNames, payload?.output_variable_name, tempPayload.output_variable_name])
  const isSelectInput = tempPayload.type === InputVarType.select
  const selectOptionsValid = useMemo(() => {
    if (!isSelectInput)
      return true
    if (tempPayload.options_selector?.length)
      return true
    return !!tempPayload.options?.length
  }, [isSelectInput, tempPayload.options, tempPayload.options_selector])
  const canSave = nameValid && !nameDuplicated && selectOptionsValid
  const dynamicOptionsSelectedItem = useMemo(() => {
    if (!tempPayload.options_selector?.length)
      return undefined

    const selectorKey = tempPayload.options_selector.join('.')
    return availableOptionsVars.find(item => item.value.join('.') === selectorKey)
  }, [availableOptionsVars, tempPayload.options_selector])
  const handleSave = useCallback(() => {
    if (!canSave)
      return
    onChange(tempPayload)
  }, [canSave, onChange, tempPayload])
  const defaultValueConfig = tempPayload.default
  const handleTypeChange = useCallback((type: InputVarType) => {
    setTempPayload((prev) => {
      const nextPayload = produce(prev, (draft) => {
        draft.type = type
        if (type !== InputVarType.select) {
          draft.options = undefined
          draft.options_selector = undefined
        }
        if (type === InputVarType.select && !draft.options && !draft.options_selector)
          draft.options = ['Option 1']
      })
      return nextPayload
    })
  }, [])
  const handleDefaultValueChange = useCallback((key: keyof FormInputItemDefault) => {
    return (value: ValueSelector | string) => {
      const nextValue = produce(tempPayload, (draft) => {
        if (!draft.default)
          draft.default = { type: 'constant', selector: [], value: '' }
        if (key === 'selector') {
          draft.default.type = 'variable'
          draft.default.selector = value as ValueSelector
        }
        else if (key === 'value') {
          draft.default.type = 'constant'
          draft.default.value = value as string
        }
        else if (key === 'type') {
          draft.default.type = value as 'constant' | 'variable'
        }
      })
      setTempPayload(nextValue)
    }
  }, [tempPayload])
  const handleOptionsChange = useCallback((value: string) => {
    const options = value
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean)
    setTempPayload(prev => ({
      ...prev,
      options,
      options_selector: undefined,
    }))
  }, [])
  const handleOptionsSelectorChange = useCallback((value: ValueSelector | string) => {
    setTempPayload(prev => ({
      ...prev,
      options_selector: value as ValueSelector,
      options: undefined,
    }))
  }, [])
  const useDynamicOptions = !!tempPayload.options_selector?.length
  const staticOptionsText = useMemo(() => (tempPayload.options || []).join('\n'), [tempPayload.options])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleSave])

  return (
    <div className="w-[372px] rounded-xl border-[0.5px] border-components-panel-border bg-components-panel-bg-blur p-3 shadow-lg backdrop-blur-[5px]">
      <div className="text-text-primary system-md-semibold">{t(`${i18nPrefix}.title`, { ns: 'workflow' })}</div>
      <div className="mt-3">
        <div className="text-text-secondary system-xs-medium">
          {t(`${i18nPrefix}.fieldType`, { ns: 'workflow' })}
        </div>
        <div className="mt-1.5">
          <PortalSelect
            value={tempPayload.type}
            items={[
              { value: InputVarType.textInput, name: t(`${i18nPrefix}.fieldTypes.textInput`, { ns: 'workflow' }) },
              { value: InputVarType.paragraph, name: t(`${i18nPrefix}.fieldTypes.paragraph`, { ns: 'workflow' }) },
              { value: InputVarType.select, name: t(`${i18nPrefix}.fieldTypes.select`, { ns: 'workflow' }) },
            ]}
            onSelect={item => handleTypeChange(item.value as InputVarType)}
          />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-text-secondary system-xs-medium">
          {t(`${i18nPrefix}.saveResponseAs`, { ns: 'workflow' })}
          <span className="relative text-text-destructive-secondary system-xs-regular">*</span>
        </div>
        <Input
          className="mt-1.5"
          placeholder={t(`${i18nPrefix}.saveResponseAsPlaceholder`, { ns: 'workflow' })}
          value={tempPayload.output_variable_name}
          onChange={(e) => {
            setTempPayload(prev => ({ ...prev, output_variable_name: e.target.value }))
          }}
          autoFocus
        />
        {tempPayload.output_variable_name && !nameValid && (
          <div className="mt-1 px-1 text-text-destructive-secondary system-xs-regular">
            {t(`${i18nPrefix}.variableNameInvalid`, { ns: 'workflow' })}
          </div>
        )}
        {tempPayload.output_variable_name && nameValid && nameDuplicated && (
          <div className="mt-1 px-1 text-text-destructive-secondary system-xs-regular">
            {t(`${i18nPrefix}.variableNameDuplicated`, { ns: 'workflow' })}
          </div>
        )}
      </div>
      {isSelectInput && (
        <div className="mt-4">
          <div className="mb-1.5 text-text-secondary system-xs-medium">
            {t(`${i18nPrefix}.selectOptions`, { ns: 'workflow' })}
          </div>
          {!selectOptionsValid && (
            <div className="mb-2 px-1 text-text-destructive-secondary system-xs-regular">
              {t(`${i18nPrefix}.selectOptionsRequired`, { ns: 'workflow' })}
            </div>
          )}
          {useDynamicOptions
            ? (
                <div className="space-y-2">
                  <PortalSelect
                    value={dynamicOptionsSelectedItem?.value.join('.') || ''}
                    items={availableOptionsVars.map(item => ({
                      value: item.value.join('.'),
                      name: item.name,
                    }))}
                    onSelect={(item) => {
                      const selected = availableOptionsVars.find(option => option.value.join('.') === item.value)
                      if (selected)
                        handleOptionsSelectorChange(selected.value)
                    }}
                    placeholder={t(`${i18nPrefix}.dynamicOptionsPlaceholder`, { ns: 'workflow' })}
                  />
                  <Button onClick={() => {
                    setTempPayload(prev => ({
                      ...prev,
                      options_selector: undefined,
                      options: prev.options || ['Option 1'],
                    }))
                  }}
                  >
                    {t(`${i18nPrefix}.useStaticOptions`, { ns: 'workflow' })}
                  </Button>
                </div>
              )
            : (
                <div className="space-y-2">
                  <Textarea
                    className="min-h-[96px]"
                    value={staticOptionsText}
                    onChange={e => handleOptionsChange(e.target.value)}
                    placeholder={t(`${i18nPrefix}.selectOptionsPlaceholder`, { ns: 'workflow' })}
                  />
                  <Button
                    disabled={!availableOptionsVars.length}
                    onClick={() => {
                      const firstSelector = availableOptionsVars[0]?.value
                      if (!firstSelector)
                        return
                      handleOptionsSelectorChange(firstSelector)
                    }}
                  >
                    {t(`${i18nPrefix}.useDynamicOptions`, { ns: 'workflow' })}
                  </Button>
                </div>
              )}
        </div>
      )}
      <div className="mt-4">
        <div className="mb-1.5 text-text-secondary system-xs-medium">
          {t(`${i18nPrefix}.prePopulateField`, { ns: 'workflow' })}
        </div>
        <PrePopulate
          isVariable={defaultValueConfig?.type === 'variable'}
          onIsVariableChange={(isVariable) => {
            handleDefaultValueChange('type')(isVariable ? 'variable' : 'constant')
          }}
          nodeId={nodeId}
          valueSelector={defaultValueConfig?.selector}
          onValueSelectorChange={handleDefaultValueChange('selector')}
          value={defaultValueConfig?.value}
          onValueChange={handleDefaultValueChange('value')}
        />
      </div>
      <div className="mt-4 flex justify-end space-x-2">
        <Button onClick={onCancel}>{t('operation.cancel', { ns: 'common' })}</Button>
        {isEdit
          ? (
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={!canSave}
              >
                {t('operation.save', { ns: 'common' })}
              </Button>
            )
          : (
              <Button
                className="flex"
                variant="primary"
                disabled={!canSave}
                onClick={handleSave}
              >
                <span className="mr-1">{t(`${i18nPrefix}.insert`, { ns: 'workflow' })}</span>
                <span className="mr-0.5 flex h-4 items-center rounded-[4px] bg-components-kbd-bg-white px-1 system-kbd">{getKeyboardKeyNameBySystem('ctrl')}</span>
                <span className="flex h-4 items-center rounded-[4px] bg-components-kbd-bg-white px-1 system-kbd">↩︎</span>
              </Button>
            )}

      </div>
    </div>
  )
}

export default InputField
