import { useState } from 'react'

const PASSWORD = 'snake123'
const SESSION_KEY = 'dose-calc-auth'

export function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export default function PasswordGate({ onPass }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  const submit = () => {
    if (value === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1')
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
        <button className="gate-btn" onClick={submit}>进入</button>
      </div>
    </div>
  )
}
