import { Component, linkEvent } from 'inferno'
import { Redirect } from 'inferno-router'

import { config } from '../../../config'
import { getToken, appendToken } from '../../utils/auth'
import { isPeonyError } from '../../utils/peony'
import { makeCancelable } from '../../utils/promises'

import JoditWrapper from './JoditWrapper'
import { Metadata } from '../shared'

export default class Post extends Component {
  constructor (props) {
    super(props)

    this.state = {
      readyForEditing: false,
      isSubmitting: false,
      peonyError: null,
      lastError: null,
      newPathname: null,
      hasUpdated: false,
      settings: false,
      sortedMetadata: null,
      postData: null
    }

    this.updateLastError = this.updateLastError.bind(this)
    this.updateSortedMetadata = this.updateSortedMetadata.bind(this)
    this.updateContent = this.updateContent.bind(this)
  }

  updateLastError (newLastError) {
    this.setState({ lastError: newLastError })
  }

  updateSortedMetadata (newSortedMetadata) {
    this.setState({ sortedMetadata: newSortedMetadata })
  }

  updateContent (newContent) {
    this.setState({
      postData:
      {
        ...this.state.postData,
        content: newContent
      }
    })
  }

  async componentDidMount () {
    if (this.props.match.params.id) {
      this.gettingPostData = makeCancelable(this.getPostData())
      await this.resolveGettingPostData()
    } else {
      // A new post needs a clean start
      let newPostType
      if (this.props.match.path === '/pages/page') {
        newPostType = 'page'
      }
      if (this.props.match.path === '/posts/post') {
        newPostType = 'post'
      }
      this.setState({
        readyForEditing: true,
        postData: {
          title: '',
          subtitle: '',
          excerpt: '',
          handle: '',
          featured: false,
          visibility: 'public',
          metadata: {},
          postType: newPostType
        },
        sortedMetadata: []
      })
    }
  }

  async componentDidUpdate () {
    if (this.state.peonyError && this.state.peonyError.code === 401) {
      this.props.notAuthorized()
    }

    if (this.state.newPathname) {
      this.gettingPostData = makeCancelable(this.getPostData())
      await this.resolveGettingPostData()

      this.setState({
        newPathname: null,
        isSubmitting: false
      })
    }
  }

  componentWillUnmount () {
    if (this.gettingPostData) {
      this.gettingPostData.cancel()
    }
  }

  async getPostData () {
    let id
    if (this.state.postData && this.state.postData.id) {
      id = this.state.postData.id
    } else {
      id = this.props.match.params.id
    }

    const token = getToken()
    const requestHeaders = new Headers()
    appendToken(token, requestHeaders)

    try {
      const response = await fetch(`${config.PEONY_ADMIN_API}/posts/${id}`, {
        method: 'GET',
        headers: requestHeaders
      })
      const data = await response.json()
      return data
    } catch (error) {
      return error
    }
  }

  async resolveGettingPostData () {
    try {
      const data = await this.gettingPostData.promise
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
            postData: {
              ...data,
              metadata: parsedMetadata
            }
          })
        }
      }
    } catch (error) {
      console.error(error)
      this.setState({
        lastError: error
      })
    }
  }

  render () {
    if (this.state.newPathname) {
      return <Redirect to={this.state.newPathname} />
    }

    if (this.state.readyForEditing === true) {
      let statusButton
      if (this.props.match.params.id) {
        statusButton = <button type='button'>Update</button>
      /* TODO update menu: radio button published or unpublished, confirm and cancel buttons */
      } else {
        statusButton = <button type='button'>Publish</button>
        /* TODO publish menu: radio buttons publish now or schedule, confirm and delete buttons */
      }

      let settingsMenu
      if (this.state.settings === true) {
        const { title, subtitle, excerpt, handle, featured, visibility } = this.state.postData
        settingsMenu = (
          <div className='settings-menu'>
            <h4>Settings</h4>
            <form>
              <div className='form-group'>
                <label for='title'>title</label>
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
                <label for='subtitle'>subtitle</label>
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
                <label for='excerpt'>excerpt</label>
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
                <label for='handle'>handle</label>
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
                <label for='featured'>featured</label>
                <input
                  name='featured'
                  id='featured'
                  type='checkbox'
                  checked={featured}
                  onChange={linkEvent(this, handleSettings)}
                />
              </div>
              <div className='form-group'>
                {/* TODO make toggle */}
                <label for='visibility'>visibility</label>
                <select
                  name='visibility'
                  id='visibility'
                  value={visibility}
                  onChange={linkEvent(this, handleSettings)}
                >
                  <option value='public'>public</option>
                  <option value='paid'>paid</option>
                </select>
              </div>
              {/*
            TODO insert authors
            require one author, default to current user /admin/auth 'GET'
            accept multiple authors, list of users can be obtained /admin/users 'GET'
            store in array to ensure order, allow sorting
            no duplicates
            delete button
            */}
              {/*
            TODO insert tags
            list of tags can be obtained /admin/tags 'GET'
            store in array to ensure order, allow sorting
            no duplicates
            delete button
            */}
              <div className='form-group'>
                <label for='metadata'>metadata</label>
                <Metadata
                  lastError={this.state.lastError}
                  updateLastError={this.updateLastError}
                  sortedMetadata={this.state.sortedMetadata}
                  updateSortedMetadata={this.updateSortedMetadata}
                />
              </div>
            </form>
          </div>
        )
      }

      let saveHandler
      if (this.props.match.params.id) {
        saveHandler = handleUpdate
      } else {
        saveHandler = handleSave
      }

      return (
        <div className='editor'>
            <div className='editor-header'>
              <button
                type='button'
                onClick={linkEvent(this, saveHandler)}
              >
                save
              </button>
              {statusButton}
              <button
                className='settings-toggle'
                title='Settings'
                type='button'
                onClick={linkEvent(this, toggleSettings)}
              >
                settings
              </button>
            </div>

            <JoditWrapper
              value={this.state.postData.content}
              updateValue={this.updateContent}
            />

            {settingsMenu}
          </div>
      )
    }
  }
}

