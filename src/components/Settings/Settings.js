import { Component } from 'inferno'
import { Link } from 'inferno-router'

class Settings extends Component {
  render (props) {
    return (
      <>
        <h1>Settings</h1>
        <div className='settings-container'>
          <div className='settings-link'>
            <Link to='/settings/store'>
              <span className='h4'>Store</span>
            </Link>
          </div>
          <div className='settings-link'>
            <Link to='/settings/users'>
              <span className='h4'>Users</span>
            </Link>
          </div>
        </div>
      </>
    )
  }
}

export default Settings
