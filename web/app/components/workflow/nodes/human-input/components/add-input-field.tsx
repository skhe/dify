'use client'
import type { FC } from 'react'
import type { FormInputItem } from '../types'
import * as React from 'react'
import InputField from '@/app/components/base/prompt-editor/plugins/hitl-input-block/input-field'

type Props = {
  nodeId: string
  onSave: (newPayload: FormInputItem) => void
  onCancel: () => void
  existingNames?: string[]
  availableOptionsVars?: Array<{
    value: string[]
    name: string
  }>
}

const AddInputField: FC<Props> = ({
  nodeId,
  onSave,
  onCancel,
  existingNames,
  availableOptionsVars,
}) => {
  return (
    <InputField
      nodeId={nodeId}
      isEdit={false}
      onChange={onSave}
      onCancel={onCancel}
      existingNames={existingNames}
      availableOptionsVars={availableOptionsVars}
    />
  )
}
export default React.memo(AddInputField)
