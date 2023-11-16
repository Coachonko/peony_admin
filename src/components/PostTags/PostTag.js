import { Component, linkEvent } from 'inferno'
import { Redirect } from 'inferno-router'

import { config } from '../../../config'
import { makeCancelable } from '../../utils/promises'
import { getToken, appendToken } from '../../utils/auth'
import { isPeonyError } from '../../utils/peony'

import { JoditWrapper } from '../shared/JoditWrapper'

export default class PostTag extends Component {
  constructor (props) {
    super(props)

    this.state = {
      readyForEditing: false,
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
      this.setState({ readyForEditing: true })
    }
  }

  async componentDidUpdate () {
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
      return null
    }
  }
}
