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
      <div role='form' className='login-form' id='login-form'>
        <div className='background'>
          <div className='shape-one' />
          <div className='shape-two' />
        </div>
        <form>
          <h1>peony</h1>
          <input
            type='email'
            id='email'
            autoComplete='email'
            placeholder='email'
            title='Enter your email address'
            required
            value={this.state.email}
            onInput={linkEvent(this, handleInputChange)}
          />
          <input
            type='password'
            id='password'
            autoComplete='current-password'
            placeholder='password'
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
            <span className='h5'>Log in</span>
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
