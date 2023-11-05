import { Component, linkEvent } from 'inferno'
import { NavLink, Redirect } from 'inferno-router'

import { config } from '../../../config'
import { isTokenAvailabile, appendToken, getToken, unsetToken } from '../../utils/auth'

// Nav is meant to be always mounted, but it renders nothing when the user is not logged in.
class Nav extends Component {
  constructor (props) {
    super(props)

    this.state = {
      isLoggingOut: false,
      isLoggedOut: false,
      isRedirected: false,
      peonyError: null,
      lastError: null
    }
  }

  componentDidUpdate (lastProps, lastState) {
    if (this.state.isLoggedOut === true) {
      // Only redirect once after logging out.
      if (lastState.isRedirected === false) {
        this.setState({ isRedirected: true })
      }
      // Reset state once logged in.
      const tokenIsAvailabile = isTokenAvailabile()
      if (tokenIsAvailabile === true) {
        this.setState({
          isLoggedOut: false,
          isRedirected: false
        })
      }
    }
  }

  render () {
    if (this.state.isLoggedOut === true && this.state.isRedirected === false) {
      return <Redirect to='/' />
    }

    const tokenIsAvailabile = isTokenAvailabile()
    if (tokenIsAvailabile === true) {
      return (
        <nav>
          <ul>
            <li>
              <NavLink to='/'>Dashboard</NavLink>
            </li>
            <li>
              <NavLink to='/pages'>Pages</NavLink>
            </li>
            <li>
              <NavLink to='/posts'>Posts</NavLink>
            </li>
            <li>
              <NavLink to='/settings'>Settings</NavLink>
            </li>
          </ul>

          <ul>
            <li>
              <button
                type='button'
                onClick={linkEvent(this, handleLogout)}
                disabled={this.state.isLoggingOut}
              >Log out
              </button>
            </li>
          </ul>
        </nav>
      )
    }
  }
}

export default Nav

// TODO token available but expired fails logout
async function handleLogout (instance, event) {
  instance.setState({ isLoggingOut: true })
  const token = getToken()
  const requestHeaders = new Headers()
  appendToken(token, requestHeaders)
  try {
    const response = await fetch(`${config.PEONY_ADMIN_API}/auth`, {
      method: 'DELETE',
      headers: requestHeaders
    })

    if (!response.ok) {
      const data = await response.json()
      instance.setState({ peonyError: data })
      if (data.code && data.code === 401) {
        unsetToken()
        instance.setState({ isLoggedOut: true })
      }
    } else {
      unsetToken()
      instance.setState({ isLoggedOut: true })
    }
  } catch (error) {
    console.error('Fetch error: ', error)
  } finally {
    instance.setState({ isLoggingOut: false })
  }
}
