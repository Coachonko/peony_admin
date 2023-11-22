import { Component } from 'inferno'
import { Switch, Route, Redirect } from 'inferno-router'

import { config } from '../../config'
import { getToken, isTokenAvailabile, setLoginFrom, appendToken, unsetToken } from '../utils/auth'
import { makeCancelable } from '../utils/promises'
import { isPeonyError } from '../utils/peony'

import { Dashboard } from './Dashboard'
import { Posts, Post } from './Posts'
import { PostTags, PostTag } from './PostTags'
import { Settings, Store, Users, User } from './Settings'
import { Login } from './Login'
import { NoMatch } from './NoMatch'
import { Nav } from './shared'

export default function Routes (props) {
  return (
    <Switch>
      <ProtectedRoute
        exact
        path='/'
        renderComponent={(props) =>
          <Dashboard {...props} {...this.props} />}
      />

      <ProtectedRoute
        exact
        path='/pages'
        renderComponent={(props) =>
          <Posts {...props} {...this.props} type='page' />}
      />
      <ProtectedRoute
        exact
        path='/pages/page'
        renderComponent={(props) =>
          <Post {...props} {...this.props} type='page' />}
      />
      <ProtectedRoute
        exact
        path='/pages/page/:id'
        renderComponent={(props) =>
          <Post {...props} {...this.props} type='page' />}
      />
      <ProtectedRoute
        exact
        path='/posts'
        renderComponent={(props) =>
          <Posts {...props} {...this.props} type='post' />}
      />
      <ProtectedRoute
        exact
        path='/posts/post'
        renderComponent={(props) =>
          <Post {...props} {...this.props} type='post' />}
      />
      <ProtectedRoute
        exact
        path='/posts/post/:id'
        renderComponent={(props) =>
          <Post {...props} {...this.props} type='post' />}
      />

      <ProtectedRoute
        exact
        path='/post_tags'
        renderComponent={(props) =>
          <PostTags {...props} {...this.props} />}
      />
      <ProtectedRoute
        exact
        path='/post_tags/tag'
        renderComponent={(props) =>
          <PostTag {...props} {...this.props} />}
      />
      <ProtectedRoute
        exact
        path='/post_tags/tag/:id'
        renderComponent={(props) =>
          <PostTag {...props} {...this.props} />}
      />

      <ProtectedRoute
        exact
        path='/settings'
        renderComponent={(props) =>
          <Settings {...props} {...this.props} />}
      />
      <ProtectedRoute
        exact
        path='/settings/store'
        renderComponent={(props) =>
          <Store {...props} {...this.props} />}
      />
      <ProtectedRoute
        exact
        path='/settings/users'
        renderComponent={(props) =>
          <Users {...props} {...this.props} />}
      />
      <ProtectedRoute
        exact
        path='/settings/users/user'
        renderComponent={(props) =>
          <User {...props} {...this.props} />}
      />
      <ProtectedRoute
        exact
        path='/settings/users/user/:id'
        renderComponent={(props) =>
          <User {...props} {...this.props} />}
      />

      <Route
        exact
        path='/login'
        render={(props) =>
          <Login {...props} {...this.props} />}
      />

      <Route render={(props) => <NoMatch {...props} />} />

    </Switch>
  )
}

// ProtectedRoute wrap routes and protects them from uneuthorized access.
// Protected routes receive the currentUserData and notAuthorized props.
// notAuthorized is a function that redirects unauthorized users to the login page.
class ProtectedRoute extends Component {
  constructor (props) {
    super(props)

    this.state = {
      peonyError: null,
      lastError: null,
      isNotAuthorized: false,
      sortedMetadata: null,
      currentUserData: null
    }

    this.notAuthorized = this.notAuthorized.bind(this)
  }

  notAuthorized () {
    this.setState({ isNotAuthorized: true })
  }

  async componentDidMount () {
    this.gettingCurrentUser = makeCancelable(this.getCurrentUser())
    await this.resolveGettingCurrentUser()
  }

  componentDidUpdate () {
    if (this.state.peonyError && this.state.peonyError.code === 401) {
      const tokenIsAvailabile = isTokenAvailabile()
      if (tokenIsAvailabile) {
        unsetToken()
      }
      this.setState({ isNotAuthorized: true })
    }
  }

  componentWillUnmount () {
    if (this.gettingCurrentUser) {
      this.gettingCurrentUser.cancel()
    }
  }

  async getCurrentUser () {
    const token = getToken()
    const requestHeaders = new Headers()
    appendToken(token, requestHeaders)

    try {
      const response = await fetch(`${config.PEONY_ADMIN_API}/auth`, {
        method: 'GET',
        headers: requestHeaders
      })

      const data = await response.json()
      return data
    } catch (error) {
      return error
    }
  }

  async resolveGettingCurrentUser () {
    try {
      const data = await this.gettingCurrentUser.promise
      if (data instanceof Error) {
        console.error(data)
        this.setState({ lastError: data })
      } else {
        if (isPeonyError(data)) {
          this.setState({ peonyError: data })
        } else {
          // Transform metadata object to array, store as this.state.sortedMetadata
          let parsedMetadata = {}
          let metadataArray = []
          if (data.metadata) {
            try {
              parsedMetadata = JSON.parse(data.metadata)
              metadataArray = Object.entries(parsedMetadata).map(([key, value]) => ({ [key]: value }))
            } catch (error) {
              this.setState({ lastError: data })
            }
          }
          this.setState({
            sortedMetadata: metadataArray,
            currentUserData: {
              ...data,
              metadata: parsedMetadata
            }
          })
        }
      }
    } catch (error) {
      console.error(error)
      this.setState({ lastError: error })
    }
  }

  render () {
    if (this.state.isNotAuthorized === true) {
      setLoginFrom(this.props.location.pathname)
      return <Redirect to='/login' />
    }

    // TODO when error fetching, because server offline, show an error and something

    return (
      <>
        <Nav
          currentUserData={this.state.currentUserData}
          notAuthorized={this.notAuthorized}
        />
        <div className='route-container'>
          <Route
            {...this.props}
            render={(props) =>
              this.props.renderComponent({
                ...props,
                currentUserData: this.state.currentUserData,
                notAuthorized: this.notAuthorized
              })}
          />
        </div>
      </>
    )
  }
}
