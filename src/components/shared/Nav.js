import { Component, linkEvent } from 'inferno'
import { NavLink, Link } from 'inferno-router'
import { CircumIcon } from 'circum-icons-inferno'

import { config } from '../../../config'
import { appendToken, getToken, unsetToken } from '../../utils/auth'

export default class Nav extends Component {
  constructor (props) {
    super(props)

    this.state = {
      isLoggingOut: false,
      isLoggedOut: false,
      peonyError: null,
      lastError: null,
      userMenu: false
    }
  }

  componentDidUpdate () {
    if (this.state.isLoggedOut === true) {
      this.props.notAuthorized()
    }
  }

  render () {
    if (this.props.currentUserData) {
      let userMenu
      if (this.state.userMenu === true) {
        userMenu = (
          <ul>
            <li>
              <Link to={`settings/user/${this.props.currentUserData.id}`}>
                Your profile
              </Link>
            </li>

            <hr />

            <li>
              <button
                type='button'
                onClick={linkEvent(this, handleLogout)}
                disabled={this.state.isLoggingOut}
              >
                Log out
              </button>
            </li>
          </ul>
        )
      }

      return (
        <nav className='main-nav'>
          <div className='header'>
            peony
          </div>

          <div className='body'>
            <ul>
              <li>
                <NavLink exact to='/'>Dashboard</NavLink>
              </li>
            </ul>

            <ul>
              <li>
                <NavLink to='/pages'>Pages</NavLink>
              </li>
              <li>
                <NavLink to='/posts'>Posts</NavLink>
              </li>
              <li>
                <NavLink to='/post_tags'>Tags</NavLink>
              </li>

            </ul>

            {/* <ul>
              TODO members

              TODO commerce links: products, discounts, orders, inventory, promotions
            </ul> */}
          </div>

          <div className='footer'>
            <div className='user-menu'>
              <button
                className='toggle'
                type='button'
                onClick={linkEvent(this, handleToggleUserMenu)}
              >
                <CircumIcon name='user' />
              </button>
              {userMenu}
            </div>

            <div className='settings'>
              <Link to='/settings'>
                <CircumIcon name='settings' />
              </Link>
            </div>
          </div>
        </nav>
      )
    }
  }
}

function handleToggleUserMenu (instance) {
  instance.setState({ userMenu: !instance.state.userMenu })
}

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
      if (data.code && data.code === 401) { // TODO why not unsetToken on 401?
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
