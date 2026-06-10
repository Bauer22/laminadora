'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import { createClient } from '@/lib/supabase/client'
import type { EntradaMadeira, Motorista, Veiculo, Fornecedor } from '@/types'

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

export default function PatioPage() {
  const [entradas, setEntradas] = useState<EntradaMadeira[]>([])
  const [motoristas, setMotoristas] = useState<Motorista[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [modal, setModal] = useState(false)
  const [tipo, setTipo] = useState<'peso' | 'estereo'>('peso')
  const [form, setForm] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [filtros, setFiltros] = useState({ dataInicio: '', dataFim: '', fornecedor: '', placa: '', motorista: '' })

  const load = useCallback(async () => {
    const [{ data: e }, { data: m }, { data: v }, { data: f }] = await Promise.all([
      supabase.from('entradas_madeira').select('*, fornecedores(nome), motoristas(nome)').order('data', { ascending: false }).order('created_at', { ascending: false }).limit(200),
      supabase.from('motoristas').select('id, nome').eq('ativo', true).order('nome'),
      supabase.from('veiculos').select('id, placa, tipo').eq('ativo', true).order('placa'),
      supabase.from('fornecedores').select('id, nome').eq('ativo', true).order('nome'),
    ])
    setEntradas(e || [])
    setMotoristas((m || []) as any)
    setVeiculos((v || []) as any)
    setFornecedores((f || []) as any)
  }, [])

  useEffect(() => { load() }, [load])

  const s = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  // Calcular líquido peso
  const calcLiquido = () => {
    const bruto = parseFloat(form.peso_bruto || '0')
    const tara = parseFloat(form.peso_tara || '0')
    return bruto && tara ? (bruto - tara).toFixed(3) : ''
  }

  // Calcular volume estéreo
  const calcVolume = () => {
    const h = parseFloat(form.altura || '0')
    const c = parseFloat(form.comprimento || '0')
    const l = parseFloat(form.largura || '0')
    return h && c && l ? (h * c * l / 1.4).toFixed(3) : ''
  }

  async function salvar() {
    setLoading(true)
    const liquido = parseFloat(calcLiquido() || '0')
    const volume = parseFloat(calcVolume() || '0')
    await supabase.from('entradas_madeira').insert({
      data: form.data || new Date().toISOString().split('T')[0],
      tipo_medicao: tipo,
      fornecedor_id: form.fornecedor_id || null,
      motorista_id: form.motorista_id || null,
      placa: form.placa || '',
      classe: form.classe || '',
      peso_bruto: tipo === 'peso' ? parseFloat(form.peso_bruto || '0') : 0,
      peso_tara: tipo === 'peso' ? parseFloat(form.peso_tara || '0') : 0,
      peso_liquido: tipo === 'peso' ? liquido : 0,
      altura: tipo === 'estereo' ? parseFloat(form.altura || '0') : 0,
      comprimento: tipo === 'estereo' ? parseFloat(form.comprimento || '0') : 0,
      largura: tipo === 'estereo' ? parseFloat(form.largura || '0') : 0,
      volume_estereo: tipo === 'estereo' ? volume : 0,
      obs: form.obs || '',
    })
    setLoading(false); setModal(false); setForm({}); load()
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta entrada?')) return
    await supabase.from('entradas_madeira').delete().eq('id', id)
    load()
  }

  // Filtrar
  const lista = entradas.filter(e =>
    (!filtros.dataInicio || e.data >= filtros.dataInicio) &&
    (!filtros.dataFim || e.data <= filtros.dataFim) &&
    (!filtros.fornecedor || e.fornecedor_id === filtros.fornecedor) &&
    (!filtros.placa || (e.placa || '').includes(filtros.placa.toUpperCase())) &&
    (!filtros.motorista || e.motorista_id === filtros.motorista)
  )

  const totalPeso = lista.filter(e => e.tipo_medicao === 'peso').reduce((acc, e) => acc + Number(e.peso_liquido || 0), 0)
  const totalEstereo = lista.filter(e => e.tipo_medicao === 'estereo').reduce((acc, e) => acc + Number(e.volume_estereo || 0), 0)

  return (
    <AppLayout>
      <div className="page-header">
        <h2 className="page-title">🪵 Pátio de Toras — Entrada de Madeira</h2>
        <button className="btn-primary" onClick={() => { setForm({ data: new Date().toISOString().split('T')[0] }); setTipo('peso'); setModal(true) }}>+ Nova Entrada</button>
      </div>

      {/* Filtros */}
      <div className="filter-bar">
        <div><label className="lbl">Data Início</label><input type="date" className="inp" style={{ width: 150 }} value={filtros.dataInicio} onChange={e => setFiltros(p => ({ ...p, dataInicio: e.target.value }))} /></div>
        <div><label className="lbl">Data Fim</label><input type="date" className="inp" style={{ width: 150 }} value={filtros.dataFim} onChange={e => setFiltros(p => ({ ...p, dataFim: e.target.value }))} /></div>
        <div><label className="lbl">Fornecedor</label>
          <select className="inp" style={{ width: 160 }} value={filtros.fornecedor} onChange={e => setFiltros(p => ({ ...p, fornecedor: e.target.value }))}>
            <option value="">Todos</option>
            {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>
        <div><label className="lbl">Motorista</label>
          <select className="inp" style={{ width: 160 }} value={filtros.motorista} onChange={e => setFiltros(p => ({ ...p, motorista: e.target.value }))}>
            <option value="">Todos</option>
            {motoristas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>
        <div><label className="lbl">Placa</label><input className="inp" style={{ width: 120 }} value={filtros.placa} onChange={e => setFiltros(p => ({ ...p, placa: e.target.value }))} placeholder="Filtrar..." /></div>
        <button className="btn-ghost" onClick={() => setFiltros({ dataInicio: '', dataFim: '', fornecedor: '', placa: '', motorista: '' })}>Limpar</button>
      </div>

      {/* Totais */}
      <div className="totais-bar">
        <div className="total-card">
          <div className="value">{lista.length}</div>
          <div className="label">Total de Entradas</div>
        </div>
        {totalPeso > 0 && <div className="total-card" style={{ borderLeftColor: '#1565a0' }}>
          <div className="value">{totalPeso.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} t</div>
          <div className="label" style={{ color: '#3a6a9a' }}>Total Peso Líquido</div>
        </div>}
        {totalEstereo > 0 && <div className="total-card" style={{ borderLeftColor: '#7b3f00' }}>
          <div className="value">{totalEstereo.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} m³</div>
          <div className="label" style={{ color: '#7b3f00' }}>Total Estéreo</div>
        </div>}
      </div>

      {/* Tabela */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>Data</th><th>Tipo</th><th>Fornecedor</th><th>Motorista</th><th>Placa</th><th>Classe</th><th>Quantidade</th><th>Obs</th><th></th></tr>
          </thead>
          <tbody>
            {lista.length === 0 ? (
              <tr><td colSpan={9} className="empty-state">Nenhuma entrada encontrada.</td></tr>
            ) : lista.map(e => (
              <tr key={e.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{new Date(e.data + 'T12:00').toLocaleDateString('pt-BR')}</td>
                <td>
                  <span className="badge" style={{ background: e.tipo_medicao === 'peso' ? '#e8f5ec' : '#e3f0fd', color: e.tipo_medicao === 'peso' ? '#1a5c2e' : '#1565a0' }}>
                    {e.tipo_medicao === 'peso' ? '⚖️ Peso' : '📐 Estéreo'}
                  </span>
                </td>
                <td>{(e.fornecedor as any)?.nome || (e as any).fornecedores?.nome || '—'}</td>
                <td>{(e.motorista as any)?.nome || (e as any).motoristas?.nome || '—'}</td>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{e.placa || '—'}</td>
                <td>{e.classe || '—'}</td>
                <td style={{ fontWeight: 700, color: '#1a5c2e' }}>
                  {e.tipo_medicao === 'peso'
                    ? `${Number(e.peso_liquido || 0).toFixed(3)} t`
                    : `${Number(e.volume_estereo || 0).toFixed(3)} m³`}
                </td>
                <td style={{ color: '#888', fontSize: 11 }}>{e.obs || ''}</td>
                <td>
                  <button onClick={() => excluir(e.id)} style={{ background: 'none', border: 'none', color: '#c00', cursor: 'pointer', fontSize: 14 }}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Nova Entrada de Madeira" onClose={() => setModal(false)}>
          {/* Tipo */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {(['peso', 'estereo'] as const).map(t => (
              <button key={t} onClick={() => setTipo(t)} style={{
                flex: 1, padding: '10px', border: `2px solid ${tipo === t ? '#1a5c2e' : '#c8e6d0'}`,
                borderRadius: 8, background: tipo === t ? '#1a5c2e' : '#fff',
                color: tipo === t ? '#fff' : '#1a5c2e', fontWeight: 700, cursor: 'pointer', fontSize: 13
              }}>
                {t === 'peso' ? '⚖️ Balança (Peso)' : '📐 Estéreo (Medição)'}
              </button>
            ))}
          </div>

          <div className="grid-2">
            <div><label className="lbl">Data *</label><input type="date" className="inp" defaultValue={new Date().toISOString().slice(0, 10)} onChange={e => s('data', e.target.value)} /></div>
            <div><label className="lbl">Classe</label><input className="inp" value={form.classe || ''} onChange={e => s('classe', e.target.value)} placeholder="Ex: C" /></div>
            <div><label className="lbl">Fornecedor</label>
              <select className="inp" value={form.fornecedor_id || ''} onChange={e => s('fornecedor_id', e.target.value)}>
                <option value="">Selecione...</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
            <div><label className="lbl">Motorista</label>
              <select className="inp" value={form.motorista_id || ''} onChange={e => s('motorista_id', e.target.value)}>
                <option value="">Selecione...</option>
                {motoristas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className="lbl">Placa</label>
              <select className="inp" value={form.placa || ''} onChange={e => s('placa', e.target.value)}>
                <option value="">Selecione...</option>
                {veiculos.map(v => <option key={v.id} value={v.placa}>{v.placa} — {v.tipo}</option>)}
              </select>
            </div>
          </div>

          {tipo === 'peso' && (
            <div style={{ background: '#f0faf4', borderRadius: 10, padding: 14, marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a5c2e', marginBottom: 12 }}>⚖️ DADOS DE PESO</div>
              <div className="grid-2">
                <div><label className="lbl">Peso Bruto (t)</label><input type="number" step="0.001" className="inp" value={form.peso_bruto || ''} onChange={e => s('peso_bruto', e.target.value)} /></div>
                <div><label className="lbl">Peso Tara (t)</label><input type="number" step="0.001" className="inp" value={form.peso_tara || ''} onChange={e => s('peso_tara', e.target.value)} /></div>
              </div>
              {calcLiquido() && (
                <div style={{ marginTop: 10, padding: '10px 14px', background: '#1a5c2e', borderRadius: 8, color: '#fff', fontWeight: 800, fontSize: 16 }}>
                  Peso Líquido: {calcLiquido()} t
                </div>
              )}
            </div>
          )}

          {tipo === 'estereo' && (
            <div style={{ background: '#f0faf4', borderRadius: 10, padding: 14, marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a5c2e', marginBottom: 12 }}>📐 DIMENSÕES ESTÉREO</div>
              <div className="grid-3">
                <div><label className="lbl">Altura (m)</label><input type="number" step="0.01" className="inp" value={form.altura || ''} onChange={e => s('altura', e.target.value)} /></div>
                <div><label className="lbl">Comprimento (m)</label><input type="number" step="0.01" className="inp" value={form.comprimento || ''} onChange={e => s('comprimento', e.target.value)} /></div>
                <div><label className="lbl">Largura (m)</label><input type="number" step="0.01" className="inp" value={form.largura || ''} onChange={e => s('largura', e.target.value)} /></div>
              </div>
              {calcVolume() && (
                <div style={{ marginTop: 10, padding: '10px 14px', background: '#1a5c2e', borderRadius: 8, color: '#fff', fontWeight: 800, fontSize: 16 }}>
                  Volume: {calcVolume()} m³ (÷1,4)
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <label className="lbl">Observações</label>
            <textarea className="inp" style={{ height: 56, resize: 'vertical' }} value={form.obs || ''} onChange={e => s('obs', e.target.value)} />
          </div>

          <div className="form-actions">
            <button className="btn-primary" onClick={salvar} disabled={loading}>{loading ? 'Salvando...' : 'Salvar Entrada'}</button>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}
