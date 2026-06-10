'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import { createClient } from '@/lib/supabase/client'
import type { CompensadoEntrada, CompensadoSaida, Fornecedor, Cliente } from '@/types'

const supabase = createClient()
const TIPOS = ['MDF','MDP','OSB','Compensado Pinus','Compensado Eucalipto','Laminado','Outros']

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function CompensadosPage() {
  const [aba, setAba] = useState<'entradas' | 'saidas'>('entradas')
  const [entradas, setEntradas] = useState<CompensadoEntrada[]>([])
  const [saidas, setSaidas] = useState<CompensadoSaida[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const [{ data: e }, { data: s }, { data: f }, { data: c }] = await Promise.all([
      supabase.from('compensado_entradas').select('*, fornecedores(nome)').order('data', { ascending: false }).limit(200),
      supabase.from('compensado_saidas').select('*, clientes(nome)').order('data', { ascending: false }).limit(200),
      supabase.from('fornecedores').select('id, nome').eq('ativo', true).order('nome'),
      supabase.from('clientes').select('id, nome').eq('ativo', true).order('nome'),
    ])
    setEntradas(e || [])
    setSaidas(s || [])
    setFornecedores((f || []) as any)
    setClientes((c || []) as any)
  }, [])

  useEffect(() => { load() }, [load])

  const sf = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const calcTotal = () => {
    const qtd = parseFloat(form.qtd_chapas || '0')
    const unit = parseFloat(form.valor_unitario || '0')
    const desc = parseFloat(form.desconto_pct || '0')
    if (!qtd || !unit) return ''
    const bruto = qtd * unit
    return (bruto * (1 - desc / 100)).toFixed(2)
  }

  async function salvarEntrada() {
    setLoading(true)
    await supabase.from('compensado_entradas').insert({
      data: form.data || new Date().toISOString().split('T')[0],
      tipo: form.tipo || 'Compensado Pinus',
      espessura: parseFloat(form.espessura || '0'),
      qtd_chapas: parseInt(form.qtd_chapas || '0'),
      fornecedor_id: form.fornecedor_id || null,
      valor_unitario: parseFloat(form.valor_unitario || '0'),
      obs: form.obs || '',
    })
    setLoading(false); setModal(false); setForm({}); load()
  }

  async function salvarSaida() {
    setLoading(true)
    await supabase.from('compensado_saidas').insert({
      data: form.data || new Date().toISOString().split('T')[0],
      tipo: form.tipo || 'Compensado Pinus',
      espessura: parseFloat(form.espessura || '0'),
      qtd_chapas: parseInt(form.qtd_chapas || '0'),
      cliente_id: form.cliente_id || null,
      valor_unitario: parseFloat(form.valor_unitario || '0'),
      desconto_pct: parseFloat(form.desconto_pct || '0'),
      valor_total: parseFloat(calcTotal() || '0'),
      obs: form.obs || '',
    })
    setLoading(false); setModal(false); setForm({}); load()
  }

  async function excluir(table: string, id: string) {
    if (!confirm('Excluir?')) return
    await supabase.from(table).delete().eq('id', id)
    load()
  }

  // Estoque por tipo (simplificado: entradas - saídas)
  const estoque: Record<string, number> = {}
  entradas.forEach(e => { estoque[e.tipo] = (estoque[e.tipo] || 0) + Number(e.qtd_chapas || 0) })
  saidas.forEach(s => { estoque[s.tipo] = (estoque[s.tipo] || 0) - Number(s.qtd_chapas || 0) })

  return (
    <AppLayout>
      <div className="page-header">
        <h2 className="page-title">📦 Compensados</h2>
        <button className="btn-primary" onClick={() => { setForm({ data: new Date().toISOString().split('T')[0] }); setModal(true) }}>
          + {aba === 'entradas' ? 'Nova Entrada' : 'Nova Saída'}
        </button>
      </div>

      {/* Estoque */}
      {Object.keys(estoque).length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          {Object.entries(estoque).filter(([, v]) => v > 0).map(([tipo, qtd]) => (
            <div key={tipo} style={{ background: '#fff', border: '1.5px solid #d4e8da', borderRadius: 8, padding: '10px 16px' }}>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>{tipo}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1a5c2e' }}>{qtd} ch</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '2px solid #e0ece4' }}>
        {[['entradas', '📥 Entradas'], ['saidas', '📤 Saídas']].map(([k, label]) => (
          <button key={k} onClick={() => setAba(k as any)} style={{
            padding: '9px 20px', background: aba === k ? '#1a5c2e' : 'transparent',
            border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer',
            fontSize: 13, fontWeight: aba === k ? 700 : 500,
            color: aba === k ? '#fff' : '#5a7a6a'
          }}>{label}</button>
        ))}
      </div>

      {aba === 'entradas' ? (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Data</th><th>Tipo</th><th>Espessura (mm)</th><th>Qtd Chapas</th><th>Fornecedor</th><th>Valor Unit.</th><th></th></tr></thead>
            <tbody>
              {entradas.length === 0 ? <tr><td colSpan={7} className="empty-state">Nenhuma entrada.</td></tr> :
                entradas.map(e => (
                  <tr key={e.id}>
                    <td>{new Date(e.data + 'T12:00').toLocaleDateString('pt-BR')}</td>
                    <td><span className="badge" style={{ background: '#f0f7f2', color: '#1a5c2e' }}>{e.tipo}</span></td>
                    <td>{e.espessura || '—'}</td>
                    <td style={{ fontWeight: 700 }}>{e.qtd_chapas || '—'}</td>
                    <td>{(e as any).fornecedores?.nome || '—'}</td>
                    <td>{e.valor_unitario ? `R$ ${Number(e.valor_unitario).toFixed(2)}` : '—'}</td>
                    <td><button onClick={() => excluir('compensado_entradas', e.id)} style={{ background: 'none', border: 'none', color: '#c00', cursor: 'pointer' }}>×</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Data</th><th>Tipo</th><th>Espessura</th><th>Qtd</th><th>Cliente</th><th>Unit.</th><th>Desconto</th><th>Total</th><th></th></tr></thead>
          <tbody>
              {saidas.length === 0 ? <tr><td colSpan={9} className="empty-state">Nenhuma saída.</td></tr> :
                saidas.map(s => (
                  <tr key={s.id}>
                    <td>{new Date(s.data + 'T12:00').toLocaleDateString('pt-BR')}</td>
                    <td><span className="badge" style={{ background: '#f0f7f2', color: '#1a5c2e' }}>{s.tipo}</span></td>
                    <td>{s.espessura || '—'}</td>
                    <td style={{ fontWeight: 700 }}>{s.qtd_chapas}</td>
                    <td>{(s as any).clientes?.nome || '—'}</td>
                    <td>{s.valor_unitario ? `R$ ${Number(s.valor_unitario).toFixed(2)}` : '—'}</td>
                    <td>{s.desconto_pct ? `${s.desconto_pct}%` : '—'}</td>
                    <td style={{ fontWeight: 700, color: '#1a5c2e' }}>{s.valor_total ? `R$ ${Number(s.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</td>
                    <td><button onClick={() => excluir('compensado_saidas', s.id)} style={{ background: 'none', border: 'none', color: '#c00', cursor: 'pointer' }}>×</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={aba === 'entradas' ? 'Nova Entrada' : 'Nova Saída'} onClose={() => setModal(false)}>
          <div className="grid-2">
            <div><label className="lbl">Data</label><input type="date" className="inp" value={form.data || ''} onChange={e => sf('data', e.target.value)} /></div>
            <div><label className="lbl">Tipo</label>
              <select className="inp" value={form.tipo || ''} onChange={e => sf('tipo', e.target.value)}>
                <option value="">Selecione...</option>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="lbl">Espessura (mm)</label><input type="number" step="0.5" className="inp" value={form.espessura || ''} onChange={e => sf('espessura', e.target.value)} /></div>
            <div><label className="lbl">Qtd Chapas</label><input type="number" className="inp" value={form.qtd_chapas || ''} onChange={e => sf('qtd_chapas', e.target.value)} /></div>
            {aba === 'entradas' ? (
              <div className="col-span-2"><label className="lbl">Fornecedor</label>
                <select className="inp" value={form.fornecedor_id || ''} onChange={e => sf('fornecedor_id', e.target.value)}>
                  <option value="">Selecione...</option>
                  {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
            ) : (
              <div className="col-span-2"><label className="lbl">Cliente</label>
                <select className="inp" value={form.cliente_id || ''} onChange={e => sf('cliente_id', e.target.value)}>
                  <option value="">Selecione...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            )}
            <div><label className="lbl">Valor Unit. (R$)</label><input type="number" step="0.01" className="inp" value={form.valor_unitario || ''} onChange={e => sf('valor_unitario', e.target.value)} /></div>
            {aba === 'saidas' && <div><label className="lbl">Desconto (%)</label><input type="number" step="0.1" min="0" max="100" className="inp" value={form.desconto_pct || ''} onChange={e => sf('desconto_pct', e.target.value)} /></div>}
          </div>
          {aba === 'saidas' && calcTotal() && (
            <div style={{ marginTop: 10, padding: '10px 14px', background: '#1a5c2e', borderRadius: 8, color: '#fff', fontWeight: 800, fontSize: 15 }}>
              Total: R$ {parseFloat(calcTotal()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <label className="lbl">Observações</label>
            <textarea className="inp" style={{ height: 52, resize: 'vertical' }} value={form.obs || ''} onChange={e => sf('obs', e.target.value)} />
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={aba === 'entradas' ? salvarEntrada : salvarSaida} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}
