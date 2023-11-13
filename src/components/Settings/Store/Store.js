import { Component, linkEvent } from 'inferno'

import { config } from '../../../../config'
import { appendToken, getToken } from '../../../utils/auth'
import { makeCancelable } from '../../../utils/promises'
import { isPeonyError } from '../../../utils/peony'

import { Metadata } from '../../shared/Metadata'

export default class Store extends Component {
  constructor (props) {
    super(props)

    this.state = {
      storeData: null,
      sortedMetadata: null,
      isSubmitting: false,
      hasUpdated: null,
      errorStatus: null,
      errorBody: null
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
    this.gettingStoreData = makeCancelable(this.getStoreData())
    await this.resolveGettingStoreData()
  }

  componentDidUpdate () {
    if (this.state.hasUpdated === true) {
      this.setState({ hasUpdated: false })
    }
  }

  componentWillUnmount () {
    if (this.gettingStoreData) {
      this.gettingStoreData.cancel()
    }
  }

  async getStoreData () {
    const token = getToken()
    const requestHeaders = new Headers()
    appendToken(token, requestHeaders)

    try {
      const response = await fetch(`${config.PEONY_ADMIN_API}/store`, {
        method: 'GET',
        headers: requestHeaders
      })

      const data = await response.json()
      return data
    } catch (error) {
      return error
    }
  }

  async resolveGettingStoreData () {
    try {
      const data = await this.gettingStoreData.promise
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
            sortedMetadata: metadataArray,
            storeData: {
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

  render (props) {
    if (this.state.storeData) {
      const storeData = this.state.storeData

      return (
        <div>
          <h2>Store</h2>
          <div>
            <button
              type='button'
              onClick={linkEvent(this, handleUpdate)}
            >
              save
            </button>
          </div>
          <table>
            <caption>
              Store settings
            </caption>

            <tbody>
              <tr>
                <th scope='row'>ID</th>
                <td data-cell='id'>{storeData.id}</td>
              </tr>
              <tr>
                <th scope='row'>Creation date</th>
                <td data-cell='createdAt'>{storeData.createdAt}</td>
              </tr>
              <tr>
                <th scope='row'>Last updated</th>
                <td data-cell='updatedAt'>{storeData.updatedAt}</td>
              </tr>
              <tr>
                <th scope='row'>Name</th>
                <td data-cell='name'>
                  <input
                    name='name'
                    type='text'
                    spellCheck='false'
                    autoComplete='off'
                    value={this.state.storeData.name}
                    onInput={linkEvent(this, handleInputChange)}
                    disabled={this.state.isSubmitting}
                  />
                </td>
              </tr>
              <tr>
                <th scope='row'>Default locale</th>
                <td data-cell='defaultLocaleCode'>
                  {storeData.defaultLocaleCode}
                  {/* TODO should be a select */}
                </td>
              </tr>
              <tr>
                <th scope='row'>Default currency</th>
                <td data-cell='defaultCurrencyCode'>
                  {storeData.defaultCurrencyCode}
                  {/* TODO should be a select */}
                </td>
              </tr>
              {/* <tr>
                <th scope='row'>Swap link template</th>
                <td data-cell='swapLinkTemplate'>{storeData.swapLinkTemplate}</td>
              </tr>
              <tr>
                <th scope='row'>Payment link template</th>
                <td data-cell='paymentLinkTemplate'>{storeData.paymentLinkTemplate}</td>
              </tr> */}
              <tr>
                <th scope='row'>Invite link template</th>
                <td data-cell='inviteLinkTemplate'>
                  {storeData.inviteLinkTemplate}
                  {/* TODO don't know yet */}
                </td>
              </tr>
              <tr>
                <th scope='row'>Default stock location</th>
                <td data-cell='defaultStockLocationId'>
                  {storeData.defaultStockLocationId}
                  {/* TODO don't know yet */}
                </td>
              </tr>
              <tr>
                <th scope='row'>Default sales channel</th>
                <td data-cell='defaultSalesChannelId'>
                  {storeData.defaultSalesChannelId}
                  {/* TODO don't know yet */}
                </td>
              </tr>

              <tr>
                <th scope='row'>Metadata</th>
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

  if (!instance.state.storeData.name) {
    const newError = new Error('name is required')
    console.error(newError)
    instance.setState({
      isSubmitting: false,
      lastError: newError
    })
    return
  }
  if (!instance.state.storeData.defaultLocaleCode) {
    const newError = new Error('defaultLocaleCode is required')
    console.error(newError)
    instance.setState({
      isSubmitting: false,
      lastError: newError
    })
    return
  }
  if (!instance.state.storeData.defaultCurrencyCode) {
    const newError = new Error('defaultCurrencyCode is required')
    console.error(newError)
    instance.setState({
      isSubmitting: false,
      lastError: newError
    })
    return
  }

  const {
    name,
    defaultLocaleCode,
    defaultCurrencyCode,
    inviteLinkTemplate,
    defaultStockLocationId,
    defaultSalesChannelId
  } = instance.state.postData

  const metadataObject = instance.state.sortedMetadata.reduce((acc, curr) => ({ ...acc, ...curr }), {})

  const storeDataToSend = {
    name,
    defaultLocaleCode,
    defaultCurrencyCode,
    inviteLinkTemplate,
    defaultStockLocationId,
    defaultSalesChannelId,
    metadata: metadataObject
  }

  const data = await updatePostData(storeDataToSend, instance.state.storeData.id)

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

async function updatePostData (storeDataToSend, id) {
  const token = getToken()
  const requestHeaders = new Headers()
  requestHeaders.append('Content-Type', 'application/json')
  appendToken(token, requestHeaders)

  try {
    const response = await fetch(`${config.PEONY_ADMIN_API}/store/${id}`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(storeDataToSend)
    })
    const data = await response.json()
    return data
  } catch (error) {
    return error
  }
}

function handleInputChange (instance, event) {
  instance.setState({
    storeData: {
      ...instance.state.storeData,
      [event.target.name]: event.target.value
    }
  })
}
