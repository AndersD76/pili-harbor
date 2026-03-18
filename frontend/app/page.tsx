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

/* ───────── Unsplash Images ───────── */
const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?w=1920&q=80',
  port1: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80',
  port2: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&q=80',
  port3: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
  aerial: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1920&q=80',
  crane: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&q=80',
  forklift: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
  containers: 'https://images.unsplash.com/photo-1605745341075-1b7460b99df8?w=1920&q=80',
  ship: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=1920&q=80',
}

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [mobileMenu, setMobileMenu] = useState(false)

  const c1 = useCounter(2, 2000)
  const c2 = useCounter(2, 2000)
  const c3 = useCounter(100, 2500)
  const c4 = useCounter(41, 2000)

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
            <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#precos" className="hover:text-white transition-colors">Preços</a>
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
            <a href="#como-funciona" className="block text-gray-400 hover:text-white" onClick={() => setMobileMenu(false)}>Como funciona</a>
            <a href="#funcionalidades" className="block text-gray-400 hover:text-white" onClick={() => setMobileMenu(false)}>Funcionalidades</a>
            <a href="#precos" className="block text-gray-400 hover:text-white" onClick={() => setMobileMenu(false)}>Preços</a>
            <Link href="/login" className="block text-center px-5 py-2 bg-red-600 rounded-lg text-white font-medium" onClick={() => setMobileMenu(false)}>Entrar</Link>
          </div>
        )}
      </nav>

      {/* ══════ HERO ══════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Parallax background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${IMAGES.hero})`,
            transform: `translateY(${scrollY * 0.3}px) scale(1.1)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05080a]/80 via-[#05080a]/60 to-[#05080a]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05080a]/90 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Plataforma SaaS Cloud-Native
            </div>
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.05] mb-6">
              Cada container<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                no lugar certo
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-xl mb-10 leading-relaxed">
              Localização em tempo real via rede mesh IoT e otimização inteligente com IA
              para pátios industriais, portos e centros de distribuição.
              100% na nuvem — sem servidor no pátio.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/login?mode=register" className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-xl text-white font-bold text-lg transition-all shadow-lg shadow-red-500/25 hover:shadow-red-500/40">
                Comece grátis
              </Link>
              <a href="#como-funciona" className="px-8 py-4 border border-white/10 hover:border-white/30 rounded-xl text-gray-300 font-medium transition-all backdrop-blur-sm">
                Ver demonstração
              </a>
            </div>

            {/* Metrics */}
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
                <div className="text-3xl font-black text-white">{c3.count}%</div>
                <div className="text-sm text-gray-500 mt-1">Na nuvem</div>
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
                <span className="ml-3 text-xs text-gray-500 font-mono">Control Center — Pátio Santos</span>
              </div>
              <div className="p-4">
                {/* Mock KPIs */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Containers', value: '247', color: 'text-green-400' },
                    { label: 'Empilhadeiras', value: '6/8', color: 'text-blue-400' },
                    { label: 'Eficiência', value: '94%', color: 'text-yellow-400' },
                    { label: 'Tempo médio', value: '3.2min', color: 'text-red-400' },
                  ].map((kpi, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-3 text-center">
                      <div className={`text-lg font-bold font-mono ${kpi.color}`}>{kpi.value}</div>
                      <div className="text-[10px] text-gray-500">{kpi.label}</div>
                    </div>
                  ))}
                </div>
                {/* Mock map */}
                <div className="relative bg-[#060a0e] rounded-lg h-64 border border-white/5 overflow-hidden">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  {/* Animated containers */}
                  {[
                    { x: 15, y: 20, color: '#22c55e', label: 'MSCU-447' },
                    { x: 35, y: 35, color: '#22c55e', label: 'TCLU-891' },
                    { x: 55, y: 25, color: '#eab308', label: 'CMAU-312' },
                    { x: 75, y: 45, color: '#22c55e', label: 'MSCU-558' },
                    { x: 25, y: 60, color: '#22c55e', label: 'HLXU-203' },
                    { x: 65, y: 70, color: '#ef4444', label: 'TCKU-774' },
                    { x: 45, y: 50, color: '#22c55e', label: 'SUDU-619' },
                    { x: 85, y: 30, color: '#22c55e', label: 'MSKU-105' },
                  ].map((c, i) => (
                    <div
                      key={i}
                      className="absolute animate-pulse"
                      style={{
                        left: `${c.x}%`,
                        top: `${c.y}%`,
                        animationDelay: `${i * 0.4}s`,
                        animationDuration: c.color === '#eab308' ? '1s' : '3s',
                      }}
                    >
                      <div className="w-8 h-4 rounded-sm border text-[6px] flex items-center justify-center font-mono" style={{ borderColor: c.color, color: c.color, backgroundColor: c.color + '15' }}>
                        {c.label.split('-')[1]}
                      </div>
                    </div>
                  ))}
                  {/* Forklift */}
                  <div className="absolute animate-bounce" style={{ left: '42%', top: '42%', animationDuration: '2s' }}>
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-300 shadow-lg shadow-blue-500/50" />
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-b-[5px] border-transparent border-b-blue-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ══════ TRUSTED BY / SOCIAL PROOF ══════ */}
      <section className="border-y border-white/5 bg-[#05080a]">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <p className="text-xs text-gray-600 uppercase tracking-[0.3em] mb-8">Pronto para pátios industriais de qualquer escala</p>
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
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto">A maioria dos pátios industriais ainda depende de processos manuais e infraestrutura cara</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                img: IMAGES.port1,
                icon: '🔍',
                title: 'Busca manual consome o turno',
                desc: 'Operadores perdem até 40% do tempo procurando containers no pátio sem localização precisa.',
              },
              {
                img: IMAGES.port2,
                icon: '💰',
                title: 'Infraestrutura cara e frágil',
                desc: 'Soluções tradicionais exigem antenas fixas, servidores locais e manutenção constante.',
              },
              {
                img: IMAGES.port3,
                icon: '⏰',
                title: 'Embarques atrasados',
                desc: 'Falta de otimização na sequência de movimentação causa atrasos e multas contratuais.',
              },
            ].map((card, i) => (
              <div key={i} className="group relative overflow-hidden rounded-2xl border border-white/5 hover:border-red-500/30 transition-all duration-500">
                <div className="h-48 overflow-hidden">
                  <img src={card.img} alt={card.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#05080a]/60 to-[#05080a]" />
                </div>
                <div className="p-6 relative">
                  <span className="text-2xl mb-3 block">{card.icon}</span>
                  <h3 className="text-lg font-bold mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ COMO FUNCIONA ══════ */}
      <section id="como-funciona" ref={f2} className="py-24 relative">
        <div className="absolute inset-0 bg-cover bg-center bg-fixed opacity-10" style={{ backgroundImage: `url(${IMAGES.aerial})` }} />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs text-red-500 uppercase tracking-[0.3em] font-mono">Como funciona</span>
            <h2 className="text-4xl lg:text-5xl font-black mt-4">Do sinal ao dashboard<br />em milissegundos</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Placas IoT nos containers', desc: 'Cada container recebe uma placa IoT solar que se comunica em rede mesh.' },
              { step: '02', title: 'Gateway na empilhadeira', desc: 'O gateway coleta os sinais RSSI de todos os containers ao redor.' },
              { step: '03', title: 'Backend na nuvem processa', desc: 'Trilateração em tempo real calcula a posição com precisão submétrica.' },
              { step: '04', title: 'IA distribui e otimiza', desc: 'Inteligência artificial cria rotas otimizadas e distribui tarefas.' },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="backdrop-blur-xl bg-white/[0.03] rounded-2xl border border-white/5 p-6 hover:border-red-500/20 transition-colors h-full">
                  <span className="text-5xl font-black text-red-500/20 font-mono">{item.step}</span>
                  <h3 className="text-lg font-bold mt-4 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 text-gray-700">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ FUNCIONALIDADES ══════ */}
      <section id="funcionalidades" ref={f3} className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs text-red-500 uppercase tracking-[0.3em] font-mono">Funcionalidades</span>
            <h2 className="text-4xl lg:text-5xl font-black mt-4">Tudo que seu pátio precisa</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🗺️', title: 'Mapa ao vivo', desc: 'Visualize todos os containers e empilhadeiras em tempo real no canvas interativo.' },
              { icon: '🧭', title: 'App Waze para operadores', desc: 'Seta direcional e distância no tablet — o operador só segue a seta.' },
              { icon: '🤖', title: 'Otimização com IA', desc: 'Claude AI cria sequências otimizadas que economizam até 41% do tempo.' },
              { icon: '📋', title: 'Filas inteligentes', desc: 'Cada empilhadeira tem sua fila de tarefas priorizada automaticamente.' },
              { icon: '🚨', title: 'Detecção de anomalias', desc: 'Alertas automáticos para containers sem sinal, empilhadeiras offline e prazos.' },
              { icon: '📊', title: 'KPIs e histórico', desc: 'Métricas do turno, eficiência operacional e rastreabilidade completa.' },
            ].map((feat, i) => (
              <div key={i} className="group backdrop-blur-xl bg-white/[0.02] rounded-2xl border border-white/5 p-8 hover:border-red-500/20 hover:bg-white/[0.04] transition-all duration-300">
                <span className="text-3xl block mb-4">{feat.icon}</span>
                <h3 className="text-lg font-bold mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ APP DO OPERADOR ══════ */}
      <section ref={f4} className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-15" style={{ backgroundImage: `url(${IMAGES.forklift})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05080a] via-[#05080a]/90 to-[#05080a]/70" />
        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-xs text-red-500 uppercase tracking-[0.3em] font-mono">App do operador</span>
            <h2 className="text-4xl lg:text-5xl font-black mt-4 mb-6">Waze para<br />empilhadeiras</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              O operador vê apenas uma seta e a distância. Sem treinamento,
              sem complicação. Quando chega no container, confirma com um toque
              e a próxima tarefa carrega automaticamente.
            </p>
            <div className="space-y-4">
              {[
                'Seta direcional que aponta pro container-alvo',
                'Distância atualizada a cada 2 segundos',
                'Funciona offline com service worker',
                'Fonte grande para leitura a distância no tablet',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-400 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Phone mock */}
          <div className="flex justify-center">
            <div className="relative w-72 h-[520px] rounded-[3rem] border-4 border-gray-700 bg-[#0a0f14] shadow-2xl shadow-black/50 overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#0a0f14] rounded-b-2xl border-b border-x border-gray-700" />
              <div className="h-full flex flex-col items-center justify-center p-6">
                <div className="text-[10px] text-gray-600 font-mono mb-4">EAZE PILI HARBOR</div>
                <div className="text-xs text-gray-500 mb-2 font-mono">MSCU-4471220</div>
                {/* Arrow */}
                <div className="relative w-32 h-32 my-6">
                  <svg viewBox="0 0 100 100" className="w-full h-full animate-pulse" style={{ animationDuration: '2s' }}>
                    <defs>
                      <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                    </defs>
                    <polygon points="50,5 85,75 65,65 65,95 35,95 35,65 15,75" fill="url(#arrowGrad)" opacity="0.9" />
                  </svg>
                </div>
                <div className="text-5xl font-black text-white font-mono">47<span className="text-lg text-gray-500">m</span></div>
                <div className="text-xs text-gray-600 mt-1 font-mono">NNE 23°</div>
                <div className="mt-8 w-full py-3 bg-green-600/20 border border-green-500/30 rounded-xl text-center text-green-400 text-sm font-bold opacity-50">
                  CHEGUEI
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ IA TERMINAL ══════ */}
      <section ref={f5} className="py-24">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          {/* Terminal */}
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl border border-white/10 bg-[#0a0f14] overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-3 text-xs text-gray-500 font-mono">AI Optimizer — Claude</span>
              </div>
              <div className="p-6 font-mono text-sm leading-7">
                <div className="text-gray-600">{'>'} pili optimize --manifest &quot;Embarque MSC Diana 14h&quot;</div>
                <div className="text-gray-500 mt-3">Analisando manifesto...</div>
                <div className="text-gray-500">Containers: <span className="text-white">34</span></div>
                <div className="text-gray-500">Empilhadeiras disponíveis: <span className="text-blue-400">6</span></div>
                <div className="text-gray-500 mt-2">Calculando rotas otimizadas...</div>
                <div className="mt-4 text-green-400">✓ Plano gerado com sucesso</div>
                <div className="mt-3 pl-4 border-l-2 border-green-500/30 space-y-1">
                  <div className="text-gray-400">Tempo estimado: <span className="text-white font-bold">2h 14min</span></div>
                  <div className="text-gray-400">Tempo manual:   <span className="text-gray-600 line-through">3h 50min</span></div>
                  <div ref={c4.ref} className="text-green-400">Economia:       <span className="font-bold">{c4.count}%</span> <span className="text-green-600">(-1h 36min)</span></div>
                  <div className="text-gray-400">Distância total: <span className="text-white">4.2 km</span> <span className="text-green-600">(-2.8 km)</span></div>
                </div>
                <div className="mt-4 text-gray-600">{'>'} <span className="animate-pulse">_</span></div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <span className="text-xs text-red-500 uppercase tracking-[0.3em] font-mono">Inteligência Artificial</span>
            <h2 className="text-4xl lg:text-5xl font-black mt-4 mb-6">IA que pensa<br />como seu melhor<br />supervisor</h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              O Pili Harbor usa Claude, a IA mais avançada da Anthropic,
              para analisar o estado do pátio e criar planos otimizados
              que minimizam distância percorrida e tempo de operação.
            </p>
            <div className="space-y-3">
              {[
                'Minimiza distância total percorrida',
                'Balanceia carga entre empilhadeiras',
                'Prioriza containers que bloqueiam outros',
                'Respeita sequência obrigatória do manifesto',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-400 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════ IMAGE SHOWCASE ══════ */}
      <section ref={f6} className="py-24 relative">
        <div className="absolute inset-0 bg-cover bg-center bg-fixed opacity-20" style={{ backgroundImage: `url(${IMAGES.containers})` }} />
        <div className="absolute inset-0 bg-[#05080a]/80" />
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-black mb-6">Feito para operações<br />de verdade</h2>
          <p className="text-gray-500 max-w-2xl mx-auto mb-16">
            Do porto de Santos ao terminal de containers da China,
            o Pili Harbor escala para qualquer operação.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl overflow-hidden h-64 relative group">
              <img src={IMAGES.crane} alt="Port crane" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05080a] to-transparent" />
              <div className="absolute bottom-4 left-4 text-sm font-bold">Portos marítimos</div>
            </div>
            <div className="rounded-2xl overflow-hidden h-64 relative group">
              <img src={IMAGES.forklift} alt="Warehouse forklift" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05080a] to-transparent" />
              <div className="absolute bottom-4 left-4 text-sm font-bold">Centros de distribuição</div>
            </div>
            <div className="rounded-2xl overflow-hidden h-64 relative group">
              <img src={IMAGES.ship} alt="Container ship" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05080a] to-transparent" />
              <div className="absolute bottom-4 left-4 text-sm font-bold">Terminais de carga</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ PREÇOS ══════ */}
      <section id="precos" ref={f7} className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs text-red-500 uppercase tracking-[0.3em] font-mono">Preços</span>
            <h2 className="text-4xl lg:text-5xl font-black mt-4">Simples e transparente</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: 'Básico',
                price: 'R$ 990',
                desc: 'Para operações menores',
                features: ['1 pátio', 'Até 300 containers', '4 empilhadeiras', 'Mapa em tempo real', 'App do operador', 'Suporte por email'],
                cta: 'Comece grátis',
                popular: false,
              },
              {
                name: 'Profissional',
                price: 'R$ 2.490',
                desc: 'Para operações em crescimento',
                features: ['Até 3 pátios', 'Containers ilimitados', 'Empilhadeiras ilimitadas', 'Otimização com IA', 'API completa', 'Suporte prioritário'],
                cta: 'Comece grátis',
                popular: true,
              },
              {
                name: 'Enterprise',
                price: 'Sob consulta',
                desc: 'Para grandes operações',
                features: ['Pátios ilimitados', 'Containers ilimitados', 'SLA 99.9%', 'IA customizada', 'Integração ERP/TOS', 'Gerente de sucesso dedicado'],
                cta: 'Falar com vendas',
                popular: false,
              },
            ].map((plan, i) => (
              <div key={i} className={`relative rounded-2xl border p-8 ${plan.popular ? 'border-red-500/50 bg-red-500/[0.03]' : 'border-white/5 bg-white/[0.02]'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-600 rounded-full text-xs font-bold">
                    Mais popular
                  </div>
                )}
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.desc}</p>
                <div className="mt-6 mb-8">
                  <span className="text-4xl font-black">{plan.price}</span>
                  {plan.price !== 'Sob consulta' && <span className="text-gray-500 text-sm">/mês</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-gray-400">
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login?mode=register"
                  className={`block text-center py-3 rounded-xl font-bold text-sm transition-colors ${plan.popular ? 'bg-red-600 hover:bg-red-500 text-white' : 'border border-white/10 hover:border-white/30 text-gray-300'}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ CTA FINAL ══════ */}
      <section ref={f8} className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${IMAGES.ship})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05080a] via-[#05080a]/80 to-[#05080a]" />
        <div className="relative text-center max-w-3xl mx-auto px-6">
          <h2 className="text-4xl lg:text-6xl font-black mb-6">Pronto para ver<br />seu pátio ao vivo?</h2>
          <p className="text-gray-400 text-lg mb-10">
            Crie sua conta gratuita em 30 segundos. Sem cartão de crédito.
          </p>
          <Link href="/login?mode=register" className="inline-block px-10 py-5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-xl text-white font-bold text-lg transition-all shadow-lg shadow-red-500/25 hover:shadow-red-500/40">
            Comece grátis agora
          </Link>
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
            © 2026 Pili Harbor. Todos os direitos reservados. piliharbor.io
          </p>
        </div>
      </footer>
    </div>
  )
}
