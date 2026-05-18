import { useState, useEffect, useCallback } from 'react'

// SHA1 of the actual password — plaintext is never stored in the bundle.
// Client-side hashing is still security-by-obscurity; use server-side auth for real protection.
const PASSWORD_SHA1 = '41dfb730db5c672ede931b79135c7d132424784b'
const SESSION_KEY = 'dose-calc-auth'
const RATE_KEY = 'dose-calc-rate'

// Cooldown thresholds: [minFailures, cooldownSeconds]
const THRESHOLDS = [
  [10, 3600],  // ≥10 failures → 1 hour
  [5,  300],   // ≥5  failures → 5 min
  [3,  60],    // ≥3  failures → 60 s
]

function getCooldownSeconds(failures) {
  for (const [min, secs] of THRESHOLDS) {
    if (failures >= min) return secs
  }
  return 0
}

function loadRate() {
  try {
    const raw = localStorage.getItem(RATE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { failures: 0, lockedUntil: 0 }
}

function saveRate(rate) {
  try { localStorage.setItem(RATE_KEY, JSON.stringify(rate)) } catch {}
}

function clearRate() {
  try { localStorage.removeItem(RATE_KEY) } catch {}
}

async function sha1(str) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function isAuthenticated() {
  try { return sessionStorage.getItem(SESSION_KEY) === '1' } catch { return false }
}

function markAuthenticated() {
  try { sessionStorage.setItem(SESSION_KEY, '1') } catch {}
}

function secondsLeft(lockedUntil) {
  return Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000))
}

function formatCountdown(secs) {
  if (secs >= 3600) return `${Math.ceil(secs / 3600)} 小时`
  if (secs >= 60)   return `${Math.ceil(secs / 60)} 分钟`
  return `${secs} 秒`
}

export default function PasswordGate({ onPass }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const [checking, setChecking] = useState(false)
  const [countdown, setCountdown] = useState(0)   // seconds remaining in lockout
  const [failures, setFailures] = useState(0)

  // init from localStorage
  useEffect(() => {
    const rate = loadRate()
    setFailures(rate.failures)
    setCountdown(secondsLeft(rate.lockedUntil))
  }, [])

  // countdown ticker
  useEffect(() => {
    if (countdown <= 0) return
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(id); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [countdown])

  const recordFailure = useCallback(() => {
    const rate = loadRate()
    rate.failures += 1
    const cooldown = getCooldownSeconds(rate.failures)
    rate.lockedUntil = cooldown > 0 ? Date.now() + cooldown * 1000 : rate.lockedUntil
    saveRate(rate)
    setFailures(rate.failures)
    setCountdown(secondsLeft(rate.lockedUntil))
  }, [])

  const submit = async () => {
    if (!value || checking || countdown > 0) return

    // re-check lock in case clock drifted
    const rate = loadRate()
    const remaining = secondsLeft(rate.lockedUntil)
    if (remaining > 0) { setCountdown(remaining); return }

    setChecking(true)
    const hash = await sha1(value)
    setChecking(false)

    if (hash === PASSWORD_SHA1) {
      clearRate()
      markAuthenticated()
      onPass()
    } else {
      recordFailure()
      setError(true)
      setShake(true)
      setValue('')
      setTimeout(() => setShake(false), 500)
    }
  }

  const isLocked = countdown > 0

  return (
    <div className="gate-backdrop">
      <div className={`gate-panel${shake ? ' shake' : ''}`}>
        <div className="gate-icon">▊</div>
        <h1 className="gate-title">投药量计算工具</h1>
        <p className="gate-subtitle">请输入访问密码</p>

        {isLocked ? (
          <div className="gate-locked">
            <span className="gate-lock-icon">🔒</span>
            <span>已锁定，请 <strong>{formatCountdown(countdown)}</strong> 后重试</span>
            {failures >= 10 && <span className="gate-locked-hint">连续错误次数过多</span>}
          </div>
        ) : (
          <>
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
              {error && (
                <span className="gate-error">
                  密码错误（已失败 {failures} 次
                  {failures >= 2 && `，再失败 ${3 - Math.min(failures, 2)} 次将锁定`}
                  ）
                </span>
              )}
            </div>
            <button className="gate-btn" onClick={submit} disabled={checking}>
              {checking ? '验证中…' : '进入'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
