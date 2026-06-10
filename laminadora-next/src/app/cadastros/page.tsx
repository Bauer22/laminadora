'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import { createClient } from '@/lib/supabase/client'
import type { Motorista, Veiculo, Fornecedor, Cliente } from '@/types'

const supabase = createClient()
const inp = 'inp'
const lbl = 'lbl'

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

// ── MOTORISTAS ─────────────────────────────────────────────
function TabMotoristas() {
  const [data, setData] = useState<Motorista[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Partial<Motorista>>({})
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('motoristas').select('*').order('nome')
    setData(data || [])
  }, [])

  useEffect(() => { load() }, [load])

  async function salvar() {
    if (!form.nome) return
    setLoading(true)
    if (form.id) await supabase.from('motoristas').update({ nome: form.nome, cpf: form.cpf, telefone: form.telefone, cnh: form.cnh, ativo: form.ativo ?? true }).eq('id', form.id)
    else await supabase.from('motoristas').insert({ nome: form.nome, cpf: form.cpf, telefone: form.telefone, cnh: form.cnh, ativo: true })
    setLoading(false); setModal(false); setForm({}); load()
  }

  return (
    <div>
      <div className="page-header">
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0a2f1a' }}>Motoristas ({data.filter(d => d.ativo).length})</h3>
        <button className="btn-primary" onClick={() => { setForm({}); setModal(true) }}>+ Novo</button>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Nome</th><th>CPF</th><th>Telefone</th><th>CNH</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {data.map(m => (
              <tr key={m.id}>
                <td style={{ fontWeight: 600 }}>{m.nome}</td>
                <td>{m.cpf || '—'}</td>
                <td>{m.telefone || '—'}</td>
                <td>{m.cnh || '—'}</td>
                <td><span className="badge" style={{ background: m.ativo ? '#e8f5ec' : '#f5f5f5', color: m.ativo ? '#1a5c2e' : '#999' }}>{m.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td><button className="btn-ghost" style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => { setForm(m); setModal(true) }}>Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={form.id ? 'Editar Motorista' : 'Novo Motorista'} onClose={() => setModal(false)}>
          <div className="grid-2">
            <div className="col-span-2"><label className={lbl}>Nome *</label><input className={inp} value={form.nome || ''} onChange={e => setForm(p => ({ ...p, nome: e.target.value.toUpperCase() }))} /></div>
            <div><label className={lbl}>CPF</label><input className={inp} value={form.cpf || ''} onChange={e => setForm(p => ({ ...p, cpf: e.target.value }))} /></div>
            <div><label className={lbl}>Telefone</label><input className={inp} value={form.telefone || ''} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} /></div>
            <div><label className={lbl}>CNH</label><input className={inp} value={form.cnh || ''} onChange={e => setForm(p => ({ ...p, cnh: e.target.value }))} /></div>
            {form.id && <div><label className={lbl}>Status</label>
              <select className={inp} value={form.ativo ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, ativo: e.target.value === 'true' }))}>
                <option value="true">Ativo</option><option value="false">Inativo</option>
              </select>
            </div>}
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={salvar} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── VEÍCULOS ───────────────────────────────────────────────
function TabVeiculos() {
  const [data, setData] = useState<Veiculo[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Partial<Veiculo>>({})
  const [loading, setLoading] = useState(false)

  const TIPOS = ['Bitruck','Bitrem mato','Julieta mato','Carreta porto','Carreta','Veículo','Máquina']

  const load = useCallback(async () => {
    const { data } = await supabase.from('veiculos').select('*').order('placa')
    setData(data || [])
  }, [])

  useEffect(() => { load() }, [load])

  async function salvar() {
    if (!form.placa) return
    setLoading(true)
    if (form.id) await supabase.from('veiculos').update({ placa: form.placa, tipo: form.tipo, marca: form.marca, modelo: form.modelo, ano: form.ano, ativo: form.ativo ?? true }).eq('id', form.id)
    else await supabase.from('veiculos').insert({ placa: form.placa, tipo: form.tipo, marca: form.marca, modelo: form.modelo, ano: form.ano, ativo: true })
    setLoading(false); setModal(false); setForm({}); load()
  }

  return (
    <div>
      <div className="page-header">
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0a2f1a' }}>Veículos ({data.filter(d => d.ativo).length})</h3>
        <button className="btn-primary" onClick={() => { setForm({}); setModal(true) }}>+ Novo</button>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Placa</th><th>Tipo</th><th>Marca</th><th>Modelo</th><th>Ano</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {data.map(v => (
              <tr key={v.id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{v.placa}</td>
                <td>{v.tipo || '—'}</td>
                <td>{v.marca || '—'}</td>
                <td>{v.modelo || '—'}</td>
                <td>{v.ano || '—'}</td>
                <td><span className="badge" style={{ background: v.ativo ? '#e8f5ec' : '#f5f5f5', color: v.ativo ? '#1a5c2e' : '#999' }}>{v.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td><button className="btn-ghost" style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => { setForm(v); setModal(true) }}>Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={form.id ? 'Editar Veículo' : 'Novo Veículo'} onClose={() => setModal(false)}>
          <div className="grid-2">
            <div><label className={lbl}>Placa *</label><input className={inp} value={form.placa || ''} onChange={e => setForm(p => ({ ...p, placa: e.target.value.toUpperCase() }))} /></div>
            <div><label className={lbl}>Tipo</label>
              <select className={inp} value={form.tipo || ''} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                <option value="">Selecione...</option>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className={lbl}>Marca</label><input className={inp} value={form.marca || ''} onChange={e => setForm(p => ({ ...p, marca: e.target.value }))} /></div>
            <div><label className={lbl}>Modelo</label><input className={inp} value={form.modelo || ''} onChange={e => setForm(p => ({ ...p, modelo: e.target.value }))} /></div>
            <div><label className={lbl}>Ano</label><input type="number" className={inp} value={form.ano || ''} onChange={e => setForm(p => ({ ...p, ano: Number(e.target.value) || undefined }))} /></div>
            {form.id && <div><label className={lbl}>Status</label>
              <select className={inp} value={form.ativo ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, ativo: e.target.value === 'true' }))}>
                <option value="true">Ativo</option><option value="false">Inativo</option>
              </select>
            </div>}
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={salvar} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── FORNECEDORES ───────────────────────────────────────────
function TabFornecedores() {
  const [data, setData] = useState<Fornecedor[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Partial<Fornecedor>>({})
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('fornecedores').select('*').order('nome')
    setData(data || [])
  }, [])

  useEffect(() => { load() }, [load])

  async function salvar() {
    if (!form.nome) return
    setLoading(true)
    if (form.id) await supabase.from('fornecedores').update({ nome: form.nome, cnpj: form.cnpj, telefone: form.telefone, email: form.email, endereco: form.endereco, tipo: form.tipo || 'toras', ativo: form.ativo ?? true }).eq('id', form.id)
    else await supabase.from('fornecedores').insert({ nome: form.nome, cnpj: form.cnpj, telefone: form.telefone, email: form.email, endereco: form.endereco, tipo: form.tipo || 'toras', ativo: true })
    setLoading(false); setModal(false); setForm({}); load()
  }

  return (
    <div>
      <div className="page-header">
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0a2f1a' }}>Fornecedores ({data.filter(d => d.ativo).length})</h3>
        <button className="btn-primary" onClick={() => { setForm({ tipo: 'toras' }); setModal(true) }}>+ Novo</button>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Nome</th><th>CNPJ</th><th>Tipo</th><th>Telefone</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {data.map(f => (
              <tr key={f.id}>
                <td style={{ fontWeight: 600 }}>{f.nome}</td>
                <td>{f.cnpj || '—'}</td>
                <td><span className="badge" style={{ background: '#f0f7f2', color: '#1a5c2e' }}>{f.tipo}</span></td>
                <td>{f.telefone || '—'}</td>
                <td><span className="badge" style={{ background: f.ativo ? '#e8f5ec' : '#f5f5f5', color: f.ativo ? '#1a5c2e' : '#999' }}>{f.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td><button className="btn-ghost" style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => { setForm(f); setModal(true) }}>Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={form.id ? 'Editar Fornecedor' : 'Novo Fornecedor'} onClose={() => setModal(false)}>
          <div className="grid-2">
            <div className="col-span-2"><label className={lbl}>Nome *</label><input className={inp} value={form.nome || ''} onChange={e => setForm(p => ({ ...p, nome: e.target.value.toUpperCase() }))} /></div>
            <div><label className={lbl}>CNPJ</label><input className={inp} value={form.cnpj || ''} onChange={e => setForm(p => ({ ...p, cnpj: e.target.value }))} /></div>
            <div><label className={lbl}>Tipo</label>
              <select className={inp} value={form.tipo || 'toras'} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                {['toras','compensados','combustível','outros'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className={lbl}>Telefone</label><input className={inp} value={form.telefone || ''} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} /></div>
            <div><label className={lbl}>E-mail</label><input className={inp} value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="col-span-2"><label className={lbl}>Endereço</label><input className={inp} value={form.endereco || ''} onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} /></div>
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={salvar} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── CLIENTES ───────────────────────────────────────────────
function TabClientes() {
  const [data, setData] = useState<Cliente[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Partial<Cliente>>({})
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('clientes').select('*').order('nome')
    setData(data || [])
  }, [])

  useEffect(() => { load() }, [load])

  async function salvar() {
    if (!form.nome) return
    setLoading(true)
    if (form.id) await supabase.from('clientes').update({ nome: form.nome, cnpj: form.cnpj, telefone: form.telefone, email: form.email, endereco: form.endereco, ativo: form.ativo ?? true }).eq('id', form.id)
    else await supabase.from('clientes').insert({ nome: form.nome, cnpj: form.cnpj, telefone: form.telefone, email: form.email, endereco: form.endereco, ativo: true })
    setLoading(false); setModal(false); setForm({}); load()
  }

  return (
    <div>
      <div className="page-header">
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0a2f1a' }}>Clientes ({data.filter(d => d.ativo).length})</h3>
        <button className="btn-primary" onClick={() => { setForm({}); setModal(true) }}>+ Novo</button>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Nome</th><th>CNPJ</th><th>Telefone</th><th>E-mail</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {data.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.nome}</td>
                <td>{c.cnpj || '—'}</td>
                <td>{c.telefone || '—'}</td>
                <td>{c.email || '—'}</td>
                <td><span className="badge" style={{ background: c.ativo ? '#e8f5ec' : '#f5f5f5', color: c.ativo ? '#1a5c2e' : '#999' }}>{c.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td><button className="btn-ghost" style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => { setForm(c); setModal(true) }}>Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={form.id ? 'Editar Cliente' : 'Novo Cliente'} onClose={() => setModal(false)}>
          <div className="grid-2">
            <div className="col-span-2"><label className={lbl}>Nome *</label><input className={inp} value={form.nome || ''} onChange={e => setForm(p => ({ ...p, nome: e.target.value.toUpperCase() }))} /></div>
            <div><label className={lbl}>CNPJ</label><input className={inp} value={form.cnpj || ''} onChange={e => setForm(p => ({ ...p, cnpj: e.target.value }))} /></div>
            <div><label className={lbl}>Telefone</label><input className={inp} value={form.telefone || ''} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} /></div>
            <div className="col-span-2"><label className={lbl}>E-mail</label><input className={inp} value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="col-span-2"><label className={lbl}>Endereço</label><input className={inp} value={form.endereco || ''} onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} /></div>
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={salvar} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── MAIN PAGE ──────────────────────────────────────────────
const TABS = ['Motoristas', 'Veículos', 'Fornecedores', 'Clientes'] as const
type Tab = typeof TABS[number]

export default function CadastrosPage() {
  const [tab, setTab] = useState<Tab>('Motoristas')

  return (
    <AppLayout>
      <h2 className="page-title" style={{ marginBottom: 20 }}>Cadastros</h2>
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #e0ece4' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '9px 20px', background: tab === t ? '#1a5c2e' : 'transparent',
            border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer',
            fontSize: 13, fontWeight: tab === t ? 700 : 500,
            color: tab === t ? '#fff' : '#5a7a6a', transition: 'all 0.15s'
          }}>{t}</button>
        ))}
      </div>
      {tab === 'Motoristas' && <TabMotoristas />}
      {tab === 'Veículos' && <TabVeiculos />}
      {tab === 'Fornecedores' && <TabFornecedores />}
      {tab === 'Clientes' && <TabClientes />}
    </AppLayout>
  )
}
