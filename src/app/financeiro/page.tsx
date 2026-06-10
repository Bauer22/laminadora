'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import { createClient } from '@/lib/supabase/client'
import type { ContaPagar, Fornecedor } from '@/types'
import { CENTROS_CUSTO, SUB_CENTROS } from '@/types'

const supabase = createClient()

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pendente:  { bg: '#fff3e0', color: '#e65100' },
  pago:      { bg: '#e8f5e9', color: '#1b5e20' },
  vencido:   { bg: '#fce4ec', color: '#880e4f' },
  cancelado: { bg: '#f5f5f5', color: '#757575' },
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="modal-overlay">
      <div className={`modal-box${wide ? ' wide' : ''}`}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function FinanceiroPage() {
  const [contas, setContas] = useState<ContaPagar[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Partial<ContaPagar & { valor_str: string }>>({})
  const [loading, setLoading] = useState(false)
  const [filtros, setFiltros] = useState({ status: '', centro: '', dataInicio: '', dataFim: '' })

  const load = useCallback(async () => {
    const [{ data: c }, { data: f }] = await Promise.all([
      supabase.from('contas_pagar').select('*, fornecedores(nome)').order('data_vencimento', { ascending: true }).limit(500),
      supabase.from('fornecedores').select('id, nome').eq('ativo', true).order('nome'),
    ])
    setContas(c || [])
    setFornecedores((f || []) as any)
  }, [])

  useEffect(() => { load() }, [load])

  const s = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  async function salvar() {
    if (!form.descricao || !form.centro_custo) return
    setLoading(true)
    await supabase.from('contas_pagar').insert({
      data_emissao: form.data_emissao || new Date().toISOString().split('T')[0],
      data_vencimento: form.data_vencimento || null,
      fornecedor_id: form.fornecedor_id || null,
      descricao: form.descricao,
      centro_custo: form.centro_custo,
      sub_centro_custo: form.sub_centro_custo || null,
      valor: parseFloat(form.valor_str || '0'),
      status: 'pendente',
      obs: form.obs || '',
    })
    setLoading(false); setModal(false); setForm({}); load()
  }

  async function marcarPago(id: string) {
    await supabase.from('contas_pagar').update({ status: 'pago', data_pagamento: new Date().toISOString().split('T')[0] }).eq('id', id)
    load()
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta conta?')) return
    await supabase.from('contas_pagar').delete().eq('id', id)
    load()
  }

  const lista = contas.filter(c =>
    (!filtros.status || c.status === filtros.status) &&
    (!filtros.centro || c.centro_custo === filtros.centro) &&
    (!filtros.dataInicio || (c.data_vencimento || '') >= filtros.dataInicio) &&
    (!filtros.dataFim || (c.data_vencimento || '') <= filtros.dataFim)
  )

  const totalPendente = lista.filter(c => c.status === 'pendente').reduce((acc, c) => acc + Number(c.valor), 0)
  const totalPago = lista.filter(c => c.status === 'pago').reduce((acc, c) => acc + Number(c.valor), 0)

  const subCentros = form.centro_custo ? (SUB_CENTROS[form.centro_custo] || []) : []

  return (
    <AppLayout>
      <div className="page-header">
        <h2 className="page-title">💰 Financeiro — Contas a Pagar</h2>
        <button className="btn-primary" onClick={() => { setForm({ data_emissao: new Date().toISOString().split('T')[0] }); setModal(true) }}>+ Novo Lançamento</button>
      </div>

      <div className="filter-bar">
        <div><label className="lbl">Status</label>
          <select className="inp" style={{ width: 140 }} value={filtros.status} onChange={e => setFiltros(p => ({ ...p, status: e.target.value }))}>
            <option value="">Todos</option>
            {['pendente', 'pago', 'vencido', 'cancelado'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div><label className="lbl">Centro de Custo</label>
          <select className="inp" style={{ width: 220 }} value={filtros.centro} onChange={e => setFiltros(p => ({ ...p, centro: e.target.value }))}>
            <option value="">Todos</option>
            {CENTROS_CUSTO.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><label className="lbl">Venc. Início</label><input type="date" className="inp" style={{ width: 150 }} value={filtros.dataInicio} onChange={e => setFiltros(p => ({ ...p, dataInicio: e.target.value }))} /></div>
        <div><label className="lbl">Venc. Fim</label><input type="date" className="inp" style={{ width: 150 }} value={filtros.dataFim} onChange={e => setFiltros(p => ({ ...p, dataFim: e.target.value }))} /></div>
        <button className="btn-ghost" onClick={() => setFiltros({ status: '', centro: '', dataInicio: '', dataFim: '' })}>Limpar</button>
      </div>

      <div className="totais-bar">
        <div className="total-card"><div className="value">{lista.length}</div><div className="label">Lançamentos</div></div>
        <div className="total-card" style={{ borderLeftColor: '#e65100' }}>
          <div className="value" style={{ color: '#e65100', fontSize: 18 }}>R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className="label" style={{ color: '#e65100' }}>Pendente</div>
        </div>
        <div className="total-card" style={{ borderLeftColor: '#1b5e20' }}>
          <div className="value" style={{ color: '#1b5e20', fontSize: 18 }}>R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className="label" style={{ color: '#1b5e20' }}>Pago</div>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead><tr><th>Emissão</th><th>Vencimento</th><th>Fornecedor</th><th>Descrição</th><th>Centro de Custo</th><th>Valor</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {lista.length === 0 ? <tr><td colSpan={8} className="empty-state">Nenhum lançamento.</td></tr> :
              lista.map(c => {
                const st = STATUS_STYLE[c.status] || STATUS_STYLE.pendente
                return (
                  <tr key={c.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(c.data_emissao + 'T12:00').toLocaleDateString('pt-BR')}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{c.data_vencimento ? new Date(c.data_vencimento + 'T12:00').toLocaleDateString('pt-BR') : '—'}</td>
                    <td>{(c as any).fornecedores?.nome || '—'}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.descricao}</td>
                    <td style={{ fontSize: 11 }}>{c.centro_custo}{c.sub_centro_custo ? ` / ${c.sub_centro_custo}` : ''}</td>
                    <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>R$ {Number(c.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td><span className="badge" style={st}>{c.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {c.status === 'pendente' && (
                          <button onClick={() => marcarPago(c.id)} style={{ background: '#e8f5e9', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: '#1b5e20', fontWeight: 700 }}>✓ Pago</button>
                        )}
                        <button onClick={() => excluir(c.id)} style={{ background: 'none', border: 'none', color: '#c00', cursor: 'pointer', fontSize: 14 }}>×</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Novo Lançamento" onClose={() => setModal(false)} wide>
          <div className="grid-2">
            <div><label className="lbl">Data Emissão</label><input type="date" className="inp" value={form.data_emissao || ''} onChange={e => s('data_emissao', e.target.value)} /></div>
            <div><label className="lbl">Data Vencimento</label><input type="date" className="inp" value={form.data_vencimento || ''} onChange={e => s('data_vencimento', e.target.value)} /></div>
            <div className="col-span-2"><label className="lbl">Fornecedor</label>
              <select className="inp" value={form.fornecedor_id || ''} onChange={e => s('fornecedor_id', e.target.value)}>
                <option value="">Selecione...</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className="lbl">Descrição *</label><input className="inp" value={form.descricao || ''} onChange={e => s('descricao', e.target.value)} /></div>
            <div><label className="lbl">Centro de Custo *</label>
              <select className="inp" value={form.centro_custo || ''} onChange={e => { s('centro_custo', e.target.value); s('sub_centro_custo', '') }}>
                <option value="">Selecione...</option>
                {CENTROS_CUSTO.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="lbl">Sub-Centro</label>
              <select className="inp" value={form.sub_centro_custo || ''} onChange={e => s('sub_centro_custo', e.target.value)} disabled={subCentros.length === 0}>
                <option value="">—</option>
                {subCentros.map(sc => <option key={sc} value={sc}>{sc}</option>)}
              </select>
            </div>
            <div><label className="lbl">Valor (R$) *</label><input type="number" step="0.01" min="0" className="inp" value={form.valor_str || ''} onChange={e => s('valor_str', e.target.value)} /></div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label className="lbl">Observações</label>
            <textarea className="inp" style={{ height: 52, resize: 'vertical' }} value={form.obs || ''} onChange={e => s('obs', e.target.value)} />
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={salvar} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}
