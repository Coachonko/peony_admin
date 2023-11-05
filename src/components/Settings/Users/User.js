import { Component, linkEvent } from 'inferno'
import { Redirect } from 'inferno-router'

import { config } from '../../../../config'
import { isPeonyError } from '../../../utils/peony'
import { makeCancelable } from '../../../utils/promises'
import { getToken, appendToken, isTokenAvailabile, unsetToken, setLoginFrom } from '../../../utils/auth'
import { isValidSlug } from '../../../utils/text'

export default class User extends Component {
  constructor (props) {
    super(props)

    this.state = {
      peonyError: null,
      lastError: null,
      isNotAuthorized: false,
      // User data
      id: null,
      handle: null,
      email: null,
      role: null,
      createdAt: null,
      updatedAt: null,
      deletedAt: null,
      firstName: null,
      lastName: null,
      metadata: null
    }
  }

  async componentDidMount () {
    this.gettingUserData = makeCancelable(this.getUserData())
    await this.resolveGettingUserData()
  }

  componentDidUpdate () {
    const tokenIsAvailabile = isTokenAvailabile()
    if (this.state.peonyError && this.state.peonyError.code === 401 && tokenIsAvailabile) {
      unsetToken()
      this.setState({ isNotAuthorized: true })
    }
  }

  componentWillUnmount () {
    if (this.gettingUserData) {
      this.gettingUserData.cancel()
    }
  }

  async getUserData () {
    let id
    if (this.state.id) {
      id = this.state.id
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
          let newMetadata
          if (data.metadata === '') {
            newMetadata = new Map()
          } else {
            const metadataObject = JSON.parse(data.metadata)
            newMetadata = new Map(Object.entries(metadataObject))
          }
          this.setState({
            id: data.id,
            handle: data.handle,
            email: data.email,
            role: data.role,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            deletedAt: data.deletedAt,
            firstName: data.firstName,
            lastName: data.lastName,
            metadata: newMetadata
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
      return (
        <Redirect to='/login' />
      )
    }

    if (this.state.id) {
      const metadataCell = []
      for (const [objectKey, objectValue] of this.state.metadata) {
        metadataCell.push(
          <div>
            <input
              name={objectKey}
              type='text'
              spellCheck='false'
              autoComplete='off'
              value={objectKey}
              onInput={linkEvent(this, handleMetadataKeyChange)}
            />
            <input
              name={objectKey}
              type='text'
              spellCheck='false'
              autoComplete='off'
              value={objectValue}
              onInput={linkEvent(this, handleMetadataValueChange)}
            />
            <button
              name={objectKey}
              type='button'
              onClick={linkEvent(this, handleRemoveMetadataPair)}
            >
              Remove
            </button>
          </div>
        )
      }

      let deleteButton
      if (this.state.deletedAt) {
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
                <td data-cell='id'>{this.state.id}</td>
              </tr>
              <tr>
                <th scope='row'>handle</th>
                <td data-cell='handle'>
                  <input
                    name='handle'
                    type='text'
                    spellCheck='false'
                    autoComplete='off'
                    value={this.state.handle}
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
                    value={this.state.email}
                    onInput={linkEvent(this, handleInputChange)}
                  />
                </td>
              </tr>
              <tr>
                <th scope='row'>role</th>
                {/* TODO select */}
                <td>{this.state.role}</td>
              </tr>
              <tr>
                <th scope='row'>createdAt</th>
                <td data-cell='createdAt'>{this.state.createdAt}</td>
              </tr>
              <tr>
                <th scope='row'>updatedAt</th>
                <td data-cell='updatedAt'>{this.state.updatedAt}</td>
              </tr>
              <tr>
                <th scope='row'>deletedAt</th>
                <td data-cell='deletedAt'>{this.state.deletedAt}</td>
              </tr>
              <tr>
                <th scope='row'>firstName</th>
                <td data-cell='firstName'>
                  <input
                    name='firstName'
                    type='text'
                    spellCheck='true'
                    autoComplete='on'
                    value={this.state.firstName}
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
                    value={this.state.lastName}
                    onInput={linkEvent(this, handleInputChange)}
                  />
                </td>
              </tr>
              <tr>
                <th scope='row'>metadata</th>
                <td data-cell='metadata'>
                  {metadataCell}
                  <div>
                    <button
                      type='button'
                      onClick={linkEvent(this, handleAddMetadataPair)}
                    >
                      Add
                    </button>
                  </div>
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
  let newMetadata
  try {
    newMetadata = JSON.stringify(Object.fromEntries(instance.state.metadata))
  } catch (error) {
    instance.setState({
      lastError: error,
      isSubmitting: false
    })
  }

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
  } = instance.state

  const userData = {
    handle,
    email,
    role,
    createdAt,
    updatedAt,
    deletedAt,
    firstName,
    lastName,
    metadata: newMetadata
  }

  const data = await submitUserData(userData, this.state.id)
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

function handleAddMetadataPair (instance) {
  const baseKey = 'new key '
  let keyCounter = 1
  while (instance.state.metadata.has(`${baseKey}${keyCounter}`)) {
    keyCounter++
  }

  const newKey = `${baseKey}${keyCounter}`

  instance.state.metadata.set(newKey, 'new value')
  instance.setState({ metadata: instance.state.metadata })
}

function handleRemoveMetadataPair (instance, event) {
  instance.state.metadata.delete(event.target.name)
  instance.setState({ metadata: instance.state.metadata })
}

function handleMetadataKeyChange (instance, event) {
  const { name, value } = event.target

  if (instance.state.metadata.has(value)) {
    const error = new Error(`A key with the value ${value} already exists in the metadata map`)
    console.log(error)
    instance.setState({ lastError: error })
    return
  }

  instance.state.metadata.set(value, instance.state.metadata.get(name))
  instance.state.metadata.delete(name)

  instance.setState({ metadata: instance.state.metadata })
}

function handleMetadataValueChange (instance, event) {
  const { name, value } = event.target

  instance.state.metadata.set(name, value)

  instance.setState({ metadata: instance.state.metadata })
}

function handleInputChange (instance, event) {
  instance.setState({ [event.target.name]: event.target.value })
}

async function handlePasswordReset (instance) {
  // TODO create endpoint
}

async function handleDeleteUser (instance) {
  instance.setState({ isSubmitting: true })

  const data = await deleteUser(this.state.id)
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
        updatedAt: data.updatedAt,
        deletedAt: data.deletedAt,
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
