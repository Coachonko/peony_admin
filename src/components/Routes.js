import { Switch, Route, Redirect } from 'inferno-router'

import { Dashboard } from './Dashboard'
import { Posts, Post } from './Posts'
import { Settings, Store, Users, User } from './Settings'
import { Login } from './Login'
import { NoMatch } from './NoMatch'
import { isTokenAvailabile, setLoginFrom } from '../utils/auth'

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
      {/* <ProtectedRoute exact path='/tags'> */}

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
        path='/settings/user'
        renderComponent={(props) =>
          <User {...props} {...this.props} />}
      />
      <ProtectedRoute
        exact
        path='/settings/user/:id'
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

// ProtectedRoute renders the component only if `tokenIsAvailabile` is `true`.
function ProtectedRoute ({ renderComponent, ...restOfProps }) {
  const tokenIsAvailabile = isTokenAvailabile()
  let componentToRender = (props) => <Redirect to='/login' />
  if (tokenIsAvailabile === true) {
    componentToRender = renderComponent
  } else {
    setLoginFrom(this.props.location.pathname)
  }

  return (
    <Route render={componentToRender} {...restOfProps} />
  )
}
