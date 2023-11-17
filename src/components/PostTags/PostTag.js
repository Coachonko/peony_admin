import { Component, linkEvent } from 'inferno'
import { Redirect } from 'inferno-router'

import { config } from '../../../config'
import { makeCancelable } from '../../utils/promises'
import { getToken, appendToken } from '../../utils/auth'
import { isPeonyError } from '../../utils/peony'

import { Metadata } from '../shared'

export default class PostTag extends Component {
  constructor (props) {
    super(props)

    this.state = {
      readyForEditing: false,
      hasUpdated: false,
      postTagData: null,
      sortedMetadata: null,
      isSubmitting: false,
      newPathname: null,
      peonyError: null,
      lastError: null
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
      this.gettingPostTagData = makeCancelable(this.getPostTagData())
      await this.resolveGettingPostTagData()
    } else {
      // A new postTag needs a clean start
      this.setState({
        readyForEditing: true,
        postTagData: {
          title: '',
          subtitle: '',
          content: '',
          handle: '',
          excerpt: '',
          visibility: 'public',
          metadata: {}
        },
        sortedMetadata: []
      })
    }
  }

  async componentDidUpdate () {
    // TODO update postTagData when saving, updating and deleting.
    // TODO when postTagData is updated, re-calculate sortedMetadata.
    if (this.state.peonyError && this.state.peonyError.code === 401) {
      this.props.notAuthorized()
    }

    if (this.state.newPathname) {
      this.gettingPostTagData = makeCancelable(this.getPostTagData())
      await this.resolveGettingPostTagData()

      this.setState({
        newPathname: null,
        isSubmitting: false
      })
    }
  }

  componentWillUnmount () {
    if (this.gettingPostTagData) {
      this.gettingPostTagData.cancel()
    }
  }

  async getPostTagData () {
    let id
    if (this.state.postTagData && this.state.postTagData.id) {
      id = this.state.postTagData.id
    } else {
      id = this.props.match.params.id
    }

    const token = getToken()
    const requestHeaders = new Headers()
    appendToken(token, requestHeaders)

    try {
      const response = await fetch(`${config.PEONY_ADMIN_API}/post_tags/${id}`, {
        method: 'GET',
        headers: requestHeaders
      })
      const data = await response.json()
      return data
    } catch (error) {
      return error
    }
  }

