import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import PasswordGate, { isAuthenticated } from './components/PasswordGate.jsx'
import './styles/global.css'

function Root() {
  const [passed, setPassed] = useState(isAuthenticated)
  if (!passed) return <PasswordGate onPass={() => setPassed(true)} />
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
