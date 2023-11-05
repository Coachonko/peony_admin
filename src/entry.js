import { render } from 'inferno'
import { BrowserRouter } from 'inferno-router'

import { App } from './components'
import './styles/index.less'

render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
  , document.getElementById('root')
)
