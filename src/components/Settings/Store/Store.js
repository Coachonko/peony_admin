import { Component } from 'inferno'

import { config } from '../../../../config'
import { appendToken, getToken } from '../../../utils/auth'
import { makeCancelable } from '../../../utils/promises'

export default class Store extends Component {
  constructor (props) {
    super(props)

    this.state = {
      storeData: null,
      errorStatus: null,
      errorBody: null
    }
  }

  componentDidMount () {
    this.gettingStoreData = makeCancelable(getStoreData(this))
  }

  componentWillUnmount () {
    if (this.gettingStoreData) {
      this.gettingStoreData.cancel()
    }
  }

  render (props) {
    if (this.state.storeData) {
      return (
        <div>
          <h2>Store</h2>
          <Table data={this.state.storeData} />
        </div>
      )
    }
  }
}

async function getStoreData (instance) {
  const token = getToken()
  const requestHeaders = new Headers()
  appendToken(token, requestHeaders)

  try {
    const response = await fetch(`${config.PEONY_ADMIN_API}/store`, {
      method: 'GET',
      headers: requestHeaders
    })

    const data = await response.json()
    if (!response.ok) {
      instance.setState({
        errorStatus: response.status,
        errorBody: data
      })
    } else {
      instance.setState({ storeData: data })
    }
  } catch (error) {
    console.error('Fetch error: ', error)
  }
}

function Table ({ data }) {
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
        <tr>
          <th scope='row'>metadata</th>
          <td data-cell='metadata'>{data.metadata}</td>
        </tr>
      </tbody>

    </table>
  )
}
