import { useState } from 'react'

export default function AuthGate({ onSignIn }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    const trimmed = email.trim()
    if (!trimmed || loading) return
    setLoading(true)
    setError(null)
    const err = await onSignIn(trimmed)
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="gate-backdrop">
      <div className="gate-panel">
        <div className="gate-icon">▊</div>
        <h1 className="gate-title">投药量计算工具</h1>

        {sent ? (
          <div className="auth-sent">
            <div className="auth-sent-icon">✉</div>
            <p>登录链接已发送至</p>
            <strong>{email}</strong>
            <p className="auth-sent-hint">点击邮件中的链接即可进入，链接 10 分钟内有效</p>
          </div>
        ) : (
          <>
            <p className="gate-subtitle">输入邮箱，发送登录链接</p>
            <div className="gate-field">
              <input
                className={`gate-input${error ? ' error' : ''}`}
                type="email"
                value={email}
                autoFocus
                placeholder="your@email.com"
                style={{ letterSpacing: 'normal' }}
                onChange={e => { setEmail(e.target.value); setError(null) }}
                onKeyDown={e => { if (e.key === 'Enter') submit() }}
              />
              {error && <span className="gate-error">{error}</span>}
            </div>
            <button className="gate-btn" onClick={submit} disabled={loading || !email.trim()}>
              {loading ? '发送中…' : '发送登录链接'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
