import { CircumIcon } from 'circum-icons-inferno'

// TODO this component requires the parent to not use linkEvent
export default function Select ({ children, name, value, onChange }) {
  return (
    <div className='select'>
      <select
        name='sort-order'
        value={this.state.sortOrder}
        onChange={linkEvent(this, handleSettings)}
      >
        {children}
      </select>
      <span className='select-arrow'>
        <CircumIcon name='square_chev_down' />
      </span>
    </div>
  )
}
