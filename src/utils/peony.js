// isPeonyError returns true if the response is a PeonyError object.
export function isPeonyError (response) {
  const expectedProperties = ['message', 'code', 'data', 'timestamp']

  if (
    response &&
    typeof response === 'object' &&
    expectedProperties.every(prop => prop in response) &&
    Object.keys(response).length === expectedProperties.length
  ) {
    return true
  }
  return false
}
