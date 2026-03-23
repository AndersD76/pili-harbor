'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface GateEvent {
  id: string
  container_id: string
  event_type: string
  truck_plate: string | null
  driver_name: string | null
  seal_number: string | null
  seal_status: string | null
  damage_codes: string | null
  vgm_kg: number | null
  notes: string | null
  recorded_at: string
}

interface ContainerOption { id: string; code: string; cargo_type: string; is_reefer: boolean }

export default function GatePage() {
  const router = useRouter()
  const [events, setEvents] = useState<GateEvent[]>([])
  const [containers, setContainers] = useState<ContainerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [yardId, setYardId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState<'gate_in' | 'gate_out' | null>(null)
  const [selectedContainer, setSelectedContainer] = useState('')
  const [form, setForm] = useState({
    truck_plate: '', driver_name: '', driver_doc: '',
    seal_number: '', seal_status: 'ok', damage_codes: '',
    vgm_kg: '', temperature_celsius: '', notes: '',
    weight_kg: '', shipping_line: '', bl_number: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = localStorage.getItem('current_yard_id')
    if (!id) { router.push('/dashboard'); return }
    setYardId(id)
    loadData(id)
  }, [router])

  function loadData(id: string) {
    Promise.all([
      api.get<GateEvent[]>(`/api/v1/yards/${id}/gate-events`),
      api.get<ContainerOption[]>(`/api/v1/yards/${id}/containers`),
    ]).then(([ev, ct]) => {
      setEvents(ev)
      setContainers(ct)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!yardId || !selectedContainer || !showModal) return
    setSubmitting(true)
    setError(null)
    try {
      const endpoint = showModal === 'gate_in' ? 'gate-in' : 'gate-out'
      await api.post(`/api/v1/yards/${yardId}/containers/${selectedContainer}/${endpoint}`, {
        truck_plate: form.truck_plate || null,
        driver_name: form.driver_name || null,
        driver_doc: form.driver_doc || null,
        seal_number: form.seal_number || null,
        seal_status: form.seal_status || 'ok',
        damage_codes: form.damage_codes || null,
        vgm_kg: form.vgm_kg ? Number(form.vgm_kg) : null,
        temperature_celsius: form.temperature_celsius ? Number(form.temperature_celsius) : null,
        notes: form.notes || null,
        ...(showModal === 'gate_in' ? {
          weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
          shipping_line: form.shipping_line || null,
          bl_number: form.bl_number || null,
        } : {}),
      })
      setShowModal(null)
      setForm({ truck_plate: '', driver_name: '', driver_doc: '', seal_number: '', seal_status: 'ok', damage_codes: '', vgm_kg: '', temperature_celsius: '', notes: '', weight_kg: '', shipping_line: '', bl_number: '' })
      setSelectedContainer('')
      loadData(yardId)
    } catch (err: any) {
      setError(err.message || 'Erro na operação de gate')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-harbor-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const inputClass = "w-full px-4 py-3 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text focus:border-harbor-accent focus:outline-none text-sm"

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-harbor-surface border border-harbor-border rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-harbor-border">
              <h3 className="text-lg font-bold text-harbor-text">
                {showModal === 'gate_in' ? 'Gate-In (Entrada)' : 'Gate-Out (Saída)'}
              </h3>
              <button onClick={() => setShowModal(null)} className="text-harbor-muted hover:text-harbor-text">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Container *</label>
                <select value={selectedContainer} onChange={(e) => setSelectedContainer(e.target.value)} className={inputClass} required>
                  <option value="">Selecione...</option>
                  {containers.map(c => <option key={c.id} value={c.id}>{c.code} ({c.cargo_type})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Placa do Caminhão</label>
                  <input type="text" value={form.truck_plate} onChange={e => setForm({...form, truck_plate: e.target.value})} className={inputClass} placeholder="ABC-1234" />
                </div>
                <div>
                  <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Motorista</label>
                  <input type="text" value={form.driver_name} onChange={e => setForm({...form, driver_name: e.target.value})} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Lacre</label>
                  <input type="text" value={form.seal_number} onChange={e => setForm({...form, seal_number: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Status Lacre</label>
                  <select value={form.seal_status} onChange={e => setForm({...form, seal_status: e.target.value})} className={inputClass}>
                    <option value="ok">OK</option>
                    <option value="broken">Violado</option>
                    <option value="missing">Ausente</option>
                    <option value="replaced">Substituído</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">VGM (kg)</label>
                  <input type="number" value={form.vgm_kg} onChange={e => setForm({...form, vgm_kg: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Avarias (códigos)</label>
                  <input type="text" value={form.damage_codes} onChange={e => setForm({...form, damage_codes: e.target.value})} className={inputClass} placeholder="DE,HO,SC,ST" />
                </div>
              </div>
              {showModal === 'gate_in' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Armador</label>
                    <input type="text" value={form.shipping_line} onChange={e => setForm({...form, shipping_line: e.target.value})} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">BL</label>
                    <input type="text" value={form.bl_number} onChange={e => setForm({...form, bl_number: e.target.value})} className={inputClass} />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Observações</label>
                <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className={inputClass} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-3 text-sm font-medium text-harbor-muted bg-harbor-bg border border-harbor-border rounded-lg hover:text-harbor-text">Cancelar</button>
                <button type="submit" disabled={submitting} className={`flex-1 py-3 text-sm font-bold text-white rounded-lg disabled:opacity-50 ${showModal === 'gate_in' ? 'bg-harbor-green hover:bg-green-500' : 'bg-harbor-accent hover:bg-red-600'}`}>
                  {submitting ? 'Processando...' : showModal === 'gate_in' ? 'Registrar Entrada' : 'Registrar Saída'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-harbor-text">Gate Operations</h2>
            <p className="text-harbor-muted text-sm mt-0.5">Controle de entrada e saída de containers (EIR)</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowModal('gate_in')} className="px-4 py-2.5 bg-harbor-green text-harbor-bg text-sm font-semibold rounded-lg hover:bg-green-500 inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" /></svg>
              Gate-In
            </button>
            <button onClick={() => setShowModal('gate_out')} className="px-4 py-2.5 bg-harbor-accent text-white text-sm font-semibold rounded-lg hover:bg-red-600 inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l4 4m0 0l-4 4m4-4H3" /></svg>
              Gate-Out
            </button>
          </div>
        </div>

        {/* Events log */}
        <div className="bg-harbor-surface border border-harbor-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-harbor-border">
                <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase font-medium">Data/Hora</th>
                <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase font-medium">Placa</th>
                <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase font-medium">Lacre</th>
                <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase font-medium">VGM</th>
                <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase font-medium">Avarias</th>
                <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase font-medium">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-harbor-border">
              {events.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-harbor-muted text-sm">Nenhum evento de gate registrado</td></tr>
              ) : events.map(ev => (
                <tr key={ev.id} className="hover:bg-harbor-bg/50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${ev.event_type === 'gate_in' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                      {ev.event_type === 'gate_in' ? 'ENTRADA' : 'SAÍDA'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-harbor-muted">{new Date(ev.recorded_at).toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3 font-mono text-xs text-harbor-text">{ev.truck_plate || '-'}</td>
                  <td className="px-4 py-3 text-xs">
                    {ev.seal_number ? <span className={ev.seal_status === 'ok' ? 'text-harbor-green' : 'text-red-400'}>{ev.seal_number} ({ev.seal_status})</span> : '-'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-harbor-muted">{ev.vgm_kg ? `${ev.vgm_kg.toLocaleString('pt-BR')} kg` : '-'}</td>
                  <td className="px-4 py-3 text-xs text-harbor-muted">{ev.damage_codes || '-'}</td>
                  <td className="px-4 py-3 text-xs text-harbor-muted">{ev.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
