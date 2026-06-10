'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const MENU = [
  { href: '/dashboard',     label: 'Dashboard',     icon: '📊' },
  { href: '/cadastros',     label: 'Cadastros',     icon: '📋' },
  { href: '/patio',         label: 'Pátio Toras',   icon: '🪵' },
  { href: '/carregamentos', label: 'Carregamentos', icon: '🚛' },
  { href: '/financeiro',    label: 'Financeiro',    icon: '💰' },
  { href: '/compensados',   label: 'Compensados',   icon: '📦' },
  { href: '/combustivel',   label: 'Combustível',   icon: '⛽' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: '#f5f7f5' }}>
      {/* Sidebar */}
      <div style={{
        width: collapsed ? 64 : 240, minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a2f1a 0%, #1a5c2e 100%)',
        transition: 'width 0.25s ease', overflow: 'hidden', flexShrink: 0,
        display: 'flex', flexDirection: 'column', position: 'fixed',
        left: 0, top: 0, bottom: 0, zIndex: 100
      }}>
        {/* Logo */}
        <div style={{ padding: collapsed ? '20px 14px' : '20px 18px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🌲</div>
          {!collapsed && (
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>LAMINADORA</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Sistema de Gestão</div>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 16, padding: 2, flexShrink: 0 }}>
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 0' }}>
          {MENU.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '12px 0' : '11px 18px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: active ? 'rgba(255,255,255,0.13)' : 'transparent',
                borderLeft: active ? '3px solid #4ade80' : '3px solid transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                textDecoration: 'none', fontSize: 13.5,
                fontWeight: active ? 700 : 400,
                transition: 'all 0.15s', whiteSpace: 'nowrap'
              }}>
                <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <button onClick={logout} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: collapsed ? '14px 0' : '14px 18px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          background: 'rgba(255,255,255,0.05)', border: 'none',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap'
        }}>
          <span style={{ fontSize: 17, flexShrink: 0 }}>🚪</span>
          {!collapsed && 'Sair'}
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: collapsed ? 64 : 240, transition: 'margin-left 0.25s', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1.5px solid #e0ece4', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0a2f1a' }}>
            {MENU.find(m => pathname === m.href || pathname.startsWith(m.href + '/'))?.label || 'Laminadora'}
          </div>
          <div style={{ fontSize: 12, color: '#888' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>

        {/* Page */}
        <main style={{ flex: 1, padding: 24 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