async function handleSave (instance) {
  instance.setState({ isSubmitting: true }) // TODO lock everything until submit complete

  if (!instance.state.postData && !instance.state.postData.title) {
    const newError = new Error('missing state.postData.title')
    console.error(newError)
    instance.setState({
      isSubmitting: false,
      lastError: newError
    })
    return
    // TODO display error to user on component update
  }

  if (!instance.state.postData && !instance.state.postData.postType) {
    const newError = new Error('missing state.postType, ensure it is being set in componentDidMount')
    console.error(newError)
    instance.setState({ isSubmitting: false })
    return
  }

  const postDataToSend = preparePostWriteable(instance.state)

  const data = await submitPostData(postDataToSend, instance.state.postData.postType)

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
      let newPathName
      if (data.postType === 'post') {
        newPathName = `/posts/post/${data.id}`
      } else {
        newPathName = `/pages/page/${data.id}`
      }
      instance.setState({
        postData: {
          ...instance.state.postData,
          id: data.id
        },
        newPathname: newPathName
      })
    }
  }
}

function preparePostWriteable (state) {
  // TODO add author_id(s)
  // TODO add tag_id(s)
  const {
    status,
    featured,
    visibility,
    title,
    subtitle,
    content,
    handle,
    excerpt
  } = state.postData

  const metadataObject = state.sortedMetadata.reduce((acc, curr) => ({ ...acc, ...curr }), {})

  return {
    status,
    featured,
    visibility,
    title,
    subtitle,
    content,
    handle,
    excerpt,
    metadata: metadataObject
  }
}

async function submitPostData (postDatatoSend, postType) {
  const token = getToken()
  const requestHeaders = new Headers()
  requestHeaders.append('Content-Type', 'application/json')
  appendToken(token, requestHeaders)
  let query = ''
  if (postType && postType === 'page') {
    query = '?post_type=page'
  }

  try {
    const response = await fetch(`${config.PEONY_ADMIN_API}/posts${query}`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(postDatatoSend)
    })
    const data = await response.json()
    return data
  } catch (error) {
    return error
  }
}

async function handleUpdate (instance) {
  instance.setState({ isSubmitting: true })

  if (!instance.state.postData.title) {
    const newError = new Error('missing state.title')
    console.error(newError)
    instance.setState({
      isSubmitting: false,
      lastError: newError
    })
    return
  }

  const postDataToSend = preparePostWriteable(instance.state)

  const data = await updatePostData(postDataToSend, instance.state.postData.id)

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

async function updatePostData (postDataToSend, id) {
  const token = getToken()
  const requestHeaders = new Headers()
  requestHeaders.append('Content-Type', 'application/json')
  appendToken(token, requestHeaders)

  try {
    const response = await fetch(`${config.PEONY_ADMIN_API}/posts/${id}`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(postDataToSend)
    })
    const data = await response.json()
    return data
  } catch (error) {
    return error
  }
}

function toggleSettings (instance) {
  instance.setState({ settings: !instance.state.settings })
}

function handleSettings (instance, event) {
  const { name, value, checked, type } = event.target

  if (type === 'checkbox') {
    instance.setState({
      postData: {
        ...instance.state.postData,
        [name]: checked
      }
    })
  } else {
    instance.setState({
      postData: {
        ...instance.state.postData,
        [name]: value
      }
    })
  }
}

async function handleDelete (instance) {
  instance.setState({ isSubmitting: true })
  const data = await deletePost(instance.state.postData.id)

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

async function deletePost (id) {
  const token = getToken()
  const requestHeaders = new Headers()
  requestHeaders.append('Content-Type', 'application/json')
  appendToken(token, requestHeaders)

  try {
    const response = await fetch(`${config.PEONY_ADMIN_API}/posts/${id}`, {
      method: 'DELETE',
      headers: requestHeaders
    })
    const data = await response.json()
    return data
  } catch (error) {
    return error
  }
}
