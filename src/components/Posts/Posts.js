import { Component, linkEvent } from 'inferno'
import { Link } from 'inferno-router'

import { config } from '../../../config'
import { isPeonyError } from '../../utils/peony'
import { appendToken, getToken } from '../../utils/auth'
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
      // query parameters
      sortBy: 'created_at',
      sortOrder: 'ascending',
      filterByStatus: null,
      filterByFeatured: null,
      filterByVisibility: null,
      filterByAuthor: null,
      filterByTag: null
    }
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

    if (this.state.peonyError && this.state.peonyError.code === 401) {
      this.props.notAuthorized()
    }
  }

  componentWillUnmount () {
    if (this.gettingListData) {
      this.gettingListData.cancel()
    }
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
    if (this.state.listData && this.state.listData.length >= 0) {
      let title
      if (this.props.match.path === '/pages') {
        title = 'Pages'
      }
      if (this.props.match.path === '/posts') {
        title = 'Posts'
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
          <div className='route-settings'>
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
          </div>
        )
      }

      return (
        <>
          <div className='route-header'>
            <h1>{title}</h1>
            <div className='new-link'>
              <Link to={linkToNew}>New</Link>
            </div>
          </div>

          {settings}

          <List listData={this.state.listData} />
        </>
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

function List ({ listData }) {
  const listItems = []
  for (const post of listData) {
    let linkToPost
    if (post.postType === 'post') {
      linkToPost = `/posts/post/${post.id}`
    }
    if (post.postType === 'page') {
      linkToPost = `/pages/page/${post.id}`
    }

    let primaryAuthor
    if (post.authors[0].firstName !== '' || post.authors[0].lastName !== '') {
      primaryAuthor = `${post.authors[0].firstName} ${post.authors[0].lastName}`.trim()
    } else {
      primaryAuthor = post.authors[0].handle
    }
    primaryAuthor = `${primaryAuthor}`

    let primaryTag
    if (post.tags && post.tags.length > 0) {
      primaryTag = `${post.tags[0].title}`
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

    let primaryTagElement
    if (primaryTag) {
      primaryTagElement = <>in <span className='primary-tag'>{primaryTag}</span></>
    }

    listItems.push(
      <li key={post.id}>
        <Link to={linkToPost}>
          <div className='post-info'>
            <h3 className='title'>{post.title}</h3>
            <p>
              by <span className='primary-author'>{primaryAuthor}</span>
              {primaryTagElement}
              <span className='time-ago'>{timeValue} {timeUnit} ago</span>
            </p>
          </div>
          <span className={`status ${post.status}`}>
            {post.status}
          </span>
        </Link>
      </li>
    )
  }

  return (
    <div className='posts-list'>
      <ol>
        {listItems}
      </ol>
    </div>
  )
}
