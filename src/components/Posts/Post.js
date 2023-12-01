import { Component, linkEvent, createRef } from 'inferno'
import { Redirect } from 'inferno-router'

import { config } from '../../../config'
import { getToken, appendToken } from '../../utils/auth'
import { isPeonyError } from '../../utils/peony'
import { makeCancelable } from '../../utils/promises'

import { Metadata } from '../shared'
import { CircumIcon } from 'circum-icons-inferno'

export default class Post extends Component {
  constructor (props) {
    super(props)

    this.state = {
      isNew: true,
      readyForEditing: false,
      isSubmitting: false,
      peonyError: null,
      lastError: null,
      newPathname: null,
      hasUpdated: false,
      settings: false,
      statusSettings: false,
      sortedMetadata: null,
      postData: null,
      usersData: null,
      postAuthors: [],
      postTagData: null,
      postTags: []
    }

    this.updateLastError = this.updateLastError.bind(this)
    this.updateSortedMetadata = this.updateSortedMetadata.bind(this)
    this.updateContent = this.updateContent.bind(this)

    this.updateAuthors = this.updateAuthors.bind(this)
    this.updateTags = this.updateTags.bind(this)
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

  updateAuthors (newAuthors) {
    this.setState({ postAuthors: newAuthors })
  }

  updateTags (newTags) {
    this.setState({ postTags: newTags })
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
          status: 'draft',
          title: '',
          subtitle: '',
          excerpt: '',
          handle: '',
          featured: false,
          visibility: 'public',
          metadata: {},
          postType: newPostType
        },
        sortedMetadata: [],
        postAuthors: [this.props.currentUserData.id]
      })
    }

    this.gettingUsersData = makeCancelable(this.getUsersData())
    await this.resolveGettingUsersData()
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
    if (this.gettingUsersData) {
      this.gettingUsersData.cancel()
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
          const authorArray = data.authors.map((item) => item.id)
          const postTagArray = data.tags.map((item) => item.id)
          this.setState({
            isNew: false,
            readyForEditing: true,
            postData: {
              ...data,
              metadata: parsedMetadata
            },
            sortedMetadata: metadataArray,
            postAuthors: authorArray,
            postTags: postTagArray
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

  async getUsersData () {
    const token = getToken()
    const requestHeaders = new Headers()
    appendToken(token, requestHeaders)

    // TODO include deleted users
    try {
      const response = await fetch(`${config.PEONY_ADMIN_API}/users`, {
        method: 'GET',
        headers: requestHeaders
      })

      const data = await response.json()
      return data
    } catch (error) {
      return error
    }
  }

  async resolveGettingUsersData () {
    try {
      const data = await this.gettingUsersData.promise
      if (data instanceof Error) {
        console.error(data)
        this.setState({ lastError: data })
      } else {
        if (isPeonyError(data)) {
          this.setState({ peonyError: data })
        } else {
          this.setState({ usersData: data })
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
      let deleteButton
      if (this.state.isNew === false) {
        deleteButton = (
          <div className='form-group'>
            <button
              className='delete'
              type='button'
              name='delete'
              onClick={linkEvent(this, handleDelete)}
              // TODO don't immediately delete, open modal to confirm choice, then delete.
              // TODO when post is deleted, redirect to /posts
            >
              <CircumIcon name='trash' />
              Delete
            </button>
          </div>
        )
      }

      // TODO move to component
      let statusSettings
      if (this.state.isNew === false) {
        if (this.state.postData.status) {
          // TODO use another status variable that is only updated when changes are saved
          // this prevents the radio button to hide the menu when this.state.postData.status === 'draft'
          if (this.state.postData.status === 'published' || this.state.postData.status === 'scheduled') {
            let statusSettingsMenu
            if (this.state.statusSettings === true) {
              statusSettingsMenu = (
                <div className='status-settings'>
                  <fieldset>
                    <legend>Update post status</legend>
                    <div>
                      <input
                        type='radio'
                        name='status'
                        value='published'
                        checked={this.state.postData.status === 'published'}
                        onChange={linkEvent(this, handleSettings)}
                      />
                      <label for='published'>
                        Published
                        <span className='description'>
                          Display this post publicly
                        </span>
                      </label>
                    </div>

                    <div>
                      <input
                        type='radio'
                        name='status'
                        value='draft'
                        checked={this.state.postData.status === 'draft'}
                        onChange={linkEvent(this, handleSettings)}
                      />
                      <label for='draft'>
                        Draft
                        <span className='description'>
                          Revert this {this.state.postData.postType} to a private draft.
                        </span>
                      </label>
                    </div>
                  </fieldset>
                </div>
              )
            }

            statusSettings = (
              <>
                <button
                  name='status'
                  type='button'
                  onClick={linkEvent(this, toggleStatusSettings)}
                >
                  Update
                </button>
                {/* TODO allow post scheduling */}
                {statusSettingsMenu}
              </>
            )
          }

          if (this.state.postData.status === 'draft') {
            // TODO this button publishes immediately without requiring user to press the save button.
            // For predictable behavior, any changes should only be applied when pressing the save button.
            // Only allowed exception should be the delete button, which can show a confirmation dialogue.
            statusSettings = (
              <button
                name='status'
                type='button'
                onClick={linkEvent(this, handlePublish)}
              >
                Publish
              </button>
            )
            /* TODO publish menu: radio buttons publish now or schedule */
          }
        }
      }

      // TODO move settingsMenu to component
      let settingsMenu
      if (this.state.settings === true) {
        const { title, subtitle, excerpt, handle, featured, visibility, postType } = this.state.postData

        let canFeature
        if (postType === 'post') {
          canFeature = (
            <div className='form-group checkbox-group'>
              <input
                className='checkbox-input'
                name='featured'
                type='checkbox'
                checked={featured}
                onChange={linkEvent(this, handleSettings)}
              />
              <label for='featured'>Feature this post</label>
            </div>
          )
        }

        settingsMenu = (
          <div className='editor-settings'>
            <div className='header'>
              <span className='h4'>{postType.charAt(0).toUpperCase() + postType.slice(1)} settings</span>
              <button
                className='settings-toggle'
                title='Settings'
                type='button'
                onClick={linkEvent(this, toggleSettings)}
              >
                <CircumIcon name='square_chev_right' />
              </button>
            </div>
            <form>
              <div className='form-group'>
                <label for='title'>Title</label>
                <input
                  name='title'
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
                  type='text'
                  spellCheck='true'
                  autoComplete='off'
                  value={subtitle}
                  onInput={linkEvent(this, handleSettings)}
                />
              </div>
              <div className='form-group'>
                <label for='excerpt'>Excerpt</label>
                <textarea
                  name='excerpt'
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
                  type='text'
                  spellCheck='false'
                  autoComplete='off'
                  value={handle}
                  onInput={linkEvent(this, handleSettings)}
                />
              </div>
              {canFeature}
              <div className='form-group'>
                {/* TODO make toggle */}
                <label for='visibility'>Visibility</label>
                <select
                  name='visibility'
                  value={visibility}
                  onChange={linkEvent(this, handleSettings)}
                >
                  <option value='public'>Public</option>
                  <option value='paid'>Paid</option>
                </select>
              </div>

              <div className='form-group'>
                <ListBox
                  label='Authors'
                  name='authors'
                  itemType='user'
                  currentUserData={this.props.currentUserData}
                  availableItems={this.state.usersData}
                  selectedItems={this.state.postAuthors}
                  updateSelectedItems={this.updateAuthors}
                />
              </div>

              <div className='form-group'>
                <ListBox
                  label='Tags'
                  name='post-tags'
                  itemType='postTag'
                  availableItems={this.state.postTagData}
                  selectedItems={this.state.tags}
                  updateSelectedItems={this.updateTags}
                />
              </div>

              <div className='form-group'>
                <label for='metadata'>metadata</label>
                <Metadata
                  lastError={this.state.lastError}
                  updateLastError={this.updateLastError}
                  sortedMetadata={this.state.sortedMetadata}
                  updateSortedMetadata={this.updateSortedMetadata}
                />
                {deleteButton}
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
        <>
          <div className='post-editor'>
            <div className='editor-row'>
              <div className='editor-header'>
                <button
                  className='save-button'
                  type='button'
                  onClick={linkEvent(this, saveHandler)}
                >
                  <CircumIcon name='floppy_disk' />
                </button>

                <div className='settings'>
                  {statusSettings}

                  <button
                    className='settings-toggle'
                    title='Settings'
                    type='button'
                    onClick={linkEvent(this, toggleSettings)}
                    disabled={this.state.settings}
                  >
                    <CircumIcon name='square_chev_left' />
                  </button>
                </div>
              </div>

              <div className='editor-body'>
                <JoditWrapper
                  value={this.state.postData.content}
                  updateValue={this.updateContent}
                />
              </div>
            </div>

            {settingsMenu}
          </div>
        </>
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

function toggleStatusSettings (instance) {
  instance.setState({ statusSettings: !instance.state.statusSettings })
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

async function handlePublish (instance) {
  instance.setState({
    postData: {
      ...instance.state.postData,
      status: 'published'
    }
  })
  await handleUpdate(instance)
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

/*
*
* ListBox
*
* Props
* name: string to set the name attribute of input element
* label : string to set the label content of the input element
* itemType: either 'user' or 'postTag'
* currentUserData: provide only when itemType is 'user'
* availableItems: object containing 'user' or 'postTag' objects
* selectedItems: array of ids, subset of availableItems
* updateSelectedItems: function that receives an array of id, subset of availableItems
*
*/

class ListBox extends Component {
  constructor (props) {
    super(props)

    this.state = {
      inputValue: ''
    }

    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleInputClick = this.handleInputClick.bind(this)
  }

  handleInputChange (event) {
    this.setState({ inputValue: event.target.value })
  }

  handleInputClick (event) {
    console.log(event.target.name)
    let newSelectedItems
    if (this.props.selectedItems.includes(event.target.name)) {
      newSelectedItems = this.props.selectedItems.filter((id) => id !== event.target.name)
    } else {
      newSelectedItems = [...this.props.selectedItems, event.target.name]
    }

    this.props.updateSelectedItems(newSelectedItems)
  }

  componentDidUpdate (lastProps) {
    // Reset the input value when availableItems changes
    if (lastProps.availableItems !== this.props.availableItems) {
      this.setState({ inputValue: '' })
    }
  }

  render () {
    if (!this.props.availableItems) {
      return null
    }

    // If there is only one user, do not offer choice of authors.
    // Note: there is always at least one user in peony.
    if (this.props.itemType === 'user' && this.props.availableItems.length === 1) {
      return null
    }

    let itemField
    if (this.props.itemType === 'user') {
      itemField = 'email'
    }
    if (this.props.itemType === 'postTag') {
      itemField = 'title'
    }

    const filteredItems = []
    for (const item of this.props.availableItems) {
      if (item[itemField].includes(this.state.inputValue)) {
        filteredItems.push(item)
      }
    }

    const selectedItems = []
    for (const itemId of this.props.selectedItems) {
      // Find the corresponding item in availableItems based on itemId
      for (const item of this.props.availableItems) {
        if (item.id === itemId) {
          selectedItems.push(
            <div className='selected-item' key={item.id}>
              {item[itemField]}
              <button
                type='button'
                className='remove'
                name={item.id}
                onClick={this.handleInputClick}
              >
                <CircumIcon name='trash' />
              </button>
            </div>
          )
          break
        }
      }
    }

    const availableItems = []
    for (const item of filteredItems) {
      // do not list selected items
      if (!this.props.selectedItems.includes(item.id)) {
        availableItems.push(
          <div
            className='available-item'
            key={item.id}
          >
            {item[itemField]}
            <button
              type='button'
              className='add'
              name={item.id}
              onClick={this.handleInputClick}
            >
              <CircumIcon name='square_plus' />
            </button>
          </div>
        )
      }
    }

    return (
      <div className='listbox-items'>
        <div>
          <label for={this.props.name}>{this.props.label}</label>
          {selectedItems}
        </div>

        <input
          name={this.props.name}
          type='text'
          placeholder='Filter'
          value={this.state.inputValue}
          onInput={this.handleInputChange}
        />

        <div>
          {/* TODO
          allow drag and drop sorting
          hover for more information about items
          */}
          {availableItems}
        </div>
      </div>
    )
  }
}

/*
*
* JoditWrapper
*
* Props
* value: content of the editor
* updateValue: function used to update the content of the editor
*
*/

const { JoditEditor } = (await import('jodit-inferno'))
const { Jodit } = await import('jodit-inferno')

class JoditWrapper extends Component {
  constructor (props) {
    super(props)

    this.editor = createRef()
    this.handleBlur = this.handleBlur.bind(this)
  }

  handleBlur (newValue) {
    this.props.updateValue(newValue)
  }

  render () {
    return (
      <JoditEditor
        className='jodit-editor'
        config={joditConfig}
        ref={this.editor}
        value={this.props.value}
        onBlur={this.handleBlur}
      />
    )
  }
}

const joditConfig = {
  inline: true,
  toolbar: false,
  toolbarInline: true,
  toolbarInlineForSelection: true,
  popup: {
    selection: Jodit.atom([
      'bold',
      'italic',
      'underline',
      'strikethrough',
      'superscript',
      'subscript',
      'ul',
      'ol',
      'paragraph',
      'table',
      'link',
      'spellcheck'
    ])
  },
  showXPathInStatusbar: false,
  showCharsCounter: true,
  showWordsCounter: true,
  addNewLine: false,
  theme: 'dark' // TODO customize https://xdsoft.net/jodit/examples/theme/dark.html
}
