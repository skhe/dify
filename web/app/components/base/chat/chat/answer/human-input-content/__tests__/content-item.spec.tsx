import type { FormInputItem } from '@/app/components/workflow/nodes/human-input/types'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ContentItem from '../content-item'

vi.mock('@/app/components/base/markdown', () => ({
  Markdown: ({ content }: { content: string }) => <div data-testid="mock-markdown">{content}</div>,
}))

describe('ContentItem', () => {
  const mockOnInputChange = vi.fn()
  const mockFormInputFields: FormInputItem[] = [
    {
      type: 'paragraph',
      output_variable_name: 'user_bio',
      default: {
        type: 'constant',
        value: '',
        selector: [],
      },
    } as FormInputItem,
  ]
  const mockInputs = {
    user_bio: 'Initial bio',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render Markdown for literal content', () => {
    render(
      <ContentItem
        content="Hello world"
        formInputFields={[]}
        inputs={{}}
        onInputChange={mockOnInputChange}
      />,
    )

    expect(screen.getByTestId('mock-markdown')).toHaveTextContent('Hello world')
    expect(screen.queryByTestId('content-item-textarea')).not.toBeInTheDocument()
  })

  it('should render Textarea for valid output variable content', () => {
    render(
      <ContentItem
        content="{{#$output.user_bio#}}"
        formInputFields={mockFormInputFields}
        inputs={mockInputs}
        onInputChange={mockOnInputChange}
      />,
    )

    const textarea = screen.getByTestId('content-item-textarea')
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveValue('Initial bio')
    expect(screen.queryByTestId('mock-markdown')).not.toBeInTheDocument()
  })

  it('should render Input for text-input fields', () => {
    render(
      <ContentItem
        content="{{#$output.user_bio#}}"
        formInputFields={[
          {
            type: 'text-input',
            output_variable_name: 'user_bio',
            default: {
              type: 'constant',
              value: '',
              selector: [],
            },
          } as FormInputItem,
        ]}
        inputs={mockInputs}
        onInputChange={mockOnInputChange}
      />,
    )

    const input = screen.getByTestId('content-item-input')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('Initial bio')
    expect(screen.queryByTestId('content-item-textarea')).not.toBeInTheDocument()
  })

  it('should render Select for select fields', () => {
    render(
      <ContentItem
        content="{{#$output.user_bio#}}"
        formInputFields={[
          {
            type: 'select',
            output_variable_name: 'user_bio',
            default: {
              type: 'constant',
              value: '',
              selector: [],
            },
            options: ['Option A', 'Option B'],
          } as FormInputItem,
        ]}
        resolvedOptions={{ user_bio: ['Option A', 'Option B'] }}
        inputs={{ user_bio: 'Option B' }}
        onInputChange={mockOnInputChange}
      />,
    )

    expect(screen.getByText('Option B')).toBeInTheDocument()
    expect(screen.queryByTestId('content-item-input')).not.toBeInTheDocument()
    expect(screen.queryByTestId('content-item-textarea')).not.toBeInTheDocument()
  })

  it('should call onInputChange when textarea value changes', async () => {
    const user = userEvent.setup()
    render(
      <ContentItem
        content="{{#$output.user_bio#}}"
        formInputFields={mockFormInputFields}
        inputs={mockInputs}
        onInputChange={mockOnInputChange}
      />,
    )

    const textarea = screen.getByTestId('content-item-textarea')
    await user.type(textarea, 'x')

    expect(mockOnInputChange).toHaveBeenCalledWith('user_bio', 'Initial biox')
  })

  it('should call onInputChange when text input value changes', async () => {
    const user = userEvent.setup()
    render(
      <ContentItem
        content="{{#$output.user_bio#}}"
        formInputFields={[
          {
            type: 'text-input',
            output_variable_name: 'user_bio',
            default: {
              type: 'constant',
              value: '',
              selector: [],
            },
          } as FormInputItem,
        ]}
        inputs={mockInputs}
        onInputChange={mockOnInputChange}
      />,
    )

    const input = screen.getByTestId('content-item-input')
    await user.type(input, 'x')

    expect(mockOnInputChange).toHaveBeenCalledWith('user_bio', 'Initial biox')
  })

  it('should render nothing if field name is valid but not found in formInputFields', () => {
    const { container } = render(
      <ContentItem
        content="{{#$output.unknown_field#}}"
        formInputFields={mockFormInputFields}
        inputs={mockInputs}
        onInputChange={mockOnInputChange}
      />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('should render an empty wrapper if input type is not supported', () => {
    const { container } = render(
      <ContentItem
        content="{{#$output.user_bio#}}"
        formInputFields={[
          {
            type: 'number',
            output_variable_name: 'user_bio',
            default: {
              type: 'constant',
              value: '',
              selector: [],
            },
          } as FormInputItem,
        ]}
        inputs={mockInputs}
        onInputChange={mockOnInputChange}
      />,
    )

    expect(container.querySelector('[data-testid="content-item-input"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-testid="content-item-textarea"]')).not.toBeInTheDocument()
    expect(container.querySelector('.py-3')?.textContent).toBe('')
  })
})
