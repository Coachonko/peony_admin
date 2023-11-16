import { Component, linkEvent } from 'inferno'
import { Redirect } from 'inferno-router'

import { config } from '../../../config'
import { isTokenAvailabile, setToken, getLoginFrom, unsetLoginFrom } from '../../utils/auth'

class Login extends Component {
  constructor (props) {
    super(props)

    this.state = {
      email: '',
      password: '',
      isSubmitting: false,
      errorStatus: null,
      errorBody: null // TODO move to peonyError and lastError
    }
  }

  render () {
    const tokenIsAvailabile = isTokenAvailabile()
    if (tokenIsAvailabile === true) {
      const loginFrom = getLoginFrom()
      if (loginFrom) {
        unsetLoginFrom()
        return (
          <Redirect to={loginFrom} />
        )
      } else {
        return (
          <Redirect to='/' />
        )
      }
    }

    return (
      <div role='form' id='login-form'>
        <h1>Login</h1>
        <form>
          <input
            type='email'
            id='email'
            autoComplete='email'
            placeholder='heavy_lifter@coachonko.com'
            title='Enter your email address'
            required
            value={this.state.email}
            onInput={linkEvent(this, handleInputChange)}
          />
          <input
            type='password'
            id='password'
            autoComplete='current-password'
            placeholder='very-secret-password'
            title='Password must be at leats 10 characters long, using a password manager is recommended.'
            minLength='10'
            required
            value={this.state.password}
            onInput={linkEvent(this, handleInputChange)}
          />
          <button
            type='button'
            onClick={linkEvent(this, handleSubmit)}
            disabled={this.state.isSubmitting}
          >
            Log in
          </button>
        </form>
      </div>
      /* TODO display errors */
    )
  }
}

export default Login

function handleInputChange (instance, event) {
  const { id, value } = event.target
  instance.setState({ [id]: value })
}

async function handleSubmit (instance, event) {
  instance.setState({ isSubmitting: true })
  const { email, password } = instance.state

  try {
    const response = await fetch(`${config.PEONY_ADMIN_API}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (!response.ok) {
      instance.setState({
        errorStatus: response.status,
        errorBody: data,
        isSubmitting: false
      })
    } else {
      setToken(response)
    }
  } catch (error) {
    console.error('Fetch error: ', error)
  } finally {
    instance.setState({ isSubmitting: false })
  }
}
