import { Component, linkEvent } from 'inferno'
import { Redirect } from 'inferno-router'

import { config } from '../../../config'
import { getToken, isTokenAvailabile, unsetToken, appendToken, setLoginFrom } from '../../utils/auth'
import { isPeonyError } from '../../utils/peony'
import { makeCancelable } from '../../utils/promises'

import { JoditWrapper } from './JoditWrapper'

export default class Post extends Component {
  constructor (props) {
    super(props)

    this.state = {
      readyForEditing: false,
      isSubmitting: false,
      peonyError: null,
      lastError: null,
      isNotAuthorized: false,
      newPathname: null,
      hasUpdated: false,
      settings: false,
      // post data
      id: null,
      createdAt: null,
      createdBy: null,
      updatedAt: null,
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
      status: 'draft',
      postType: null,
      featured: false,
      publishedAt: null,
      publishedBy: null,
      visibility: 'public',
      title: null,
      subtitle: null,
      content: null,
      handle: null,
      excerpt: null,
      metadata: null
    }

    this.updateValue = this.updateValue.bind(this)
  }

  updateValue (newValue) {
    this.setState({ content: newValue })
  }

  componentDidMount () {
    if (this.props.match.params.id) {
      this.gettingPostData = makeCancelable(this.getPostData())
      this.resolveGettingPostData()
    } else {
      if (this.props.match.path === '/pages/page') {
        this.setState({
          readyForEditing: true,
          postType: 'page'
        })
      }
      if (this.props.match.path === '/posts/post') {
        this.setState({
          readyForEditing: true,
          postType: 'post'
        })
      }
    }
  }

  componentDidUpdate () {
    const tokenIsAvailabile = isTokenAvailabile()
    if (this.state.peonyError && this.state.peonyError.code === 401 && tokenIsAvailabile) {
      unsetToken()
      this.setState({ isNotAuthorized: true })
    }

    if (this.state.newPathname) {
      this.gettingPostData = makeCancelable(this.getPostData())
      this.resolveGettingPostData()

      this.setState({
        newPathname: null,
        isSubmitting: false,
        readyForEditing: true
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
    if (this.state.id) {
      id = this.state.id
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

  resolveGettingPostData () {
    this.gettingPostData.promise
      .then((data) => {
        if (data instanceof Error) {
          console.error(data)
          this.setState({ lastError: data })
        } else {
          if (isPeonyError(data)) {
            this.setState({ peonyError: data })
          } else {
            this.setState({
              readyForEditing: true,
              // expected post data
              id: data.id,
              createdAt: data.created_at,
              createdBy: data.created_by,
              updatedAt: data.updated_at,
              updatedBy: data.updated_by,
              deletedAt: data.deleted_at,
              deletedBy: data.deleted_by,
              status: data.status,
              postType: data.post_type,
              featured: data.featured,
              publishedAt: data.published_at,
              publishedBy: data.published_by,
              visibility: data.visibility,
              title: data.title,
              subtitle: data.subtitle,
              content: data.content,
              handle: data.handle,
              excerpt: data.excerpt,
              metadata: data.metadata,
              authors: data.authors
            })
          }
        }
      })
      .catch((error) => {
        console.error(error)
        this.setState({
          lastError: error
        })
      })
  }

  render () {
    if (this.state.isNotAuthorized === true) {
      setLoginFrom(this.props.location.pathname)
      return (
        <Redirect to='/login' />
      )
    }

    if (this.state.newPathname) {
      return <Redirect to={this.state.newPathname} />
      // TODO keeps redirecting, doesn't seem to fetch data
      // Should unset in componentDidUpdate
    }

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
                value={this.state.title}
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
                value={this.state.subtitle}
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
                value={this.state.excerpt}
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
                value={this.state.handle}
                onInput={linkEvent(this, handleSettings)}
              />
            </div>
            <div className='form-group'>
              <label for='featured'>featured</label>
              <input
                name='featured'
                id='featured'
                type='checkbox'
                value={this.state.featured}
                onChange={linkEvent(this, handleSettings)}
              />
            </div>
            <div className='form-group'>
              {/* TODO make toggle */}
              <label for='visibility'>visibility</label>
              <select
                name='visibility'
                id='visibility'
                value={this.state.visibility}
                onChange={linkEvent(this, handleSettings)}
              >
                <option value='public'>public</option>
                <option value='paid'>paid</option>
              </select>
            </div>
          </form>
          {/* TODO
        tags: []string
        authors: []id
        metadata: text
        save on input
        delete button
      */}
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
          value={this.state.content}
          updateValue={this.updateValue}
        />

        {settingsMenu}
      </div>
    )
  }
}

async function handleSave (instance) {
  instance.setState({ isSubmitting: true }) // TODO lock everything until submit complete

  if (!instance.state.title) {
    const newError = new Error('missing state.title')
    console.error(newError)
    instance.setState({
      isSubmitting: false,
      lastError: newError
    })
    return
    // TODO display error to user on component update
  }

  if (!instance.state.postType) {
    const newError = new Error('missing state.postType, ensure it is being set in componentDidMount')
    console.error(newError)
    instance.setState({ isSubmitting: false })
    return
  }

  // TODO add authors
  const {
    status,
    postType,
    featured,
    visibility,
    title,
    subtitle,
    content,
    handle,
    excerpt,
    metadata
  } = instance.state

  const postData = {
    status,
    postType,
    featured,
    visibility,
    title,
    subtitle,
    content,
    handle,
    excerpt,
    metadata
  }

  const data = await submitPostData(postData)

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
        id: data.id,
        newPathname: newPathName
      })
    }
  }
}

async function submitPostData (postData) {
  const token = getToken()
  const requestHeaders = new Headers()
  requestHeaders.append('Content-Type', 'application/json')
  appendToken(token, requestHeaders)

  try {
    const response = await fetch(`${config.PEONY_ADMIN_API}/posts`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(postData)
    })
    const data = await response.json()
    return data
  } catch (error) {
    return error
  }
}

async function handleUpdate (instance) {
  instance.setState({ isSubmitting: true })

  if (!instance.state.title) {
    const newError = new Error('missing state.title')
    console.error(newError)
    instance.setState({
      isSubmitting: false,
      lastError: newError
    })
    return
  }

  const {
    status,
    featured,
    visibility,
    title,
    subtitle,
    content,
    handle,
    excerpt,
    metadata
  } = instance.state

  const postData = {
    status,
    featured,
    visibility,
    title,
    subtitle,
    content,
    handle,
    excerpt,
    metadata
  }

  const data = await updatePostData(postData, instance.state.id)

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

async function updatePostData (postData, id) {
  const token = getToken()
  const requestHeaders = new Headers()
  requestHeaders.append('Content-Type', 'application/json')
  appendToken(token, requestHeaders)

  try {
    const response = await fetch(`${config.PEONY_ADMIN_API}/posts/${id}`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(postData)
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
    instance.setState({ [name]: checked })
  } else {
    instance.setState({ [name]: value })
  }
}
