import { Component } from 'inferno'

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
      errorStatus: null,
      errorBody: null,
      sortedMetadata: null
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
      return (
        <div>
          <h2>Store</h2>
          <Table data={this.state.storeData}>
            <tr>
              <th scope='row'>metadata</th>
              <td data-cell='metadata'>
                <Metadata
                  lastError={this.state.lastError}
                  updateLastError={this.updateLastError}
                  sortedMetadata={this.state.sortedMetadata}
                  updateSortedMetadata={this.updateSortedMetadata}
                />
              </td>
            </tr>
          </Table>
        </div>
      )
    }
  }
}

function Table ({ data, children }) {
  return (
    <table>
      <caption>
        Store settings
      </caption>

      <tbody>
        <tr>
          <th scope='row'>id</th>
          <td data-cell='id'>{data.id}</td>
        </tr>
        <tr>
          <th scope='row'>createdAt</th>
          <td data-cell='createdAt'>{data.createdAt}</td>
        </tr>
        <tr>
          <th scope='row'>updatedAt</th>
          <td data-cell='updatedAt'>{data.updatedAt}</td>
        </tr>
        <tr>
          <th scope='row'>name</th>
          <td data-cell='name'>{data.name}</td>
        </tr>
        <tr>
          <th scope='row'>defaultLocaleCode</th>
          <td data-cell='defaultLocaleCode'>{data.defaultLocaleCode}</td>
        </tr>
        <tr>
          <th scope='row'>defaultCurrencyCode</th>
          <td data-cell='defaultCurrencyCode'>{data.defaultCurrencyCode}</td>
        </tr>
        <tr>
          <th scope='row'>swapLinkTemplate</th>
          <td data-cell='swapLinkTemplate'>{data.swapLinkTemplate}</td>
        </tr>
        <tr>
          <th scope='row'>paymentLinkTemplate</th>
          <td data-cell='paymentLinkTemplate'>{data.paymentLinkTemplate}</td>
        </tr>
        <tr>
          <th scope='row'>inviteLinkTemplate</th>
          <td data-cell='inviteLinkTemplate'>{data.inviteLinkTemplate}</td>
        </tr>
        <tr>
          <th scope='row'>defaultStockLocationId</th>
          <td data-cell='defaultStockLocationId'>{data.defaultStockLocationId}</td>
        </tr>
        <tr>
          <th scope='row'>defaultSalesChannelId</th>
          <td data-cell='defaultSalesChannelId'>{data.defaultSalesChannelId}</td>
        </tr>
        {children}

      </tbody>

    </table>
  )
}
