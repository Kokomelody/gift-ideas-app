import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('Check your email to confirm your account.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
    }
    setLoading(false)
  }

  const inputStyle = { width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '8px', border: '1px solid var(--rule)', background: 'var(--paper-raised)', color: 'var(--ink)', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem' }}>
      <img src="/favicon.svg" alt="" width="40" height="40" style={{ display: 'block', marginBottom: '1rem' }} />
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '2.25rem', color: 'var(--ink)', margin: '0 0 0.5rem' }}>Goldfish Gifter</h1>
      <p style={{ color: 'var(--ink-soft)', marginBottom: '2rem' }}>Birthday reminders for people with goldfish memories.</p>

      <form onSubmit={handleAuth}>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', fontWeight: 500, backgroundColor: 'var(--coral)', color: 'var(--paper-raised)', border: 'none', borderRadius: '8px', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'One sec...' : isSignUp ? 'Sign up' : 'Sign in'}
        </button>
      </form>

      {message && <p style={{ marginTop: '1rem', color: 'var(--ink-soft)' }}>{message}</p>}

      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ background: 'none', border: 'none', color: 'var(--coral)', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </p>
    </div>
  )
}
