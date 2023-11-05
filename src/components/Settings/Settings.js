import { Component } from 'inferno'
import { Link } from 'inferno-router'

class Settings extends Component {
  render (props) {
    return (
      <div>
        <Link to='/settings/store'>Store</Link>
        <Link to='/settings/users'>Users</Link>
      </div>
    )
  }
}

export default Settings
