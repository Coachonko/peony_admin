import { Component, linkEvent } from 'inferno'
import { Redirect, Link } from 'inferno-router'

import { config } from '../../../config'
import { isPeonyError } from '../../utils/peony'
import { isTokenAvailabile, appendToken, getToken, unsetToken, setLoginFrom } from '../../utils/auth'
import { makeCancelable } from '../../utils/promises'

// Posts expects:
// `type` string, must be either 'post' or 'page'.
export default class Posts extends Component {
  constructor (props) {
    super(props)

    this.state = {
      listData: null,
      peonyError: null,
      lastError: null,
      isNotAuthorized: false,
      // query parameters
      sortBy: 'created_at',
      sortOrder: 'ascending',
      filterByStatus: null,
      filterByFeatured: null,
      filterByVisibility: null,
      filterByAuthor: null,
      filterByTag: null
    }

    this.isNotAuthorized = this.isNotAuthorized.bind(this)
  }

  async componentDidMount () {
    this.gettingListData = makeCancelable(this.getListData())
    await this.resolveGettingListData()
  }

  async componentDidUpdate (lastProps) {
    if (lastProps.match.path !== this.props.match.path) {
      if (this.gettingListData) {
        this.gettingListData.cancel()
      }

      this.gettingListData = makeCancelable(this.getListData())
      await this.resolveGettingListData()
    }

    const tokenIsAvailabile = isTokenAvailabile()
    if (this.state.peonyError && this.state.peonyError.code === 401 && tokenIsAvailabile) {
      unsetToken()
      this.setState({ isNotAuthorized: true })
    }
  }

  componentWillUnmount () {
    if (this.gettingListData) {
      this.gettingListData.cancel()
    }
  }

  isNotAuthorized () {
    this.setState({ isNotAuthorized: true })
  }

  async getListData () {
    let endpoint
    if (this.props.match.path === '/pages') {
      endpoint = 'pages'
    }
    if (this.props.match.path === '/posts') {
      endpoint = 'posts'
    }

    const token = getToken()
    const requestHeaders = new Headers()
    appendToken(token, requestHeaders)
    try {
      const response = await fetch(`${config.PEONY_ADMIN_API}/${endpoint}`, {
        method: 'GET',
        headers: requestHeaders
      })
      const data = await response.json()
      return data
    } catch (error) {
      return error
    }
  }

  async resolveGettingListData () {
    try {
      const data = await this.gettingListData.promise
      if (data instanceof Error) {
        console.error(data)
        this.setState({ lastError: data })
      } else {
        if (isPeonyError(data)) {
          this.setState({ peonyError: data })
        } else {
          this.setState({ listData: data })
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

    if (this.state.listData && this.state.listData.length >= 0) {
      let title
      if (this.props.match.path === '/pages') {
        title = 'pages'
      }
      if (this.props.match.path === '/posts') {
        title = 'posts'
      }

      let linkToNew
      if (this.props.match.path === '/pages') {
        linkToNew = '/pages/page'
      }
      if (this.props.match.path === '/posts') {
        linkToNew = '/posts/post'
      }

      let settings = null
      if (this.state.listData.length > 0) {
        settings = (
          <>
            <div>
              <label for='sort-order'>sort order</label>
              <select
                name='sort-order'
                value={this.state.sortOrder}
                onChange={linkEvent(this, handleSettings)}
              >

                <option value='ascending'>ascending</option>
                <option value='descending'>descending</option>
              </select>
            </div>
            <div>
              <label for='filter-by-status'>status</label>
              <select
                name='filter-by-status'
                value={this.state.filterByStatus}
                onChange={linkEvent(this, handleSettings)}
              >
                <option value={null} />
                <option value='published'>published</option>
                <option value='draft'>draft</option>
              </select>
            </div>
            {/* TODO filterByFeatured */}
            <div>
              <label for='filter-by-visibility'>visibility</label>
              <select
                name='filter-by-visibility'
                value={this.state.filterByVisibility}
                onChange={linkEvent(this, handleSettings)}
              >
                <option value={null} />
                <option value='public'>public</option>
                <option value='paid'>paid</option>
              </select>

              {/* TODO filterByAuthor */}
              {/* TODO filterByTag */}
            </div>
          </>
        )
      }

      return (
        <div>
          <div>
            <div>
              <h1>{title}</h1>
            </div>
            {settings}
            <div>
              <Link to={linkToNew}>New</Link>
            </div>
          </div>

          <List listData={this.state.listData} />
        </div>
      )
    }
  }
}

function handleSettings (instance, event) {
  // handle souvlaki-case names
  const souvlaki = event.target.getAttribute('name')
  const name = souvlaki.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())

  const { value } = event.target
  console.log(name, value)
  instance.setState({ [name]: value })
}

function List () {
  const listItems = []
  for (const post of this.props.listData) {
    let linkToPost
    if (post.postType === 'post') {
      linkToPost = `/posts/post/${post.id}`
    }
    if (post.postType === 'page') {
      linkToPost = `/pages/page/${post.id}`
    }

    let authors // TODO this is unnecessary, post should always have at least one author
    if (post.authors) {
      authors = post.authors.join(', ')
    }

    const createdAt = new Date(post.createdAt)
    const now = new Date()
    const millisecondAgo = now - createdAt
    const secondAgo = Math.floor(millisecondAgo / 1000)

    let timeUnit = ''
    let timeValue = 0

    if (secondAgo < 60) {
      timeUnit = 'second'
      timeValue = secondAgo
    } else if (secondAgo < 3600) {
      timeUnit = 'minute'
      timeValue = Math.floor(secondAgo / 60)
    } else if (secondAgo < 86400) {
      timeUnit = 'hour'
      timeValue = Math.floor(secondAgo / 3600)
    } else {
      timeUnit = 'day'
      timeValue = Math.floor(secondAgo / 86400)
    }

    if (timeValue !== 1) {
      timeUnit += 's'
    }

    listItems.push(
      // title author status created_at tag
      <li key={post.id}>
        <Link to={linkToPost}>
          <div>
            {post.title}
          </div>
          <div>
            {post.subtitle}
          </div>
          <div>
            {authors}
          </div>
          <div>
            {post.status}
          </div>
          <div>
            {post.visibility}
          </div>
          <div>
            {timeValue} {timeUnit} ago
          </div>
        </Link>
      </li>
    )
  }

  return (
    <div>
      <ol>
        {listItems}
      </ol>
    </div>
  )
}
