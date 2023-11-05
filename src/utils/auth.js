/* global localStorage, sessionStorage */
import { config } from '../../config.js'

/*
*
* Token
*
*/

// appendToken adds the auth token to the request.
export function appendToken (token, requestHeaders) {
  requestHeaders.append(config.PEONY_ADMIN_AUTH_HEADER, token)
}

// isTokenAvailabile returns true if the token is available in localStorage.
export function isTokenAvailabile () {
  const token = getToken()
  if (token) {
    return true
  }
  if (!token) {
    return false
  }
}

// setToken puts the auth token from the response header into localstorage.
export function setToken (response) {
  const token = response.headers.get(config.PEONY_ADMIN_AUTH_HEADER)
  if (token) {
    localStorage.setItem(config.LOCALSTORAGE_ADMIN_AUTH_HEADER, token)
  } else {
    throw new Error('Token is missing from response. Ensure the correct headers are being checked.')
  }
}

// unsetToken removes the token from localStorage if it exists.
export function unsetToken () {
  const token = getToken()
  if (token) {
    localStorage.removeItem(config.LOCALSTORAGE_ADMIN_AUTH_HEADER)
  }
}

// getToken gets the auth token from localstorage.
export function getToken () {
  return localStorage.getItem(config.LOCALSTORAGE_ADMIN_AUTH_HEADER)
}

/*
*
* loginFrom
*
*/

// setLoginFrom sets a key/value pair in sessionStorage.
// The value is meant to contain the path of the redirection after successfully logging in.
// This function should be invoked in the component that redirects the client to the login mechanism.
export function setLoginFrom (path) {
  sessionStorage.setItem('loginFrom', path)
}

// unsetLoginFrom removes the key/value pair set by setLoginFrom from sessionStorage.
// This function should be used to ensure that sessionStorage is clean, to prevent wrong redirects.
// It also should be used to keep sessionStorage clean after the value has been used.
export function unsetLoginFrom () {
  sessionStorage.removeItem('loginFrom')
}

// getLoginFrom returns the value set by setLoginFrom, if any.
// In the component implementing the login mechanism, this function can be invoked to retrieve the path.
export function getLoginFrom () {
  const loginFrom = sessionStorage.getItem('loginFrom')
  return loginFrom
}
