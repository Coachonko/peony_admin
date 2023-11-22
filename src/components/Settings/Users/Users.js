import { Component, linkEvent } from 'inferno'
import { Link } from 'inferno-router'

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
    if (this.state.peonyError && this.state.peonyError.code === 401) {
      this.props.notAuthorized()
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
    if (this.state.usersData && this.state.usersData.length > 0) {
      return (
        <>
          <div className='route-header'>
            <div>
              <h1>Users</h1>
            </div>

            <div className='new-link'>
              {/* // TODO header with invite button (don't create new users manually) */}
              <Link to='/settings/user'>New</Link>
            </div>
          </div>

          <div className='route-settings'>
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
          </div>

          <List listData={this.state.usersData} />
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
  if (listData) {
    const listItems = []
    for (const user of listData) {
      const linkToUser = `users/user/${user.id}`
      listItems.push(
        <li key={user.id}>
          <Link to={linkToUser}>
            <div className='user-info'>
              <span className='h4 email'>{user.email}</span>
              <p>
                Since <span className='since'>{user.createdAt}</span>
              </p>
            </div>

            <span className='role'>{user.role}</span>
          </Link>
        </li>
      )
    }

    return (
      <div className='users-list'>
        <ol>
          {listItems}
        </ol>
      </div>
    )
  }
}
