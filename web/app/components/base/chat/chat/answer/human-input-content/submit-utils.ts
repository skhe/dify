export const sanitizeHumanInputSubmission = (inputs: Record<string, string | undefined>) => {
  return Object.fromEntries(
    Object.entries(inputs).filter(([, value]) => value !== undefined),
  ) as Record<string, string>
}
