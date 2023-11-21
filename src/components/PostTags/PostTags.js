import { Component } from 'inferno'
import { Link } from 'inferno-router'

import { config } from '../../../config'
import { makeCancelable } from '../../utils/promises'
import { getToken, appendToken } from '../../utils/auth'
import { isPeonyError } from '../../utils/peony'

export default class PostTags extends Component {
  constructor (props) {
    super(props)

    this.state = {
      postTagsData: null,
      peonyError: null,
      lastError: null
    }
  }

  async componentDidMount () {
    this.gettingPostTagsData = makeCancelable(this.getPostTagsData())
    await this.resolveGettingPostTagsData()
  }

  componentDidUpdate () {
    if (this.state.peonyError && this.state.peonyError.code === 401) {
      this.props.notAuthorized()
    }
  }

  componentWillUnmount () {
    if (this.gettingPostTagsData) {
      this.gettingPostTagsData.cancel()
    }
  }

  async getPostTagsData () {
    const token = getToken()
    const requestHeaders = new Headers()
    appendToken(token, requestHeaders)

    try {
      const response = await fetch(`${config.PEONY_ADMIN_API}/post_tags`, {
        method: 'GET',
        headers: requestHeaders
      })

      const data = await response.json()
      return data
    } catch (error) {
      return error
    }
  }

  async resolveGettingPostTagsData () {
    try {
      const data = await this.gettingPostTagsData.promise
      if (data instanceof Error) {
        console.error(data)
        this.setState({ lastError: data })
      } else {
        if (isPeonyError(data)) {
          this.setState({ peonyError: data })
        } else {
          this.setState({ postTagsData: data })
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
    if (this.state.postTagsData) {
      let tags
      if (this.state.postTagsData.length === 0) {
        tags = (
          <div>
            No tags exist
          </div>
        )
      } else {
        const listItems = []
        for (const tag of this.state.postTagsData) {
          const linkToPostTag = `/post_tags/tag/${tag.id}`
          listItems.push(
            <li key={tag.id}>
              <Link to={linkToPostTag}>
                <div className='post-tag-info'>
                  <h3 className='title'>{tag.title}</h3>
                  <p>
                    <span className='post-amount'>
                      {tag.posts.length} posts
                    </span>
                  </p>
                </div>
                <span className={`visibility ${tag.visibility}`}>{tag.visibility}</span>
              </Link>
            </li>
          )
        }

        tags = (
          <div className='post-tags-list'>
            <ol>
              {listItems}
            </ol>
          </div>
        )
      }

      return (
        <>
          <div className='route-header'>
            <h1>Tags</h1>
            <div className='new-link'>
              <Link to='/post_tags/tag'>New</Link>
            </div>
          </div>
          <div />
          {tags}
        </>
      )
    }
  }
}
