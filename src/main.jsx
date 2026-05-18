import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AuthGate from './components/AuthGate.jsx'
import { useAuth } from './store/useAuth.js'
import './styles/global.css'

function Root() {
  const { session, signInWithEmail, signOut } = useAuth()

  if (session === undefined) {
    return <div className="auth-loading"><span className="auth-loading-dot" /></div>
  }

  if (!session) {
    return <AuthGate onSignIn={signInWithEmail} />
  }

  return <App userId={session.user.id} onSignOut={signOut} />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
