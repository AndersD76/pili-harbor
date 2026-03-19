'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface Forklift {
  id: string
  code: string
  status: string
  yard_id: string
  operator_id: string | null
}

interface Yard {
  id: string
  name: string
}

interface MeResponse {
  user: { id: string; full_name: string; role: string }
  tenant: { id: string; name: string }
}

export default function OperatorHomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [me, setMe] = useState<MeResponse | null>(null)
  const [yards, setYards] = useState<Yard[]>([])
  const [selectedYard, setSelectedYard] = useState<string | null>(null)
  const [forklifts, setForklifts] = useState<Forklift[]>([])
  const [loadingForklifts, setLoadingForklifts] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const [meData, yardsData] = await Promise.all([
          api.get<MeResponse>('/api/v1/auth/me'),
          api.get<Yard[]>('/api/v1/yards'),
        ])
        setMe(meData)
        setYards(yardsData)

        // Check if already has a stored yard
        const storedYard = localStorage.getItem('current_yard_id')
        if (storedYard && yardsData.some((y) => y.id === storedYard)) {
          setSelectedYard(storedYard)
          await loadForklifts(storedYard)
        } else if (yardsData.length === 1) {
          setSelectedYard(yardsData[0].id)
          localStorage.setItem('current_yard_id', yardsData[0].id)
          localStorage.setItem('current_yard_name', yardsData[0].name)
          await loadForklifts(yardsData[0].id)
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar')
      }
      setLoading(false)
    }
    init()
  }, [])

  async function loadForklifts(yardId: string) {
    setLoadingForklifts(true)
    try {
      const data = await api.get<Forklift[]>(`/api/v1/yards/${yardId}/forklifts`)
      setForklifts(data)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar empilhadeiras')
    }
    setLoadingForklifts(false)
  }

  async function handleSelectYard(yardId: string) {
    const yard = yards.find((y) => y.id === yardId)
    if (!yard) return
    setSelectedYard(yardId)
    localStorage.setItem('current_yard_id', yardId)
    localStorage.setItem('current_yard_name', yard.name)
    await loadForklifts(yardId)
  }

  async function handleClaim(forklift: Forklift) {
    setClaiming(forklift.id)
    try {
      await api.post(`/api/v1/forklifts/${forklift.id}/claim`)
      localStorage.setItem('operator_forklift_id', forklift.id)
      router.push('/operator/nav')
    } catch (err: any) {
      setError(err.message || 'Erro ao selecionar empilhadeira')
      setClaiming(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-harbor-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-harbor-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-harbor-muted">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-harbor-bg p-6 pb-20">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-harbor-accent tracking-[0.3em]">EAZE</h1>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="w-6 h-px bg-harbor-muted/40" />
          <p className="text-harbor-muted text-xs tracking-[0.2em] uppercase">PILI HARBOR</p>
          <span className="w-6 h-px bg-harbor-muted/40" />
        </div>
        {me && (
          <p className="text-harbor-text text-lg mt-4">
            Olá, <span className="font-semibold">{me.user.full_name}</span>
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6 text-center">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Fechar</button>
        </div>
      )}

      {/* Yard selection */}
      {yards.length > 1 && (
        <div className="mb-6">
          <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Selecione o Pátio</label>
          <select
            value={selectedYard || ''}
            onChange={(e) => handleSelectYard(e.target.value)}
            className="w-full px-4 py-3.5 bg-harbor-surface border border-harbor-border rounded-lg text-harbor-text text-lg focus:border-harbor-accent focus:outline-none"
          >
            <option value="">Escolha um pátio</option>
            {yards.map((y) => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Forklift selection */}
      {selectedYard && (
        <div>
          <h2 className="text-sm font-semibold text-harbor-muted uppercase tracking-wider mb-4">
            Selecione sua Empilhadeira
          </h2>

          {loadingForklifts ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-harbor-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : forklifts.length === 0 ? (
            <div className="text-center py-12 text-harbor-muted">
              Nenhuma empilhadeira disponível neste pátio.
            </div>
          ) : (
            <div className="space-y-3">
              {forklifts.map((f) => {
                const isAvailable = !f.operator_id || f.operator_id === me?.user.id
                const isMine = f.operator_id === me?.user.id
                return (
                  <button
                    key={f.id}
                    onClick={() => isAvailable && handleClaim(f)}
                    disabled={!isAvailable || claiming === f.id}
                    className={`w-full p-5 rounded-xl border text-left transition-all ${
                      isMine
                        ? 'bg-harbor-accent/10 border-harbor-accent/40 hover:bg-harbor-accent/20'
                        : isAvailable
                          ? 'bg-harbor-surface border-harbor-border hover:border-harbor-accent/30'
                          : 'bg-harbor-surface/50 border-harbor-border/50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          isMine ? 'bg-harbor-accent/20' : 'bg-harbor-bg'
                        }`}>
                          <svg className={`w-7 h-7 ${isMine ? 'text-harbor-accent' : 'text-harbor-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-mono font-bold text-xl text-harbor-text">{f.code}</div>
                          <div className="text-sm text-harbor-muted mt-0.5">
                            {isMine ? 'Sua empilhadeira' : f.operator_id ? 'Em uso por outro operador' : 'Disponível'}
                          </div>
                        </div>
                      </div>
                      {claiming === f.id ? (
                        <div className="w-6 h-6 border-2 border-harbor-accent border-t-transparent rounded-full animate-spin" />
                      ) : isAvailable ? (
                        <svg className="w-6 h-6 text-harbor-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