  async resolveGettingPostTagData () {
    try {
      const data = await this.gettingPostTagData.promise
      if (data instanceof Error) {
        console.error(data)
        this.setState({ lastError: data })
      } else {
        if (isPeonyError(data)) {
          this.setState({ peonyError: data })
        } else {
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
            readyForEditing: true,
            sortedMetadata: metadataArray,
            postTagData: {
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
    if (this.state.newPathname) {
      return <Redirect to={this.state.newPathname} />
    }

    if (this.state.readyForEditing === true) {
      const { title, subtitle, content, handle, excerpt, visibility } = this.state.postTagData

      let saveHandler
      if (this.props.match.params.id) {
        saveHandler = handleUpdate
      } else {
        saveHandler = handleSave
      }

      let deleteButton
      if (this.props.match.params.id && this.state.postTagData.deletedAt === '') {
        deleteButton = (
          <button
            type='button'
            onClick={linkEvent(this, handleDelete)}
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
              onClick={linkEvent(this, saveHandler)}
            >
              Save
            </button>
            {deleteButton}
          </div>

          <form>
            <div className='form-group'>
              <label for='title'>Title</label>
              <input
                name='title'
                id='title'
                type='text'
                spellCheck='true'
                autoComplete='off'
                value={title}
                onInput={linkEvent(this, handleSettings)}
              />
            </div>
            <div className='form-group'>
              <label for='subtitle'>Subtitle</label>
              <input
                name='subtitle'
                id='subtitle'
                type='text'
                spellCheck='true'
                autoComplete='off'
                value={subtitle}
                onInput={linkEvent(this, handleSettings)}
              />
            </div>
            <div className='form-group'>
              <label for='excerpt'>Excerpt</label>
              <input
                name='excerpt'
                id='excerpt'
                type='text'
                spellCheck='true'
                autoComplete='off'
                value={excerpt}
                onInput={linkEvent(this, handleSettings)}
              />
            </div>
            <div className='form-group'>
              <label for='handle'>Handle</label>
              <input
                name='handle'
                id='handle'
                type='text'
                spellCheck='false'
                autoComplete='off'
                value={handle}
                onInput={linkEvent(this, handleSettings)}
              />
            </div>
            <div className='form-group'>
              <label for='visibility'>Visibility</label>
              <select
                name='visibility'
                id='visibility'
                value={visibility}
                onChange={linkEvent(this, handleSettings)}
              >
                <option value='public'>Public</option>
                <option value='paid'>Paid</option>
              </select>
            </div>
            <div className='form-group'>
              <label for='content'>Content</label>
              <input
                name='content'
                id='content'
                type='text'
                spellCheck='true'
                autoComplete='off'
                value={content}
                onInput={linkEvent(this, handleSettings)}
              />
            </div>
            <div className='form-group'>
              <label for='metadata'>Metadata</label>
              <Metadata
                lastError={this.state.lastError}
                updateLastError={this.updateLastError}
                sortedMetadata={this.state.sortedMetadata}
                updateSortedMetadata={this.updateSortedMetadata}
              />
            </div>
          </form>
          {/* TODO parent */}
        </div>
      )
    }
  }
}

function handleSettings (instance, event) {
  const { name, value } = event.target
  console.log(name, value)
  instance.setState({
    postTagData: {
      ...instance.state.postTagData,
      [name]: value
    }
  })
}

async function handleSave (instance) {
  instance.setState({ isSubmitting: true })
  if (!instance.state.postTagData && !instance.state.postTagData.title) {
    const newError = new Error('missing state.postTagData.title')
    console.error(newError)
    instance.setState({
      isSubmitting: false,
      lastError: newError
    })
    return
    // TODO display error to user on component update
  }

  const postTagWriteable = preparePostTagWriteable(instance.state)

  const data = await savePostTagData(postTagWriteable)

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
      const newPathName = `/post_tags/tag/${data.id}`
      instance.setState({
        postTagData: {
          ...instance.state.postTagData,
          id: data.id
        },
        newPathname: newPathName
      })
    }
  }
}

function preparePostTagWriteable (state) {
  const {
    // TODO parent,
    // TODO posts,
    visibility,
    title,
    subtitle,
    content,
    handle,
    excerpt
  } = state.postTagData

  const metadataObject = state.sortedMetadata.reduce((acc, curr) => ({ ...acc, ...curr }), {})

  return {
    visibility,
    title,
    subtitle,
    content,
    handle,
    excerpt,
    metadata: metadataObject
  }
}

async function savePostTagData (postTagWriteable) {
  const token = getToken()
  const requestHeaders = new Headers()
  requestHeaders.append('Content-Type', 'application/json')
  appendToken(token, requestHeaders)

  try {
    const response = await fetch(`${config.PEONY_ADMIN_API}/post_tags`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(postTagWriteable)
    })
    const data = await response.json()
    return data
  } catch (error) {
    return error
  }
}

async function handleUpdate (instance) {
  instance.setState({ isSubmitting: true })
  if (!instance.state.postTagData && !instance.state.postTagData.title) {
    const newError = new Error('missing state.postTagData.title')
    console.error(newError)
    instance.setState({
      isSubmitting: false,
      lastError: newError
    })
    return
    // TODO display error to user on component update
  }

  const postTagWriteable = preparePostTagWriteable(instance.state)

  const data = await updatePostTagData(postTagWriteable, instance.state.postTagData.id)

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
        hasUpdated: true, // TODO use this to show user a save was successful
        isSubmitting: false
      })
    }
  }
}

async function updatePostTagData (postTagWriteable, id) {
  const token = getToken()
  const requestHeaders = new Headers()
  requestHeaders.append('Content-Type', 'application/json')
  appendToken(token, requestHeaders)

  try {
    const response = await fetch(`${config.PEONY_ADMIN_API}/post_tags/${id}`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(postTagWriteable)
    })
    const data = await response.json()
    return data
  } catch (error) {
    return error
  }
}

async function handleDelete (instance) {
  instance.setState({ isSubmitting: true })
  const data = await deletePostTag(instance.state.postTagData.id)

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
        hasUpdated: true, // TODO use this to show user that update was successful
        isSubmitting: false
      })
    }
  }
}

async function deletePostTag (id) {
  const token = getToken()
  const requestHeaders = new Headers()
  requestHeaders.append('Content-Type', 'application/json')
  appendToken(token, requestHeaders)

  try {
    const response = await fetch(`${config.PEONY_ADMIN_API}/post_tags/${id}`, {
      method: 'DELETE',
      headers: requestHeaders
    })
    const data = await response.json()
    return data
  } catch (error) {
    return error
  }
}
