import { Alerts } from './shared'
import { Routes } from '.'

// TODO give state, pass prop to update state to children
// display error messages in Alerts when appropriate state
// use shouldComponentUpdate in children to prevent useless re-renders

function App ({ currentUserData }) {
  return (
    <>
      <Alerts />
      <Routes />
    </>
  )
}

export default App
