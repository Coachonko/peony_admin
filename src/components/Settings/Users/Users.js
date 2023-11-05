import { Component, linkEvent } from 'inferno'
import { Redirect, Link } from 'inferno-router'

import { config } from '../../../../config'
import { isPeonyError } from '../../../utils/peony'
import { appendToken, getToken } from '../../../utils/auth'
import { makeCancelable } from '../../../utils/promises'

export default class Users extends Component {
  constructor (props) {
    super(props)

    this.state = {
      usersData: null,
      peonyError: null,
      lastError: null,
      isNotAuthorized: false, // TODO redirect if not authorized, copy boilerplate from Posts
      // query parameters
      sortBy: 'createdAt',
      sortOrder: 'ascending',
      filterByrole: null
    }
  }

  async componentDidMount () {
    this.gettingUsersData = makeCancelable(this.getUsersData())
    await this.resolveGettingUsersData()
  }

  componentDidUpdate () {
    if (this.state.errorStatus) {
      // TODO log or display error before redirecting? Pass error to login page?
    }
  }

  componentWillUnmount () {
    if (this.gettingUsersData) {
      this.gettingUsersData.cancel()
    }
  }

  async getUsersData () {
    const token = getToken()
    const requestHeaders = new Headers()
    appendToken(token, requestHeaders)

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
    if (this.state.errorStatus === 401) {
      return (
        <Redirect to='/' />
      )
    }

    if (this.state.usersData && this.state.usersData.length > 0) {
      return (
        <div>
          <div>
            <div>
              <h1>Users</h1>
            </div>

            <div>
              <label for='sort-by'>sort by</label>
              <select
                name='sort-by'
                value={this.state.sortBy}
                onChange={linkEvent(this, handleSettings)}
              >
                <option value='createdAt'>creation date</option>
                <option value='firstName'>name</option>
              </select>
            </div>

            <div>
              <label for='sort-order'>order</label>
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
              <label for='filter-by-role'>role</label>
              <select
                name='filter-by-role'
                value={this.state.filterByRole}
                onChange={linkEvent(this, handleSettings)}
              >
                <option value={null} />
                <option value='admin'>admin</option>
                <option value='member'>member</option>
                <option value='developer'>developer</option>
                <option value='author'>author</option>
                <option value='contributor'>contributor</option>
              </select>
            </div>

            <div>
              {/* // TODO header with invite button (don't create new users manually) */}
              <Link to='/settings/user'>New</Link>
            </div>
          </div>

          <List data={this.state.usersData} />
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

function List ({ data }) {
  return (
    // TODO use ol like posts
    <table>
      <caption>
        List of all users
      </caption>

      <thead>
        <tr>
          <th key='first-name'>First name</th>
          <th key='last-name'>Last name</th>
          <th key='email'>email</th>
        </tr>
      </thead>

      <tbody>
        {data.map((item, index) => (
          <TableRow key={item.email} item={item} index={index} /> // TODO need to use the key?
        ))}
      </tbody>
    </table>
  )
}

function TableRow ({ item, index }) {
  return (
    <tr>
      <TableDataCell id={item.id} content={item.firstName} dataCell='First name' />
      <TableDataCell id={item.id} content={item.lastName} dataCell='Last name' />
      <TableDataCell id={item.id} content={item.email} dataCell='email' />
    </tr>
  )
}

function TableDataCell ({ id, dataCell, content }) {
  return (
    <td data-cell={dataCell}>
      <Link to={`/settings/user/${id}`}>
        {content}
      </Link>
    </td>
  )
}
