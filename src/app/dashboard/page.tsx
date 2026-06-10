'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export default function DashboardPage() {
  const [stats, setStats] = useState({
    entradasHoje: 0,
    cargasMes: 0,
    contasPendentes: 0,
    totalPendente: 0,
    estoqueCombustivel: 0,
  })
  const [ultimasEntradas, setUltimasEntradas] = useState<any[]>([])

  const load = useCallback(async () => {
    const hoje = new Date().toISOString().split('T')[0]
    const mesAtual = hoje.slice(0, 7) + '-01'

    const [
      { count: entradasHoje },
      { count: cargasMes },
      { data: contas },
      { data: compras },
      { data: saidas },
      { data: entradas },
    ] = await Promise.all([
      supabase.from('entradas_madeira').select('*', { count: 'exact', head: true }).eq('data', hoje),
      supabase.from('carregamentos_cavaco').select('*', { count: 'exact', head: true }).gte('data', mesAtual),
      supabase.from('contas_pagar').select('valor').eq('status', 'pendente'),
      supabase.from('combustivel_compras').select('qtd_litros'),
      supabase.from('combustivel_saidas').select('qtd_litros'),
      supabase.from('entradas_madeira').select('id, data, tipo_medicao, placa, peso_liquido, volume_estereo, fornecedor_id, motorista_id').order('created_at', { ascending: false }).limit(8),
    ])

    const totalPendente = (contas || []).reduce((acc, c) => acc + Number(c.valor), 0)
    const totalComprado = (compras || []).reduce((acc, c) => acc + Number(c.qtd_litros), 0)
    const totalSaiu = (saidas || []).reduce((acc, c) => acc + Number(c.qtd_litros), 0)

    setStats({
      entradasHoje: entradasHoje || 0,
      cargasMes: cargasMes || 0,
      contasPendentes: (contas || []).length,
      totalPendente,
      estoqueCombustivel: totalComprado - totalSaiu,
    })
    setUltimasEntradas(entradas || [])
  }, [])

  useEffect(() => { load() }, [load])

  const kpis = [
    { label: 'Entradas Hoje', value: stats.entradasHoje, icon: '🪵', color: '#1a5c2e', bg: '#e8f5ec' },
    { label: 'Cargas no Mês', value: stats.cargasMes, icon: '🚛', color: '#1565a0', bg: '#e3f0fd' },
    { label: 'Contas Pendentes', value: stats.contasPendentes, icon: '💰', color: '#8b0000', bg: '#fce8e8', sub: `R$ ${stats.totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
    { label: 'Estoque Combustível', value: `${stats.estoqueCombustivel.toFixed(0)} L`, icon: '⛽', color: '#5c4a00', bg: '#fffbe6' },
  ]

  return (
    <AppLayout>
      <div>
        <div style={{ marginBottom: 28 }}>
          <h2 className="page-title">Dashboard</h2>
          <p style={{ margin: '4px 0 0', color: '#6b9a7a', fontSize: 13 }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          {kpis.map((k, i) => (
            <div key={i} style={{ background: k.bg, borderRadius: 12, padding: '20px 18px', borderLeft: `4px solid ${k.color}` }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{k.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 12, color: '#666', fontWeight: 600, marginTop: 2 }}>{k.label}</div>
              {k.sub && <div style={{ fontSize: 12, color: k.color, marginTop: 4, fontWeight: 700 }}>{k.sub}</div>}
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#0a2f1a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🪵 Últimas Entradas de Madeira
          </h3>
          {ultimasEntradas.length === 0 ? (
            <div className="empty-state">Nenhuma entrada registrada ainda.</div>
          ) : (
            <div className="table-wrapper" style={{ boxShadow: 'none' }}>
              <table>
                <thead>
                  <tr>{['Data', 'Tipo', 'Placa', 'Quantidade'].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {ultimasEntradas.map((e: any) => (
                    <tr key={e.id}>
                      <td>{new Date(e.data + 'T12:00').toLocaleDateString('pt-BR')}</td>
                      <td>
                        <span className="badge" style={{ background: e.tipo_medicao === 'peso' ? '#e8f5ec' : '#e3f0fd', color: e.tipo_medicao === 'peso' ? '#1a5c2e' : '#1565a0' }}>
                          {e.tipo_medicao === 'peso' ? '⚖️ Peso' : '📐 Estéreo'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{e.placa || '—'}</td>
                      <td style={{ fontWeight: 700, color: '#1a5c2e' }}>
                        {e.tipo_medicao === 'peso'
                          ? `${Number(e.peso_liquido || 0).toFixed(3)} t`
                          : `${Number(e.volume_estereo || 0).toFixed(3)} m³`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
