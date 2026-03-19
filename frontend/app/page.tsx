'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

/* ───────── Animated Counter Hook ───────── */
function useCounter(end: number, duration: number) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * end))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [end, duration])

  return { count, ref }
}

/* ───────── Fade-in on scroll ───────── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(40px)'
    el.style.transition = 'opacity 0.8s ease, transform 0.8s ease'
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
        }
      },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

/* No external images - pure CSS gradients and SVG */

const CHECK = (
  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
)

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [mobileMenu, setMobileMenu] = useState(false)

  const c1 = useCounter(2, 2000)
  const c2 = useCounter(2, 2000)
  const c3 = useCounter(41, 2000)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const f1 = useFadeIn()
  const f2 = useFadeIn()
  const f3 = useFadeIn()
  const f4 = useFadeIn()
  const f5 = useFadeIn()
  const f6 = useFadeIn()
  const f7 = useFadeIn()
  const f8 = useFadeIn()
  const f9 = useFadeIn()

  return (
    <div className="bg-[#05080a] text-white overflow-x-hidden">
      {/* ══════ NAV ══════ */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[#05080a]/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center font-bold text-sm">P</div>
            <span className="text-lg font-bold tracking-wider">PILI HARBOR</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#modulos" className="hover:text-white transition-colors">Módulos</a>
            <a href="#ia" className="hover:text-white transition-colors">IA</a>
            <a href="#eaze" className="hover:text-white transition-colors">Eaze</a>
            <a href="#contato" className="hover:text-white transition-colors">Contato</a>
            <Link href="/login" className="px-5 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium transition-colors">
              Entrar
            </Link>
          </div>
          <button className="md:hidden text-gray-400" onClick={() => setMobileMenu(!mobileMenu)}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden border-t border-white/5 bg-[#05080a]/95 backdrop-blur-xl px-6 py-4 space-y-3">
            <a href="#modulos" className="block text-gray-400 hover:text-white" onClick={() => setMobileMenu(false)}>Módulos</a>
            <a href="#ia" className="block text-gray-400 hover:text-white" onClick={() => setMobileMenu(false)}>IA</a>
            <a href="#eaze" className="block text-gray-400 hover:text-white" onClick={() => setMobileMenu(false)}>Eaze</a>
            <a href="#contato" className="block text-gray-400 hover:text-white" onClick={() => setMobileMenu(false)}>Contato</a>
            <Link href="/login" className="block text-center px-5 py-2 bg-red-600 rounded-lg text-white font-medium" onClick={() => setMobileMenu(false)}>Entrar</Link>
          </div>
        )}
      </nav>

      {/* ══════ HERO ══════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Gradient background with grid pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e14] via-[#05080a] to-[#0d0508]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-500/[0.03] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/[0.03] rounded-full blur-[150px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Gestão inteligente de pátio
            </div>
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.05] mb-6">
              Cada container<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                no lugar certo
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-xl mb-10 leading-relaxed">
              Rastreamento em tempo real, otimização com IA e app do operador.
              Gestão completa de containers empilhados, manifestos inteligentes
              e operação de pátio integrada do admin ao operador.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#contato" className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-xl text-white font-bold text-lg transition-all shadow-lg shadow-red-500/25 hover:shadow-red-500/40">
                Solicitar demonstração
              </a>
              <a href="#modulos" className="px-8 py-4 border border-white/10 hover:border-white/30 rounded-xl text-gray-300 font-medium transition-all backdrop-blur-sm">
                Ver módulos
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-14">
              <div ref={c1.ref}>
                <div className="text-3xl font-black text-white">&lt;{c1.count}m</div>
                <div className="text-sm text-gray-500 mt-1">Precisão</div>
              </div>
              <div ref={c2.ref}>
                <div className="text-3xl font-black text-white">{c2.count}s</div>
                <div className="text-sm text-gray-500 mt-1">Atualização</div>
              </div>
              <div ref={c3.ref}>
                <div className="text-3xl font-black text-white">-{c3.count}%</div>
                <div className="text-sm text-gray-500 mt-1">Tempo de operação</div>
              </div>
            </div>
          </div>

          {/* Dashboard mock */}
          <div className="hidden lg:block">
            <div className="relative rounded-2xl border border-white/10 bg-[#0a0f14]/80 backdrop-blur-xl p-1 shadow-2xl shadow-black/50">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-3 text-xs text-gray-500 font-mono">Pili Harbor — Control Center</span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Containers', value: '247', color: 'text-green-400' },
                    { label: 'Empilhadeiras', value: '6/8', color: 'text-blue-400' },
                    { label: 'Tarefas ativas', value: '12', color: 'text-yellow-400' },
                    { label: 'Remanejamentos', value: '3', color: 'text-red-400' },
                  ].map((kpi, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-3 text-center">
                      <div className={`text-lg font-bold font-mono ${kpi.color}`}>{kpi.value}</div>
                      <div className="text-xs text-gray-500">{kpi.label}</div>
                    </div>
                  ))}
                </div>
                <div className="relative bg-[#060a0e] rounded-lg h-64 border border-white/5 overflow-hidden">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  {[
                    { x: 15, y: 20, color: '#22c55e', label: '447' },
                    { x: 35, y: 35, color: '#22c55e', label: '891' },
                    { x: 55, y: 25, color: '#eab308', label: '312' },
                    { x: 75, y: 45, color: '#22c55e', label: '558' },
                    { x: 25, y: 60, color: '#22c55e', label: '203' },
                    { x: 65, y: 70, color: '#ef4444', label: '774' },
                    { x: 45, y: 50, color: '#22c55e', label: '619' },
                    { x: 85, y: 30, color: '#22c55e', label: '105' },
                  ].map((c, i) => (
                    <div key={i} className="absolute animate-pulse" style={{ left: `${c.x}%`, top: `${c.y}%`, animationDelay: `${i * 0.4}s`, animationDuration: c.color === '#eab308' ? '1s' : '3s' }}>
                      <div className="w-8 h-4 rounded-sm border text-xs flex items-center justify-center font-mono" style={{ borderColor: c.color, color: c.color, backgroundColor: c.color + '15' }}>{c.label}</div>
                    </div>
                  ))}
                  <div className="absolute animate-bounce" style={{ left: '42%', top: '42%', animationDuration: '2s' }}>
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-300 shadow-lg shadow-blue-500/50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ══════ SEGMENTOS ══════ */}
      <section className="border-y border-white/5 bg-[#05080a]">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <p className="text-xs text-gray-600 uppercase tracking-[0.3em] mb-8">Para operações de qualquer escala</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-40">
            {['PORTOS', 'SIDERÚRGICAS', 'CENTROS DE DISTRIBUIÇÃO', 'TERMINAIS', 'MINERAÇÃO'].map((t, i) => (
              <span key={i} className="text-sm font-mono tracking-widest text-gray-500">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ PROBLEMA ══════ */}
      <section ref={f1} className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs text-red-500 uppercase tracking-[0.3em] font-mono">O problema</span>
            <h2 className="text-4xl lg:text-5xl font-black mt-4">Seu pátio opera no escuro</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: (<svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 10l4 4" /></svg>), title: 'Busca manual consome o turno', desc: 'Operadores perdem até 40% do tempo procurando containers. Com empilhamento de 3-5 níveis, achar e acessar o container certo vira um quebra-cabeça.' },
              { icon: (<svg className="w-12 h-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11v4" /></svg>), title: 'Zero visibilidade de pilha', desc: 'Ninguém sabe quais containers estão embaixo de outros. Remanejamentos desnecessários desperdiçam horas e combustível.' },
              { icon: (<svg className="w-12 h-12 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>), title: 'Embarques atrasados', desc: 'Sem sequência otimizada, a empilhadeira faz 3x mais viagens. Manifestos atrasam, multas contratuais se acumulam.' },
            ].map((card, i) => (
              <div key={i} className="group rounded-2xl border border-white/5 hover:border-red-500/30 transition-all duration-500 bg-white/[0.02] hover:bg-white/[0.04] p-8">
                <div className="mb-5">{card.icon}</div>
                <h3 className="text-lg font-bold mb-3">{card.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ MÓDULOS ══════ */}
      <section id="modulos" ref={f2} className="py-24 relative">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(239,68,68,0.15), transparent 50%), radial-gradient(circle at 80% 50%, rgba(59,130,246,0.1), transparent 50%)' }} />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs text-red-500 uppercase tracking-[0.3em] font-mono">Módulos</span>
            <h2 className="text-4xl lg:text-5xl font-black mt-4">Plataforma completa</h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto">Cada módulo resolve um pedaço da operação. Juntos, transformam seu pátio.</p>
          </div>

          {/* Module 1: Control Center */}
          <div ref={f3} className="mb-12 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-mono mb-4">CONTROL CENTER</div>
              <h3 className="text-3xl font-black mb-4">Mapa ao vivo do pátio</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Visualize todos os containers e empilhadeiras em tempo real no mapa 2D interativo.
                Clique em qualquer container para ver posição, peso, status e nível na pilha.
                KPIs ao vivo no topo: containers monitorados, empilhadeiras ativas, tarefas pendentes.
              </p>
              <div className="space-y-2">
                {['Posição atualizada a cada 2 segundos via WebSocket', 'Painel lateral com tarefas ativas e alertas em tempo real', 'Indicadores de anomalia: container sem sinal, empilhadeira offline'].map((t, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-gray-400">{CHECK}<span>{t}</span></div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0a0f14] p-6">
              <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                <div className="bg-white/5 rounded-lg p-2"><div className="text-green-400 font-mono font-bold">247</div><div className="text-xs text-gray-600">Containers</div></div>
                <div className="bg-white/5 rounded-lg p-2"><div className="text-blue-400 font-mono font-bold">6</div><div className="text-xs text-gray-600">Empilhadeiras</div></div>
                <div className="bg-white/5 rounded-lg p-2"><div className="text-yellow-400 font-mono font-bold">12</div><div className="text-xs text-gray-600">Tarefas</div></div>
              </div>
              <div className="bg-[#060a0e] rounded-lg h-48 border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                <div className="absolute left-[20%] top-[30%] text-xs font-mono text-green-400 bg-green-400/10 border border-green-400/30 px-1.5 py-0.5 rounded">A-3/2 N0</div>
                <div className="absolute left-[20%] top-[20%] text-xs font-mono text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-1.5 py-0.5 rounded">A-3/2 N1</div>
                <div className="absolute left-[50%] top-[50%] text-xs font-mono text-green-400 bg-green-400/10 border border-green-400/30 px-1.5 py-0.5 rounded">B-1/4 N0</div>
                <div className="absolute left-[70%] top-[40%] w-3 h-3 rounded-full bg-blue-500 border border-blue-300 animate-bounce" style={{ animationDuration: '2s' }} />
              </div>
            </div>
          </div>

          {/* Module 2: Containers */}
          <div ref={f4} className="mb-12 grid lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1 rounded-2xl border border-white/10 bg-[#0a0f14] p-6">
              <div className="text-xs text-gray-500 font-mono mb-3">CONTAINERS / EMPILHAMENTO</div>
              <div className="space-y-2">
                {[
                  { code: 'MSCU-4471', block: 'A-3/2', level: 'N2', status: 'stored', color: 'green' },
                  { code: 'TCLU-8912', block: 'A-3/2', level: 'N1', status: 'stored', color: 'green' },
                  { code: 'CMAU-3125', block: 'A-3/2', level: 'N0', status: 'blocked', color: 'amber' },
                  { code: 'HLXU-2033', block: 'B-1/4', level: 'N0', status: 'stored', color: 'green' },
                ].map((c, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2.5">
                    <span className="font-mono text-sm text-white">{c.code}</span>
                    <span className="font-mono text-xs text-gray-500">{c.block} {c.level}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-${c.color}-400/10 text-${c.color}-400`}>{c.status}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-amber-400 bg-amber-400/10 rounded-lg px-3 py-2 border border-amber-400/20">
                CMAU-3125 bloqueado por 2 containers acima. IA calculando remanejamento.
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-4">CONTAINERS</div>
              <h3 className="text-3xl font-black mb-4">Gestão completa com empilhamento</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Cadastre containers com código, peso, posição no pátio e nível na pilha.
                O sistema rastreia Bloco, Fila, Coluna e Nível (0=chão, 1=primeiro em cima...).
                Busca instantânea por código. Status em tempo real.
              </p>
              <div className="space-y-2">
                {['Rastreamento 3D: posição (x,y) + nível na pilha', 'Detecção automática de containers bloqueados', 'Alterar status: armazenado, em trânsito, sem sinal', 'Histórico de posição e movimentação'].map((t, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-gray-400">{CHECK}<span>{t}</span></div>
                ))}
              </div>
            </div>
          </div>

          {/* Module 3: Tasks Kanban */}
          <div ref={f5} className="mb-12 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono mb-4">TAREFAS</div>
              <h3 className="text-3xl font-black mb-4">Kanban de operação</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Quadro Kanban com 4 colunas: Pendente, Atribuída, Em Andamento, Concluída.
                Crie tarefas manualmente ou deixe a IA gerar a partir de um manifesto.
                Mude o status com um clique. Atribua empilhadeira e prioridade.
              </p>
              <div className="space-y-2">
                {['Tipos: relocar, carregar, descarregar, inspecionar, rearranjar', 'Prioridade de 1-10 com cores visuais', 'Botões de ação: Atribuir, Iniciar, Concluir, Cancelar', 'Fila automática por empilhadeira com priorização'].map((t, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-gray-400">{CHECK}<span>{t}</span></div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0a0f14] p-6">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Pendente', color: 'amber', count: 4 },
                  { label: 'Atribuída', color: 'blue', count: 2 },
                  { label: 'Em Andamento', color: 'purple', count: 3 },
                  { label: 'Concluída', color: 'green', count: 8 },
                ].map((col, i) => (
                  <div key={i}>
                    <div className={`text-xs font-semibold text-${col.color}-400 bg-${col.color}-400/10 rounded px-2 py-1 mb-2 text-center`}>{col.label} ({col.count})</div>
                    {Array.from({ length: Math.min(col.count, 3) }).map((_, j) => (
                      <div key={j} className="bg-white/5 rounded p-2 mb-1.5 border border-white/5">
                        <div className="text-xs font-mono text-white">CNTR-{String(Math.floor(Math.random() * 900) + 100)}</div>
                        <div className="text-xs text-gray-600 mt-0.5">Relocar | P{Math.floor(Math.random() * 5) + 5}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Module 4: Manifests + AI */}
          <div ref={f6} className="mb-12 grid lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1 rounded-2xl border border-white/10 bg-[#0a0f14] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-3 text-xs text-gray-500 font-mono">AI Optimizer — Claude</span>
              </div>
              <div className="p-5 font-mono text-xs leading-6">
                <div className="text-gray-600">{'>'} Manifesto &quot;Embarque MSC Diana&quot; — 34 containers</div>
                <div className="text-gray-500 mt-2">Analisando pilhas e dependências...</div>
                <div className="text-gray-500">Containers bloqueados: <span className="text-amber-400">7</span></div>
                <div className="text-gray-500">Remanejamentos necessários: <span className="text-amber-400">11</span></div>
                <div className="mt-3 text-green-400">Sequência ótima calculada:</div>
                <div className="mt-2 pl-3 border-l-2 border-green-500/30 space-y-1 text-xs">
                  <div><span className="text-amber-400">1. DESEMPILHAR</span> TCLU-891 → Bloco C temp</div>
                  <div><span className="text-amber-400">2. DESEMPILHAR</span> MSCU-447 → Bloco C temp</div>
                  <div><span className="text-blue-400">3. CARREGAR</span> CMAU-312 → Doca 2</div>
                  <div><span className="text-blue-400">4. RELOCAR</span> HLXU-203 → Bloco A-1/1 N0</div>
                  <div className="text-gray-600">... +41 movimentações</div>
                </div>
                <div className="mt-3 text-gray-400">Economia: <span className="text-green-400 font-bold">-41% tempo</span> <span className="text-green-600">(-2.8km distância)</span></div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-4">MANIFESTOS + IA</div>
              <h3 className="text-3xl font-black mb-4">IA que planeja a operação inteira</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Crie um manifesto selecionando os containers. A IA analisa <strong className="text-white">todas as pilhas do pátio</strong>,
                identifica quais containers estão bloqueados, e gera a sequência ótima de movimentação
                com o <strong className="text-white">mínimo de remanejamentos possível</strong>.
              </p>
              <div className="space-y-2">
                {[
                  'Analisa o pátio inteiro antes de decidir a sequência',
                  'Calcula remanejamentos: desempilha antes de acessar',
                  'Escolhe posições temporárias que não bloqueiem outros',
                  'Balanceia carga entre empilhadeiras por proximidade',
                  'Admin vê e aprova a sequência antes de ativar',
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-gray-400">{CHECK}<span>{t}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ EAZE - APP DO OPERADOR ══════ */}
      <section id="eaze" ref={f7} className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(239,68,68,0.2), transparent 50%)' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05080a] via-[#05080a]/90 to-[#05080a]/70" />
        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono mb-4">EAZE</div>
            <h3 className="text-4xl lg:text-5xl font-black mb-6">O Waze das<br />empilhadeiras</h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              App tablet para operadores. Sem treinamento. O operador faz login,
              seleciona sua empilhadeira, e recebe as tarefas automaticamente.
              Uma seta aponta pro container, a distância atualiza em tempo real.
              Chegou? Um toque e a próxima tarefa carrega.
            </p>
            <div className="space-y-4 mb-8">
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Fluxo do operador:</h4>
              {[
                { step: '1', text: 'Login com email/senha' },
                { step: '2', text: 'Seleciona o pátio e a empilhadeira (claim via API)' },
                { step: '3', text: 'Seta direcional aponta pro container-alvo' },
                { step: '4', text: 'Distância atualizada a cada 2s via WebSocket' },
                { step: '5', text: 'Toca "Cheguei" quando está a menos de 3m' },
                { step: '6', text: 'Próxima tarefa da fila carrega automaticamente' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold flex-shrink-0">{item.step}</span>
                  <span className="text-gray-400 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {['Instruções da IA na tela: o que fazer e por quê', 'Contador de fila: "+3 tarefas na fila"', 'Botão trocar empilhadeira sem sair do app', 'Admin cria operadores no painel de Usuários'].map((t, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-gray-400">{CHECK}<span>{t}</span></div>
              ))}
            </div>
          </div>

          {/* Phone mock */}
          <div className="flex justify-center">
            <div className="relative w-72 h-[520px] rounded-[3rem] border-4 border-gray-700 bg-[#0a0f14] shadow-2xl shadow-black/50 overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#0a0f14] rounded-b-2xl border-b border-x border-gray-700" />
              <div className="h-full flex flex-col items-center justify-center p-6">
                <div className="text-lg text-red-500 font-bold tracking-[0.3em] mb-1">EAZE</div>
                <div className="text-xs text-gray-600 font-mono mb-6">PILI HARBOR</div>
                <div className="text-xs text-gray-500 mb-1 font-mono">CMAU-3125</div>
                <div className="text-xs text-gray-600 mb-4">Bloco A, Fila 3 → Doca 2</div>
                <div className="relative w-32 h-32 my-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full animate-pulse" style={{ animationDuration: '2s' }}>
                    <defs><linearGradient id="ag" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#dc2626" /></linearGradient></defs>
                    <polygon points="50,5 85,75 65,65 65,95 35,95 35,65 15,75" fill="url(#ag)" opacity="0.9" />
                  </svg>
                </div>
                <div className="text-5xl font-black text-white font-mono">23<span className="text-lg text-gray-500">m</span></div>
                <div className="text-xs text-gray-600 mt-1 font-mono">distância</div>
                <div className="mt-4 w-full py-2 bg-white/5 border border-white/10 rounded-lg text-center text-xs text-gray-500">
                  +3 tarefas na fila
                </div>
                <div className="mt-3 w-full py-3 bg-green-600/20 border border-green-500/30 rounded-xl text-center text-green-400 text-sm font-bold">
                  CHEGUEI
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ ADMIN FEATURES ══════ */}
      <section ref={f8} className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs text-red-500 uppercase tracking-[0.3em] font-mono">Painel administrativo</span>
            <h2 className="text-4xl lg:text-5xl font-black mt-4">Gestão completa</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Gestão de Empilhadeiras', desc: 'Cadastre empilhadeiras com código único. Acompanhe status (disponível, trabalhando, offline, manutenção), posição e último sinal. Atribua operadores.', color: 'blue' },
              { title: 'Gestão de Usuários', desc: 'Crie contas de operadores, supervisores e admins. Defina perfis de acesso. O operador recebe email/senha e acessa o Eaze direto.', color: 'purple' },
              { title: 'Configurações & Plano', desc: 'Visualize dados da empresa, limites do plano (pátios, containers, empilhadeiras), gerencie múltiplos pátios e acesse de qualquer lugar.', color: 'green' },
              { title: 'Alertas em Tempo Real', desc: 'Notificações automáticas: container sem sinal, empilhadeira offline, prazo de manifesto, tarefas reatribuídas. Tudo via WebSocket.', color: 'red' },
              { title: 'Multi-pátio', desc: 'Gerencie múltiplos pátios na mesma conta. Cada pátio tem suas dimensões, containers, empilhadeiras e equipe. Troque entre eles com um clique.', color: 'amber' },
              { title: 'Segurança', desc: 'Rotas protegidas com middleware de autenticação. Tokens JWT. Isolamento por tenant — cada empresa vê apenas seus dados. CORS configurado.', color: 'gray' },
            ].map((feat, i) => (
              <div key={i} className="backdrop-blur-xl bg-white/[0.02] rounded-2xl border border-white/5 p-8 hover:border-red-500/20 hover:bg-white/[0.04] transition-all duration-300">
                <div className={`w-10 h-10 rounded-xl bg-${feat.color}-500/10 flex items-center justify-center mb-4`}>
                  <div className={`w-3 h-3 rounded-full bg-${feat.color}-500`} />
                </div>
                <h3 className="text-lg font-bold mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ CONTATO / PRICING ══════ */}
      <section id="contato" ref={f9} className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(239,68,68,0.15), transparent 60%)' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05080a] via-[#05080a]/80 to-[#05080a]" />
        <div className="relative text-center max-w-3xl mx-auto px-6">
          <span className="text-xs text-red-500 uppercase tracking-[0.3em] font-mono">Contato</span>
          <h2 className="text-4xl lg:text-6xl font-black mt-4 mb-6">Sob consulta</h2>
          <p className="text-gray-400 text-lg mb-4">
            Cada operação tem suas particularidades. Entendemos seu pátio
            e montamos um plano sob medida para seu volume e complexidade.
          </p>
          <p className="text-gray-500 mb-10">
            Agende uma demonstração gratuita e veja o Pili Harbor
            funcionando com dados do seu pátio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:contato@piliharbor.io" className="px-10 py-5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-xl text-white font-bold text-lg transition-all shadow-lg shadow-red-500/25 hover:shadow-red-500/40">
              Solicitar demonstração
            </a>
            <Link href="/login" className="px-10 py-5 border border-white/10 hover:border-white/30 rounded-xl text-gray-300 font-medium transition-all">
              Acessar plataforma
            </Link>
          </div>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center font-bold text-xs">P</div>
            <span className="text-sm font-bold tracking-wider">PILI HARBOR</span>
          </div>
          <p className="text-xs text-gray-600">
            © 2026 Pili Harbor. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
