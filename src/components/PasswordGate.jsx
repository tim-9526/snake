import { useState } from 'react'

// SHA1 of the actual password — plaintext is never stored in the bundle.
// Note: client-side hashing is still security-by-obscurity; a determined attacker
// can brute-force common passwords against this hash. For real access control
// use a server-side solution (e.g. Cloudflare Access).
const PASSWORD_SHA1 = '41dfb730db5c672ede931b79135c7d132424784b'
const SESSION_KEY = 'dose-calc-auth'

async function sha1(str) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function isAuthenticated() {
  try { return sessionStorage.getItem(SESSION_KEY) === '1' } catch { return false }
}

function markAuthenticated() {
  try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* storage blocked */ }
}

export default function PasswordGate({ onPass }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const [checking, setChecking] = useState(false)

  const submit = async () => {
    if (!value || checking) return
    setChecking(true)
    const hash = await sha1(value)
    setChecking(false)

    if (hash === PASSWORD_SHA1) {
      markAuthenticated()
      onPass()
    } else {
      setError(true)
      setShake(true)
      setValue('')
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div className="gate-backdrop">
      <div className={`gate-panel${shake ? ' shake' : ''}`}>
        <div className="gate-icon">▊</div>
        <h1 className="gate-title">投药量计算工具</h1>
        <p className="gate-subtitle">请输入访问密码</p>
        <div className="gate-field">
          <input
            className={`gate-input${error ? ' error' : ''}`}
            type="password"
            value={value}
            autoFocus
            placeholder="密码"
            onChange={e => { setValue(e.target.value); setError(false) }}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
          />
          {error && <span className="gate-error">密码错误</span>}
        </div>
        <button className="gate-btn" onClick={submit} disabled={checking}>
          {checking ? '验证中…' : '进入'}
        </button>
      </div>
    </div>
  )
}
