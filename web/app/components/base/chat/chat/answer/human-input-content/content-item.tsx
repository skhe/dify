import type { ContentItemProps } from './type'
import * as React from 'react'
import { useMemo } from 'react'
import Input from '@/app/components/base/input'
import { Markdown } from '@/app/components/base/markdown'
import { PortalSelect } from '@/app/components/base/select'
import Textarea from '@/app/components/base/textarea'

const ContentItem = ({
  content,
  formInputFields,
  resolvedOptions,
  inputs,
  onInputChange,
}: ContentItemProps) => {
  const isInputField = (field: string) => {
    const outputVarRegex = /\{\{#\$output\.[^#]+#\}\}/
    return outputVarRegex.test(field)
  }

  const extractFieldName = (str: string): string => {
    const outputVarRegex = /\{\{#\$output\.([^#]+)#\}\}/
    const match = outputVarRegex.exec(str)
    return match ? match[1] : ''
  }

  const fieldName = useMemo(() => {
    return extractFieldName(content)
  }, [content])

  const formInputField = useMemo(() => {
    return formInputFields.find(field => field.output_variable_name === fieldName)
  }, [formInputFields, fieldName])
  const availableOptions = useMemo(() => {
    if (!formInputField)
      return []

    return resolvedOptions?.[fieldName] || formInputField.options || []
  }, [fieldName, formInputField, resolvedOptions])

  if (!isInputField(content)) {
    return (
      <Markdown content={content} />
    )
  }

  if (!formInputField)
    return null

  return (
    <div className="py-3">
      {formInputField.type === 'text-input' && (
        <Input
          value={inputs[fieldName] ?? ''}
          onChange={e => onInputChange(fieldName, e.target.value)}
          data-testid="content-item-input"
        />
      )}
      {formInputField.type === 'paragraph' && (
        <Textarea
          className="h-[104px] sm:text-xs"
          value={inputs[fieldName] ?? ''}
          onChange={(e) => { onInputChange(fieldName, e.target.value) }}
          data-testid="content-item-textarea"
        />
      )}
      {formInputField.type === 'select' && (
        <PortalSelect
          popupClassName="w-[240px]"
          value={inputs[fieldName] ?? formInputField.default?.value ?? ''}
          items={availableOptions.map(option => ({ value: option, name: option }))}
          onSelect={item => onInputChange(fieldName, item.value as string)}
          placeholder={fieldName}
        />
      )}
    </div>
  )
}

export default React.memo(ContentItem)
