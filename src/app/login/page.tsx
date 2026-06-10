'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou senha inválidos')
      setLoading(false)
    } else {
      router.replace('/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a2f1a 0%, #1a5c2e 50%, #0d4020 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.97)', borderRadius: 16,
        padding: '48px 40px', width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, background: 'linear-gradient(135deg, #1a5c2e, #2d8a4e)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 32
          }}>🌲</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0a2f1a', margin: '0 0 4px' }}>LAMINADORA</h1>
          <p style={{ color: '#5a8a6a', fontSize: 13, margin: 0 }}>Sistema de Gestão Industrial</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="lbl">Email</label>
            <input
              value={email} onChange={e => setEmail(e.target.value)}
              type="email" required className="inp"
              placeholder="usuario@email.com"
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="lbl">Senha</label>
            <input
              value={password} onChange={e => setPassword(e.target.value)}
              type="password" className="inp" placeholder="••••••••"
            />
          </div>
          {error && (
            <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 16, textAlign: 'center', background: '#fdecea', padding: '8px 12px', borderRadius: 6 }}>
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: 13, fontSize: 15 }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
