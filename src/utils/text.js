export function isValidSlug (input) {
  const slugRegex = /^[A-Za-z0-9-_]+$/
  return slugRegex.test(input)
}
