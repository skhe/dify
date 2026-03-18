import { describe, expect, it } from 'vitest'
import {
  appendFormInputReference,
  getFormInputReference,
} from './use-form-content'

describe('useFormContent helpers', () => {
  describe('getFormInputReference', () => {
    it('should build the human input placeholder for a variable name', () => {
      expect(getFormInputReference('review_comment')).toBe('{{#$output.review_comment#}}')
    })
  })

  describe('appendFormInputReference', () => {
    it('should append a placeholder to empty content', () => {
      expect(appendFormInputReference('', 'review_comment')).toBe('{{#$output.review_comment#}}')
    })

    it('should append a placeholder after existing content', () => {
      expect(appendFormInputReference('Please review this change.', 'review_comment'))
        .toBe('Please review this change.\n\n{{#$output.review_comment#}}')
    })

    it('should trim trailing whitespace before appending a placeholder', () => {
      expect(appendFormInputReference('Please review this change. \n\n', 'review_comment'))
        .toBe('Please review this change.\n\n{{#$output.review_comment#}}')
    })
  })
})
