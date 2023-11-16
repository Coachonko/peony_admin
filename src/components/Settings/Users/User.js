import { Component, linkEvent } from 'inferno'

import { config } from '../../../../config'
import { isPeonyError } from '../../../utils/peony'
import { makeCancelable } from '../../../utils/promises'
import { getToken, appendToken } from '../../../utils/auth'
import { isValidSlug } from '../../../utils/text'

import { Metadata } from '../../shared/Metadata'

export default class User extends Component {
  constructor (props) {
    super(props)

    this.state = {
      peonyError: null,
      lastError: null,
      sortedMetadata: null,
      userData: null
    }

    this.updateLastError = this.updateLastError.bind(this)
    this.updateSortedMetadata = this.updateSortedMetadata.bind(this)
  }

  updateLastError (newLastError) {
    this.setState({ lastError: newLastError })
  }

  updateSortedMetadata (newSortedMetadata) {
    this.setState({ sortedMetadata: newSortedMetadata })
  }

  async componentDidMount () {
    if (this.props.match.params.id) {
      this.gettingUserData = makeCancelable(this.getUserData())
      await this.resolveGettingUserData()
    }
  }

  componentDidUpdate () {
    if (this.state.peonyError && this.state.peonyError.code === 401) {
      this.props.notAuthorized()
    }
  }

  componentWillUnmount () {
    if (this.gettingUserData) {
      this.gettingUserData.cancel()
    }
  }

  async getUserData () {
    let id
    if (this.state.userData && this.state.userData.id) {
      id = this.state.userData.id
    } else {
      id = this.props.match.params.id
    }

    const token = getToken()
    const requestHeaders = new Headers()
    appendToken(token, requestHeaders)

    try {
      const response = await fetch(`${config.PEONY_ADMIN_API}/users/${id}`, {
        method: 'GET',
        headers: requestHeaders
      })

      const data = await response.json()
      return data
    } catch (error) {
      return error
    }
  }

