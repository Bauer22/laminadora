'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import { createClient } from '@/lib/supabase/client'
import type { CarregamentoCavaco, CarregamentoLamina, Cliente, Motorista, Veiculo } from '@/types'

const supabase = createClient()

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box wide">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function CarregamentosPage() {
  const [aba, setAba] = useState<'cavaco' | 'lamina'>('cavaco')
  const [cavaco, setCavaco] = useState<CarregamentoCavaco[]>([])
  const [lamina, setLamina] = useState<CarregamentoLamina[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [filtros, setFiltros] = useState({ dataInicio: '', dataFim: '', placa: '', motorista: '' })

  const load = useCallback(async () => {
    const [{ data: c }, { data: l }, { data: cl }, { data: m }, { data: v }] = await Promise.all([
      supabase.from('carregamentos_cavaco').select('*, clientes(nome), motoristas(nome)').order('data', { ascending: false }).limit(200),
      supabase.from('carregamentos_lamina').select('*, clientes(nome), motoristas(nome)').order('data', { ascending: false }).limit(200),
      supabase.from('clientes').select('id, nome').eq('ativo', true).order('nome'),
      supabase.from('motoristas').select('id, nome').eq('ativo', true).order('nome'),
      supabase.from('veiculos').select('id, placa, tipo').eq('ativo', true).order('placa'),
    ])
    setCavaco(c || [])
    setLamina(l || [])
    setClientes((cl || []) as any)
    setMotoristas((m || []) as any)
    setVeiculos((v || []) as any)
  }, [])

  useEffect(() => { load() }, [load])

  const s = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const calcVolumeLamina = () => {
    const bitola = parseFloat(form.bitola || '0')
    const qtd = parseFloat(form.qtd_folhas || '0')
    const comp = parseFloat(form.comprimento || '0')
    const larg = parseFloat(form.largura || '0')
    if (bitola && qtd && comp && larg) return (bitola * qtd * comp * larg / 1000).toFixed(4)
    return ''
  }

  async function salvarCavaco() {
    setLoading(true)
    const bruto = parseFloat(form.peso_bruto || '0')
    const tara = parseFloat(form.peso_tara || '0')
    await supabase.from('carregamentos_cavaco').insert({
      data: form.data || new Date().toISOString().split('T')[0],
      cliente_id: form.cliente_id || null,
      motorista_id: form.motorista_id || null,
      placa: form.placa || '',
      peso_bruto: bruto,
      peso_tara: tara,
      peso_liquido: bruto && tara ? bruto - tara : 0,
      obs: form.obs || '',
    })
    setLoading(false); setModal(false); setForm({}); load()
  }

  async function salvarLamina() {
    setLoading(true)
    const vol = parseFloat(calcVolumeLamina() || '0')
    await supabase.from('carregamentos_lamina').insert({
      data: form.data || new Date().toISOString().split('T')[0],
      cliente_id: form.cliente_id || null,
      motorista_id: form.motorista_id || null,
      placa: form.placa || '',
      bitola: parseFloat(form.bitola || '0'),
      qtd_folhas: parseInt(form.qtd_folhas || '0'),
      comprimento: parseFloat(form.comprimento || '0'),
      largura: parseFloat(form.largura || '0'),
      volume_m3: vol,
      obs: form.obs || '',
    })
    setLoading(false); setModal(false); setForm({}); load()
  }

  async function excluir(table: string, id: string) {
    if (!confirm('Excluir este carregamento?')) return
    await supabase.from(table).delete().eq('id', id)
    load()
  }

  const filterFn = (e: any) =>
    (!filtros.dataInicio || e.data >= filtros.dataInicio) &&
    (!filtros.dataFim || e.data <= filtros.dataFim) &&
    (!filtros.placa || (e.placa || '').includes(filtros.placa.toUpperCase())) &&
    (!filtros.motorista || e.motorista_id === filtros.motorista)

  const listaCavaco = cavaco.filter(filterFn)
  const listaLamina = lamina.filter(filterFn)
  const totalCavaco = listaCavaco.reduce((acc, c) => acc + Number(c.peso_liquido || 0), 0)
  const totalLamina = listaLamina.reduce((acc, c) => acc + Number(c.volume_m3 || 0), 0)

  return (
    <AppLayout>
      <div className="page-header">
        <h2 className="page-title">🚛 Carregamentos</h2>
        <button className="btn-primary" onClick={() => { setForm({ data: new Date().toISOString().split('T')[0] }); setModal(true) }}>+ Novo</button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #e0ece4' }}>
        {[['cavaco', '🪵 Cavaco / Rolete'], ['lamina', '🪚 Lâminas']].map(([k, label]) => (
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
        <div><label className="lbl">Motorista</label>
          <select className="inp" style={{ width: 160 }} value={filtros.motorista} onChange={e => setFiltros(p => ({ ...p, motorista: e.target.value }))}>
            <option value="">Todos</option>
            {motoristas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>
        <div><label className="lbl">Placa</label><input className="inp" style={{ width: 120 }} value={filtros.placa} onChange={e => setFiltros(p => ({ ...p, placa: e.target.value }))} /></div>
        <button className="btn-ghost" onClick={() => setFiltros({ dataInicio: '', dataFim: '', placa: '', motorista: '' })}>Limpar</button>
      </div>

      {aba === 'cavaco' ? (
        <>
          <div className="totais-bar">
            <div className="total-card"><div className="value">{listaCavaco.length}</div><div className="label">Cargas</div></div>
            <div className="total-card" style={{ borderLeftColor: '#1565a0' }}>
              <div className="value" style={{ color: '#1565a0' }}>{totalCavaco.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} t</div>
              <div className="label" style={{ color: '#3a6a9a' }}>Peso Líquido Total</div>
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Data</th><th>Cliente</th><th>Motorista</th><th>Placa</th><th>P. Bruto</th><th>P. Tara</th><th>P. Líquido</th><th>Obs</th><th></th></tr></thead>
              <tbody>
                {listaCavaco.length === 0 ? <tr><td colSpan={9} className="empty-state">Nenhum carregamento.</td></tr> :
                  listaCavaco.map(c => (
                    <tr key={c.id}>
                      <td>{new Date(c.data + 'T12:00').toLocaleDateString('pt-BR')}</td>
                      <td>{(c as any).clientes?.nome || '—'}</td>
                      <td>{(c as any).motoristas?.nome || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.placa || '—'}</td>
                      <td>{Number(c.peso_bruto || 0).toFixed(3)} t</td>
                      <td>{Number(c.peso_tara || 0).toFixed(3)} t</td>
                      <td style={{ fontWeight: 700, color: '#1a5c2e' }}>{Number(c.peso_liquido || 0).toFixed(3)} t</td>
                      <td style={{ color: '#888', fontSize: 11 }}>{c.obs || ''}</td>
                      <td><button onClick={() => excluir('carregamentos_cavaco', c.id)} style={{ background: 'none', border: 'none', color: '#c00', cursor: 'pointer' }}>×</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="totais-bar">
            <div className="total-card"><div className="value">{listaLamina.length}</div><div className="label">Cargas</div></div>
            <div className="total-card" style={{ borderLeftColor: '#7b3f00' }}>
              <div className="value" style={{ color: '#7b3f00' }}>{totalLamina.toLocaleString('pt-BR', { minimumFractionDigits: 4 })} m³</div>
              <div className="label" style={{ color: '#7b3f00' }}>Volume Total</div>
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Data</th><th>Cliente</th><th>Motorista</th><th>Placa</th><th>Bitola (mm)</th><th>Qtd Folhas</th><th>Comp × Larg</th><th>Volume m³</th><th></th></tr></thead>
              <tbody>
                {listaLamina.length === 0 ? <tr><td colSpan={9} className="empty-state">Nenhum carregamento.</td></tr> :
                  listaLamina.map(l => (
                    <tr key={l.id}>
                      <td>{new Date(l.data + 'T12:00').toLocaleDateString('pt-BR')}</td>
                      <td>{(l as any).clientes?.nome || '—'}</td>
                      <td>{(l as any).motoristas?.nome || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{l.placa || '—'}</td>
                      <td>{l.bitola || '—'}</td>
                      <td>{l.qtd_folhas || '—'}</td>
                      <td style={{ fontSize: 11 }}>{l.comprimento} × {l.largura}</td>
                      <td style={{ fontWeight: 700, color: '#7b3f00' }}>{Number(l.volume_m3 || 0).toFixed(4)}</td>
                      <td><button onClick={() => excluir('carregamentos_lamina', l.id)} style={{ background: 'none', border: 'none', color: '#c00', cursor: 'pointer' }}>×</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modal && (
        <Modal title={aba === 'cavaco' ? 'Novo Carregamento Cavaco/Rolete' : 'Novo Carregamento Lâmina'} onClose={() => setModal(false)}>
          <div className="grid-2">
            <div><label className="lbl">Data</label><input type="date" className="inp" value={form.data || ''} onChange={e => s('data', e.target.value)} /></div>
            <div><label className="lbl">Cliente</label>
              <select className="inp" value={form.cliente_id || ''} onChange={e => s('cliente_id', e.target.value)}>
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div><label className="lbl">Motorista</label>
              <select className="inp" value={form.motorista_id || ''} onChange={e => s('motorista_id', e.target.value)}>
                <option value="">Selecione...</option>
                {motoristas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
            <div><label className="lbl">Placa</label>
              <select className="inp" value={form.placa || ''} onChange={e => s('placa', e.target.value)}>
                <option value="">Selecione...</option>
                {veiculos.map(v => <option key={v.id} value={v.placa}>{v.placa} — {v.tipo}</option>)}
              </select>
            </div>
          </div>

          {aba === 'cavaco' ? (
            <div style={{ background: '#f0faf4', borderRadius: 10, padding: 14, marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a5c2e', marginBottom: 10 }}>⚖️ PESAGEM</div>
              <div className="grid-2">
                <div><label className="lbl">Peso Bruto (t)</label><input type="number" step="0.001" className="inp" value={form.peso_bruto || ''} onChange={e => s('peso_bruto', e.target.value)} /></div>
                <div><label className="lbl">Peso Tara (t)</label><input type="number" step="0.001" className="inp" value={form.peso_tara || ''} onChange={e => s('peso_tara', e.target.value)} /></div>
              </div>
              {form.peso_bruto && form.peso_tara && (
                <div style={{ marginTop: 10, padding: '10px 14px', background: '#1a5c2e', borderRadius: 8, color: '#fff', fontWeight: 800, fontSize: 15 }}>
                  Peso Líquido: {(parseFloat(form.peso_bruto) - parseFloat(form.peso_tara)).toFixed(3)} t
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: '#f0faf4', borderRadius: 10, padding: 14, marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a5c2e', marginBottom: 10 }}>🪚 DADOS DA LÂMINA</div>
              <div className="grid-2">
                <div><label className="lbl">Bitola (mm)</label><input type="number" step="0.01" className="inp" value={form.bitola || ''} onChange={e => s('bitola', e.target.value)} /></div>
                <div><label className="lbl">Qtd Folhas</label><input type="number" className="inp" value={form.qtd_folhas || ''} onChange={e => s('qtd_folhas', e.target.value)} /></div>
                <div><label className="lbl">Comprimento (m)</label><input type="number" step="0.001" className="inp" value={form.comprimento || ''} onChange={e => s('comprimento', e.target.value)} /></div>
                <div><label className="lbl">Largura (m)</label><input type="number" step="0.001" className="inp" value={form.largura || ''} onChange={e => s('largura', e.target.value)} /></div>
              </div>
              {calcVolumeLamina() && (
                <div style={{ marginTop: 10, padding: '10px 14px', background: '#1a5c2e', borderRadius: 8, color: '#fff', fontWeight: 800, fontSize: 15 }}>
                  Volume: {calcVolumeLamina()} m³
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <label className="lbl">Observações</label>
            <textarea className="inp" style={{ height: 52, resize: 'vertical' }} value={form.obs || ''} onChange={e => s('obs', e.target.value)} />
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={aba === 'cavaco' ? salvarCavaco : salvarLamina} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}
