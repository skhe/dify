import type { StateCreator } from 'zustand'
import type {
  RunFile,
} from '@/app/components/workflow/types'

export type FormSliceShape = {
  inputs: Record<string, unknown>
  setInputs: (inputs: Record<string, unknown>) => void
  files: RunFile[]
  setFiles: (files: RunFile[]) => void
}

export const createFormSlice: StateCreator<FormSliceShape> = set => ({
  inputs: {},
  setInputs: inputs => set(() => ({ inputs })),
  files: [],
  setFiles: files => set(() => ({ files })),
})
