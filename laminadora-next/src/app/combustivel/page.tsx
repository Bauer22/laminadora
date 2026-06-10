'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import { createClient } from '@/lib/supabase/client'
import type { CombustivelCompra, CombustivelSaida, Fornecedor, Motorista, Veiculo } from '@/types'
import { MAQUINAS_COMBUSTIVEL } from '@/types'

const supabase = createClient()
const TIPOS_COMB = ['diesel', 'gasolina', 'etanol', 'arla'] as const

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

export default function CombustivelPage() {
  const [aba, setAba] = useState<'compras' | 'saidas'>('compras')
  const [compras, setCompras] = useState<CombustivelCompra[]>([])
  const [saidas, setSaidas] = useState<CombustivelSaida[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({ destino_tipo: 'veiculo', tipo: 'diesel' })
  const [loading, setLoading] = useState(false)
  const [filtros, setFiltros] = useState({ dataInicio: '', dataFim: '', placa: '' })

  const load = useCallback(async () => {
    const [{ data: c }, { data: s }, { data: f }, { data: m }, { data: v }] = await Promise.all([
      supabase.from('combustivel_compras').select('*, fornecedores(nome)').order('data', { ascending: false }).limit(200),
      supabase.from('combustivel_saidas').select('*, motoristas(nome)').order('data', { ascending: false }).limit(200),
      supabase.from('fornecedores').select('id, nome').eq('ativo', true).order('nome'),
      supabase.from('motoristas').select('id, nome').eq('ativo', true).order('nome'),
      supabase.from('veiculos').select('id, placa, tipo').eq('ativo', true).order('placa'),
    ])
    setCompras(c || [])
    setSaidas(s || [])
    setFornecedores((f || []) as any)
    setMotoristas((m || []) as any)
    setVeiculos((v || []) as any)
  }, [])

  useEffect(() => { load() }, [load])

  const sf = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const calcTotal = () => {
    const qtd = parseFloat(form.qtd_litros || '0')
    const vl = parseFloat(form.valor_litro || '0')
    return qtd && vl ? (qtd * vl).toFixed(2) : ''
  }

  async function salvarCompra() {
    setLoading(true)
    const qtd = parseFloat(form.qtd_litros || '0')
    const vl = parseFloat(form.valor_litro || '0')
    await supabase.from('combustivel_compras').insert({
      data: form.data || new Date().toISOString().split('T')[0],
      tipo: form.tipo || 'diesel',
      fornecedor_id: form.fornecedor_id || null,
      qtd_litros: qtd,
      valor_litro: vl,
      valor_total: qtd * vl,
      vencimento_boleto: form.vencimento_boleto || null,
      obs: form.obs || '',
    })
    setLoading(false); setModal(false); setForm({ destino_tipo: 'veiculo', tipo: 'diesel' }); load()
  }

  async function salvarSaida() {
    setLoading(true)
    await supabase.from('combustivel_saidas').insert({
      data: form.data || new Date().toISOString().split('T')[0],
      tipo: form.tipo || 'diesel',
      destino_tipo: form.destino_tipo || 'veiculo',
      placa: form.destino_tipo === 'veiculo' ? (form.placa || '') : null,
      maquina: form.destino_tipo === 'maquina' ? (form.maquina || '') : null,
      motorista_id: form.motorista_id || null,
      qtd_litros: parseFloat(form.qtd_litros || '0'),
      km: form.km ? parseInt(form.km) : null,
      obs: form.obs || '',
    })
    setLoading(false); setModal(false); setForm({ destino_tipo: 'veiculo', tipo: 'diesel' }); load()
  }

  async function excluir(table: string, id: string) {
    if (!confirm('Excluir?')) return
    await supabase.from(table).delete().eq('id', id)
    load()
  }

  const totalComprado = compras.reduce((acc, c) => acc + Number(c.qtd_litros || 0), 0)
  const totalSaiu = saidas.reduce((acc, s) => acc + Number(s.qtd_litros || 0), 0)
  const estoque = totalComprado - totalSaiu

  const filterFn = (e: any) =>
    (!filtros.dataInicio || e.data >= filtros.dataInicio) &&
    (!filtros.dataFim || e.data <= filtros.dataFim) &&
    (!filtros.placa || (e.placa || '').includes(filtros.placa.toUpperCase()))

  const listaCompras = compras.filter(filterFn)
  const listaSaidas = saidas.filter(filterFn)

  return (
    <AppLayout>
      <div className="page-header">
        <h2 className="page-title">⛽ Combustível</h2>
        <button className="btn-primary" onClick={() => { setForm({ destino_tipo: 'veiculo', tipo: 'diesel', data: new Date().toISOString().split('T')[0] }); setModal(true) }}>
          + {aba === 'compras' ? 'Nova Compra' : 'Novo Abastecimento'}
        </button>
      </div>

      {/* KPIs estoque */}
      <div className="totais-bar" style={{ marginBottom: 16 }}>
        <div className="total-card">
          <div className="value">{totalComprado.toFixed(0)} L</div>
          <div className="label">Total Comprado</div>
        </div>
        <div className="total-card" style={{ borderLeftColor: '#e65100' }}>
          <div className="value" style={{ color: '#e65100' }}>{totalSaiu.toFixed(0)} L</div>
          <div className="label" style={{ color: '#e65100' }}>Total Consumido</div>
        </div>
        <div className="total-card" style={{ borderLeftColor: estoque > 0 ? '#1a5c2e' : '#c00' }}>
          <div className="value" style={{ color: estoque > 0 ? '#1a5c2e' : '#c00' }}>{estoque.toFixed(0)} L</div>
          <div className="label">Estoque Atual</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '2px solid #e0ece4' }}>
        {[['compras', '🛒 Compras'], ['saidas', '🚛 Abastecimentos']].map(([k, label]) => (
          <button key={k} onClick={() => setAba(k as any)} style={{
            padding: '9px 20px', background: aba === k ? '#1a5c2e' : 'transparent',
            border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer',
            fontSize: 13, fontWeight: aba === k ? 700 : 500,
            color: aba === k ? '#fff' : '#5a7a6a'
          }}>{label}</button>
        ))}
      </div>

      <div className="filter-bar">
        <div><label className="lbl">Data Início</label><input type="date" className="inp" style={{ width: 150 }} value={filtros.dataInicio} onChange={e => setFiltros(p => ({ ...p, dataInicio: e.target.value }))} /></div>
        <div><label className="lbl">Data Fim</label><input type="date" className="inp" style={{ width: 150 }} value={filtros.dataFim} onChange={e => setFiltros(p => ({ ...p, dataFim: e.target.value }))} /></div>
        {aba === 'saidas' && <div><label className="lbl">Placa</label><input className="inp" style={{ width: 120 }} value={filtros.placa} onChange={e => setFiltros(p => ({ ...p, placa: e.target.value }))} /></div>}
        <button className="btn-ghost" onClick={() => setFiltros({ dataInicio: '', dataFim: '', placa: '' })}>Limpar</button>
      </div>

      {aba === 'compras' ? (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Data</th><th>Tipo</th><th>Fornecedor</th><th>Litros</th><th>R$/L</th><th>Total</th><th>Venc. Boleto</th><th></th></tr></thead>
            <tbody>
              {listaCompras.length === 0 ? <tr><td colSpan={8} className="empty-state">Nenhuma compra.</td></tr> :
                listaCompras.map(c => (
                  <tr key={c.id}>
                    <td>{new Date(c.data + 'T12:00').toLocaleDateString('pt-BR')}</td>
                    <td><span className="badge" style={{ background: '#f0f7f2', color: '#1a5c2e', textTransform: 'capitalize' }}>{c.tipo}</span></td>
                    <td>{(c as any).fornecedores?.nome || '—'}</td>
                    <td style={{ fontWeight: 700 }}>{Number(c.qtd_litros).toFixed(0)} L</td>
                    <td>R$ {Number(c.valor_litro || 0).toFixed(4)}</td>
                    <td style={{ fontWeight: 700 }}>R$ {Number(c.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td>{c.vencimento_boleto ? new Date(c.vencimento_boleto + 'T12:00').toLocaleDateString('pt-BR') : '—'}</td>
                    <td><button onClick={() => excluir('combustivel_compras', c.id)} style={{ background: 'none', border: 'none', color: '#c00', cursor: 'pointer' }}>×</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Data</th><th>Tipo</th><th>Destino</th><th>Placa/Máquina</th><th>Motorista</th><th>Litros</th><th>KM</th><th></th></tr></thead>
            <tbody>
              {listaSaidas.length === 0 ? <tr><td colSpan={8} className="empty-state">Nenhum abastecimento.</td></tr> :
                listaSaidas.map(s => (
                  <tr key={s.id}>
                    <td>{new Date(s.data + 'T12:00').toLocaleDateString('pt-BR')}</td>
                    <td><span className="badge" style={{ background: '#f0f7f2', color: '#1a5c2e', textTransform: 'capitalize' }}>{s.tipo}</span></td>
                    <td><span className="badge" style={{ background: s.destino_tipo === 'veiculo' ? '#e3f0fd' : '#fff3e0', color: s.destino_tipo === 'veiculo' ? '#1565a0' : '#8a5700' }}>{s.destino_tipo}</span></td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{s.placa || s.maquina || '—'}</td>
                    <td>{(s as any).motoristas?.nome || '—'}</td>
                    <td style={{ fontWeight: 700 }}>{Number(s.qtd_litros).toFixed(0)} L</td>
                    <td>{s.km ? Number(s.km).toLocaleString('pt-BR') : '—'}</td>
                    <td><button onClick={() => excluir('combustivel_saidas', s.id)} style={{ background: 'none', border: 'none', color: '#c00', cursor: 'pointer' }}>×</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={aba === 'compras' ? 'Nova Compra de Combustível' : 'Novo Abastecimento'} onClose={() => setModal(false)}>
          <div className="grid-2">
            <div><label className="lbl">Data</label><input type="date" className="inp" value={form.data || ''} onChange={e => sf('data', e.target.value)} /></div>
            <div><label className="lbl">Tipo</label>
              <select className="inp" value={form.tipo || 'diesel'} onChange={e => sf('tipo', e.target.value)}>
                {TIPOS_COMB.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
              </select>
            </div>

            {aba === 'compras' ? <>
              <div className="col-span-2"><label className="lbl">Fornecedor</label>
                <select className="inp" value={form.fornecedor_id || ''} onChange={e => sf('fornecedor_id', e.target.value)}>
                  <option value="">Selecione...</option>
                  {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
              <div><label className="lbl">Qtd Litros</label><input type="number" step="0.01" className="inp" value={form.qtd_litros || ''} onChange={e => sf('qtd_litros', e.target.value)} /></div>
              <div><label className="lbl">R$/Litro</label><input type="number" step="0.0001" className="inp" value={form.valor_litro || ''} onChange={e => sf('valor_litro', e.target.value)} /></div>
              {calcTotal() && (
                <div className="col-span-2" style={{ padding: '10px 14px', background: '#1a5c2e', borderRadius: 8, color: '#fff', fontWeight: 800, fontSize: 15 }}>
                  Total: R$ {parseFloat(calcTotal()).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              )}
              <div><label className="lbl">Venc. Boleto</label><input type="date" className="inp" value={form.vencimento_boleto || ''} onChange={e => sf('vencimento_boleto', e.target.value)} /></div>
            </> : <>
              <div><label className="lbl">Destino</label>
                <select className="inp" value={form.destino_tipo || 'veiculo'} onChange={e => sf('destino_tipo', e.target.value)}>
                  <option value="veiculo">Veículo</option>
                  <option value="maquina">Máquina</option>
                </select>
              </div>
              {form.destino_tipo === 'veiculo' ? (
                <div><label className="lbl">Placa</label>
                  <select className="inp" value={form.placa || ''} onChange={e => sf('placa', e.target.value)}>
                    <option value="">Selecione...</option>
                    {veiculos.map(v => <option key={v.id} value={v.placa}>{v.placa} — {v.tipo}</option>)}
                  </select>
                </div>
              ) : (
                <div><label className="lbl">Máquina</label>
                  <select className="inp" value={form.maquina || ''} onChange={e => sf('maquina', e.target.value)}>
                    <option value="">Selecione...</option>
                    {MAQUINAS_COMBUSTIVEL.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              )}
              <div><label className="lbl">Motorista</label>
                <select className="inp" value={form.motorista_id || ''} onChange={e => sf('motorista_id', e.target.value)}>
                  <option value="">Selecione...</option>
                  {motoristas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>
              <div><label className="lbl">Qtd Litros</label><input type="number" step="0.1" className="inp" value={form.qtd_litros || ''} onChange={e => sf('qtd_litros', e.target.value)} /></div>
              <div><label className="lbl">KM Atual</label><input type="number" className="inp" value={form.km || ''} onChange={e => sf('km', e.target.value)} /></div>
            </>}
            <div className="col-span-2"><label className="lbl">Observações</label><textarea className="inp" style={{ height: 48, resize: 'vertical' }} value={form.obs || ''} onChange={e => sf('obs', e.target.value)} /></div>
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={aba === 'compras' ? salvarCompra : salvarSaida} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}