  async resolveGettingUserData () {
    try {
      const data = await this.gettingUserData.promise
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
            userData: {
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
    if (this.state.userData && this.state.userData.id) {
      let deleteButton
      if (this.state.userData.deletedAt) {
        deleteButton = (
          <button
            type='button'
            name='restore'
            onClick={linkEvent(this, handleRestoreUser)}
          >
            Restore
          </button>
        )
      } else {
        deleteButton = (
          <button
            type='button'
            name='delete'
            onClick={linkEvent(this, handleDeleteUser)}
          >
            Delete
          </button>
        )
      }

      return (
        <div>
          <div>
            <button
              type='button'
              onClick={linkEvent(this, handleUpdate)}
              // TODO disable when submitting
            >
              Save
            </button>

            <button
              type='button'
              name='restore'
              onClick={linkEvent(this, handlePasswordReset)}
            >
              Reset password
            </button>

            {deleteButton}
          </div>

          <table>
            <caption>
              User data
            </caption>

            <tbody>
              <tr>
                <th scope='row'>id</th>
                <td data-cell='id'>{this.state.userData.id}</td>
              </tr>
              <tr>
                <th scope='row'>handle</th>
                <td data-cell='handle'>
                  <input
                    name='handle'
                    type='text'
                    spellCheck='false'
                    autoComplete='off'
                    value={this.state.userData.handle}
                    onInput={linkEvent(this, handleInputChange)}
                  />
                </td>
              </tr>
              <tr>
                <th scope='row'>email</th>
                <td data-cell='email'>
                  <input
                    name='email'
                    type='text'
                    spellCheck='false'
                    autoComplete='off'
                    value={this.state.userData.email}
                    onInput={linkEvent(this, handleInputChange)}
                  />
                </td>
              </tr>
              <tr>
                <th scope='row'>role</th>
                {/* TODO select */}
                <td>{this.state.userData.role}</td>
              </tr>
              <tr>
                <th scope='row'>createdAt</th>
                <td data-cell='createdAt'>{this.state.userData.createdAt}</td>
              </tr>
              <tr>
                <th scope='row'>updatedAt</th>
                <td data-cell='updatedAt'>{this.state.userData.updatedAt}</td>
              </tr>
              <tr>
                <th scope='row'>deletedAt</th>
                <td data-cell='deletedAt'>{this.state.userData.deletedAt}</td>
              </tr>
              <tr>
                <th scope='row'>firstName</th>
                <td data-cell='firstName'>
                  <input
                    name='firstName'
                    type='text'
                    spellCheck='true'
                    autoComplete='on'
                    value={this.state.userData.firstName}
                    onInput={linkEvent(this, handleInputChange)}
                  />
                </td>
              </tr>
              <tr>
                <th scope='row'>lastName</th>
                <td data-cell='lastName'>
                  <input
                    name='lastName'
                    type='text'
                    spellCheck='true'
                    autoComplete='on'
                    value={this.state.userData.lastName}
                    onInput={linkEvent(this, handleInputChange)}
                  />
                </td>
              </tr>
              <tr>
                <th scope='row'>metadata</th>
                <td data-cell='metadata'>
                  <Metadata
                    lastError={this.state.lastError}
                    updateLastError={this.updateLastError}
                    sortedMetadata={this.state.sortedMetadata}
                    updateSortedMetadata={this.updateSortedMetadata}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    }
  }
}

async function handleUpdate (instance) {
  instance.setState({ isSubmitting: true })

  // TODO show errors to user to require input changes

  if (!isValidSlug(instance.state.handle)) {
    const error = new Error('handle is not a slug')
    instance.setState({
      lastError: error,
      isSubmitting: false
    })
  }

  const {
    handle,
    email,
    role,
    createdAt,
    updatedAt,
    deletedAt,
    firstName,
    lastName
  } = instance.state.userData

  const metadataObject = instance.state.sortedMetadata.reduce((acc, curr) => ({ ...acc, ...curr }), {})

  const userData = {
    handle,
    email,
    role,
    createdAt,
    updatedAt,
    deletedAt,
    firstName,
    lastName,
    metadata: metadataObject
  }

  const data = await submitUserData(userData, instance.state.userData.id)
  if (data instanceof Error) {
    console.error(data)
    instance.setState({
      lastError: data,
      isSubmitting: false
    })
  } else {
    if (isPeonyError(data)) {
      instance.setState({
        peonyError: data,
        isSubmitting: false
      })
    } else {
      // Note: assuming component state should not differ from server response body
      instance.setState({
        hasUpdated: true, // TODO use this to show user a save was successful
        isSubmitting: false
      })
    }
  }
}

async function submitUserData (userData, userId) {
  const token = getToken()
  const requestHeaders = new Headers()
  requestHeaders.append('Content-Type', 'application/json')
  appendToken(token, requestHeaders)

  try {
    const response = await fetch(`${config.PEONY_ADMIN_API}/users/${userId}`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(userData)
    })

    const data = await response.json()
    return data
  } catch (error) {
    return error
  }
}

function handleInputChange (instance, event) {
  instance.setState({
    userData: {
      ...instance.state.userdata,
      [event.target.name]: event.target.value
    }
  })
}

async function handlePasswordReset (instance) {
  // TODO create endpoint
}

async function handleDeleteUser (instance) {
  instance.setState({ isSubmitting: true })

  const data = await deleteUser(this.state.userData.id)
  if (data instanceof Error) {
    console.error(data)
    instance.setState({
      lastError: data,
      isSubmitting: false
    })
  } else {
    if (isPeonyError(data)) {
      instance.setState({
        peonyError: data,
        isSubmitting: false
      })
    } else {
      instance.setState({
        userData: {
          ...instance.state.userData,
          updatedAt: data.updatedAt,
          deletedAt: data.deletedAt
        },
        hasUpdated: true,
        isSubmitting: false
      })
    }
  }
}

async function deleteUser (id) {
  const token = getToken()
  const requestHeaders = new Headers()
  requestHeaders.append('Content-Type', 'application/json')
  appendToken(token, requestHeaders)

  try {
    const response = await fetch(`${config.PEONY_ADMIN_API}/users/${id}`, {
      method: 'DELETE',
      headers: requestHeaders
    })

    const data = await response.json()
    return data
  } catch (error) {
    return error
  }
}

async function handleRestoreUser (instance) {
  // TODO create endpoint
}
