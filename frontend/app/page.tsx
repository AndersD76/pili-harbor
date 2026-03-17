'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'

/* ───────── Animated Counter Hook ───────── */
function useCounter(end: number, duration: number, startOnView: boolean) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (!startOnView) return
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
  }, [end, duration, startOnView])

  return { count, ref }
}

/* ───────── Main Component ───────── */
export default function LandingPage() {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const [scrollY, setScrollY] = useState(0)
  const [mobileMenu, setMobileMenu] = useState(false)

  /* Parallax scroll listener */
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Scroll-triggered animations */
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('animate-in')
        })
      },
      { threshold: 0.08 }
    )
    document.querySelectorAll('.fade-up').forEach((el) => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [])

  /* Counter refs */
  const counter1 = useCounter(98, 2000, true)
  const counter2 = useCounter(41, 2000, true)
  const counter3 = useCounter(2, 1500, true)
  const counter4 = useCounter(500, 2000, true)

  /* Smooth scroll */
  const scrollTo = useCallback((id: string) => {
    setMobileMenu(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <div className="min-h-screen bg-harbor-bg text-harbor-text overflow-x-hidden scroll-smooth">
      <style jsx global>{`
        html { scroll-behavior: smooth; }
        .fade-up { opacity: 0; transform: translateY(40px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-in { opacity: 1 !important; transform: translateY(0) !important; }
        .glow-green { box-shadow: 0 0 80px rgba(0, 224, 122, 0.12), 0 0 30px rgba(0, 224, 122, 0.06); }
        .glow-red { box-shadow: 0 0 80px rgba(239, 68, 68, 0.12), 0 0 30px rgba(239, 68, 68, 0.06); }
        .glass { background: rgba(13, 17, 23, 0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(26, 35, 50, 0.8); }
        .glass-strong { background: rgba(13, 17, 23, 0.85); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(26, 35, 50, 0.9); }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .float { animation: float 4s ease-in-out infinite; }
        @keyframes move-forklift { 0% { transform: translateX(0); } 50% { transform: translateX(40px); } 100% { transform: translateX(0); } }
        .move-forklift { animation: move-forklift 4s ease-in-out infinite; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .shimmer { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer 3s ease-in-out infinite; }
        @keyframes typing { from { width: 0; } to { width: 100%; } }
        .typing-line { overflow: hidden; white-space: nowrap; animation: typing 1.5s steps(40) forwards; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .cursor-blink::after { content: '█'; animation: blink 1s step-end infinite; color: #00e07a; }
        .gradient-mask { mask-image: linear-gradient(to bottom, black 60%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 60%, transparent 100%); }
      `}</style>

      {/* ══════════ NAVIGATION ══════════ */}
      <nav className="fixed top-0 w-full z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-harbor-accent/20 border border-harbor-accent/40 flex items-center justify-center">
              <div className="w-3 h-3 rounded-sm bg-harbor-accent" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-harbor-accent">PILI</span>{' '}
              <span className="text-white">HARBOR</span>
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo('problema')} className="text-harbor-muted hover:text-white text-sm transition-colors duration-300">O Problema</button>
            <button onClick={() => scrollTo('como-funciona')} className="text-harbor-muted hover:text-white text-sm transition-colors duration-300">Como Funciona</button>
            <button onClick={() => scrollTo('funcionalidades')} className="text-harbor-muted hover:text-white text-sm transition-colors duration-300">Funcionalidades</button>
            <button onClick={() => scrollTo('precos')} className="text-harbor-muted hover:text-white text-sm transition-colors duration-300">Preços</button>
            <Link href="/login" className="px-6 py-2.5 bg-harbor-accent text-white text-sm font-semibold rounded-lg hover:bg-red-500 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20">
              Entrar
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-harbor-muted">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenu
                ? <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden px-6 pb-6 space-y-4 glass-strong">
            <button onClick={() => scrollTo('problema')} className="block text-harbor-muted hover:text-white text-sm">O Problema</button>
            <button onClick={() => scrollTo('como-funciona')} className="block text-harbor-muted hover:text-white text-sm">Como Funciona</button>
            <button onClick={() => scrollTo('funcionalidades')} className="block text-harbor-muted hover:text-white text-sm">Funcionalidades</button>
            <button onClick={() => scrollTo('precos')} className="block text-harbor-muted hover:text-white text-sm">Preços</button>
            <Link href="/login" className="block px-6 py-2.5 bg-harbor-accent text-white text-sm font-semibold rounded-lg text-center">Entrar</Link>
          </div>
        )}
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image with parallax */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?w=1920&q=80)',
            transform: `translateY(${scrollY * 0.3}px)`,
          }}
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#05080a]/80 via-[#05080a]/70 to-[#05080a]" />
        {/* Red accent gradient */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-harbor-accent/10 via-transparent to-transparent" />
        {/* Grain texture overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
              <div className="w-2 h-2 rounded-full bg-harbor-green pulse-dot" />
              <span className="text-xs text-harbor-muted font-mono tracking-wider uppercase">Plataforma IoT para Gestão de Pátios</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight mb-8">
              Cada container
              <br />
              no{' '}
              <span className="relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-harbor-green to-emerald-400">
                  lugar certo
                </span>
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-harbor-green to-transparent rounded-full" />
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-harbor-muted leading-relaxed mb-10 max-w-2xl">
              Localização em tempo real via rede mesh IoT, otimização de embarques com IA e app de navegação para operadores.
              <span className="text-harbor-text font-medium"> Tudo na nuvem.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link
                href="/login"
                className="group px-8 py-4 bg-harbor-green text-[#05080a] text-lg font-bold rounded-xl hover:bg-emerald-400 transition-all duration-300 hover:shadow-xl hover:shadow-harbor-green/20 flex items-center justify-center gap-2"
              >
                Acesse grátis
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <button
                onClick={() => scrollTo('como-funciona')}
                className="px-8 py-4 glass text-harbor-text text-lg font-semibold rounded-xl hover:bg-white/5 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5 text-harbor-accent" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Veja como funciona
              </button>
            </div>

            {/* Hero stats */}
            <div className="grid grid-cols-3 gap-6 max-w-lg">
              {[
                { value: '< 2m', label: 'Precisão de localização' },
                { value: '2s', label: 'Tempo de atualização' },
                { value: '100%', label: 'Cloud-native' },
              ].map((stat, i) => (
                <div key={i} className="text-center sm:text-left">
                  <div className="text-2xl md:text-3xl font-bold text-harbor-green font-mono">{stat.value}</div>
                  <div className="text-xs text-harbor-muted mt-1 leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-harbor-bg to-transparent" />
      </section>

      {/* ══════════ SOCIAL PROOF BAR ══════════ */}
      <section className="relative py-12 border-y border-harbor-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8" ref={counter1.ref}>
            {[
              { value: counter1.count, suffix: '%', label: 'Precisão de rastreio' },
              { value: counter2.count, suffix: '%', label: 'Redução de tempo' },
              { value: counter3.count, suffix: 's', label: 'Latência máxima' },
              { value: counter4.count, suffix: '+', label: 'Containers rastreados' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl md:text-5xl font-bold font-mono">
                  <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-harbor-muted">
                    {item.value}
                  </span>
                  <span className="text-harbor-green">{item.suffix}</span>
                </div>
                <div className="text-sm text-harbor-muted mt-2">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ PROBLEM ══════════ */}
      <section id="problema" className="relative py-32 overflow-hidden">
        {/* Subtle bg image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.06]"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-harbor-bg via-transparent to-harbor-bg" />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-harbor-accent/30 bg-harbor-accent/5 mb-6">
              <span className="text-xs text-harbor-accent font-semibold tracking-wider uppercase">O Problema</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Pátios industriais ainda operam
              <br />
              <span className="text-harbor-accent">no escuro</span>
            </h2>
            <p className="text-xl text-harbor-muted max-w-2xl mx-auto">
              Milhões em equipamentos e cargas valiosas gerenciados com prancheta, rádio e memória do operador.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
                title: 'Busca manual de containers',
                desc: 'Operadores perdem até 40% do turno procurando containers no pátio. Cada minuto de empilhadeira parada custa caro.',
                stat: '40%',
                statLabel: 'do turno desperdiçado',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Infraestrutura cara e frágil',
                desc: 'Soluções tradicionais exigem servidores locais, cabeamento dedicado e equipe de TI para manutenção constante.',
                stat: 'R$200k+',
                statLabel: 'custo de implantação',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Embarques atrasados',
                desc: 'Sem otimização de sequência, manifestos urgentes ficam parados. Um navio atrasado gera multas de milhares por hora.',
                stat: '3h+',
                statLabel: 'atraso médio por embarque',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="fade-up group glass rounded-2xl p-8 hover:border-harbor-accent/30 transition-all duration-500"
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className="text-harbor-accent mb-5 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-harbor-muted text-sm leading-relaxed mb-6">{item.desc}</p>
                <div className="pt-4 border-t border-harbor-border/50">
                  <span className="text-2xl font-bold text-harbor-accent font-mono">{item.stat}</span>
                  <span className="text-xs text-harbor-muted ml-2">{item.statLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="como-funciona" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-harbor-green/30 bg-harbor-green/5 mb-6">
              <span className="text-xs text-harbor-green font-semibold tracking-wider uppercase">Como Funciona</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Do pátio ao dashboard em
              <br />
              <span className="text-harbor-green">4 camadas</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-0">
            {[
              {
                step: '01',
                title: 'Placas IoT',
                desc: 'Módulos BLE ultra-low-power instalados nos containers. Bateria dura 5+ anos. Sem fios, sem manutenção.',
                icon: '📡',
              },
              {
                step: '02',
                title: 'Gateway Mesh',
                desc: 'Receptor na empilhadeira coleta sinais de todas as placas ao redor. Cobertura total por varredura do pátio.',
                icon: '🔗',
              },
              {
                step: '03',
                title: 'Cloud Processing',
                desc: 'Backend serverless triangula posições, atualiza o mapa e alimenta o histórico. Zero infra local.',
                icon: '☁️',
              },
              {
                step: '04',
                title: 'IA & Otimização',
                desc: 'Algoritmos analisam o manifesto, distribuem tarefas e geram rotas ótimas para cada empilhadeira.',
                icon: '🧠',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="fade-up relative group"
                style={{ transitionDelay: `${i * 200}ms` }}
              >
                {/* Connector line */}
                {i < 3 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-harbor-border to-harbor-border/0 z-0" />
                )}
                <div className="relative z-10 text-center px-6 py-8">
                  <div className="w-24 h-24 mx-auto rounded-2xl glass flex items-center justify-center mb-6 group-hover:border-harbor-green/40 transition-all duration-500">
                    <span className="text-4xl">{item.icon}</span>
                  </div>
                  <div className="text-harbor-green font-mono text-sm font-bold tracking-wider mb-3">{item.step}</div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-harbor-muted text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="funcionalidades" className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-harbor-green/[0.02] to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-harbor-green/30 bg-harbor-green/5 mb-6">
              <span className="text-xs text-harbor-green font-semibold tracking-wider uppercase">Funcionalidades</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Controle total do pátio,
              <br />
              <span className="text-harbor-green">em tempo real</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Mapa ao vivo',
                desc: 'Canvas interativo com posição de todos os containers e empilhadeiras. Zoom, filtros por status e busca por ID.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                ),
              },
              {
                title: 'App Waze para operadores',
                desc: 'Seta direcional gigante e distância. O operador só segue a seta. Próxima tarefa carrega automaticamente.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
              },
              {
                title: 'Otimização com IA',
                desc: 'Motor de inteligência artificial analisa o manifesto e gera a sequência ideal de coleta e posicionamento.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
              },
              {
                title: 'Filas inteligentes',
                desc: 'Cada empilhadeira recebe sua fila de tarefas em ordem de prioridade. Sem rádio, sem confusão, sem espera.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                ),
              },
              {
                title: 'Detecção de anomalias',
                desc: 'Container sem sinal, empilhadeira offline, prazo vencendo — alertas automáticos via push e Slack.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                ),
              },
              {
                title: 'KPIs e histórico',
                desc: 'Dashboards de produtividade por turno, operador e empilhadeira. Exportação CSV e integração via API REST.',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <div
                key={i}
                className="fade-up group glass rounded-2xl p-8 hover:border-harbor-green/30 transition-all duration-500 shimmer"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-harbor-green/10 border border-harbor-green/20 flex items-center justify-center text-harbor-green mb-5 group-hover:bg-harbor-green/20 group-hover:scale-110 transition-all duration-300">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                <p className="text-harbor-muted text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ OPERATOR APP MOCKUP ══════════ */}
      <section className="py-32 relative overflow-hidden">
        {/* Subtle forklift bg */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.05]"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-harbor-bg via-harbor-bg/95 to-harbor-bg" />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-harbor-accent/30 bg-harbor-accent/5 mb-6">
                <span className="text-xs text-harbor-accent font-semibold tracking-wider uppercase">App do Operador</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                O operador só precisa
                <br />
                ver a <span className="text-harbor-accent">seta</span>
              </h2>
              <p className="text-xl text-harbor-muted mb-8 leading-relaxed">
                App tipo Waze instalado no tablet da empilhadeira. Sem treinamento. A seta aponta pro container, a distância atualiza a cada 2 segundos.
              </p>
              <div className="space-y-4">
                {[
                  'PWA instalável em qualquer tablet',
                  'Funciona offline com sincronização automática',
                  'Fonte grande para leitura a distância',
                  'Próxima tarefa carrega automaticamente',
                  'Botão "Cheguei" com confirmação por proximidade',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-harbor-green/20 border border-harbor-green/40 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-harbor-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-harbor-muted text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="fade-up flex justify-center" style={{ transitionDelay: '200ms' }}>
              <div className="relative">
                {/* Glow effect behind phone */}
                <div className="absolute inset-0 blur-3xl bg-harbor-accent/10 rounded-full scale-75" />
                <div className="relative w-72 glass-strong rounded-[2.5rem] p-2 float">
                  <div className="bg-[#0a0f14] rounded-[2rem] p-6 min-h-[500px] flex flex-col">
                    {/* Status bar */}
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[10px] text-harbor-muted font-mono">09:41</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-2 rounded-sm border border-harbor-muted/50" />
                      </div>
                    </div>
                    {/* App header */}
                    <div className="text-center mb-2">
                      <span className="text-harbor-accent font-bold tracking-[0.3em] text-sm">EAZE</span>
                    </div>
                    <div className="text-center mb-6">
                      <span className="text-[10px] text-harbor-green font-mono">TAREFA ATIVA</span>
                    </div>
                    {/* Arrow compass */}
                    <div className="flex justify-center my-4">
                      <div className="relative">
                        <div className="absolute inset-0 blur-xl bg-harbor-accent/30 rounded-full" />
                        <svg viewBox="0 0 100 100" className="w-36 h-36 relative" style={{ animation: 'float 4s ease-in-out infinite' }}>
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#1a2332" strokeWidth="1" />
                          <circle cx="50" cy="50" r="35" fill="none" stroke="#1a2332" strokeWidth="0.5" strokeDasharray="4 4" />
                          <polygon points="50,12 62,65 50,55 38,65" fill="#ef4444" opacity="0.9" />
                          <circle cx="50" cy="50" r="4" fill="#ef4444" />
                        </svg>
                      </div>
                    </div>
                    {/* Distance */}
                    <div className="text-center mt-4 flex-1">
                      <div className="text-5xl font-bold font-mono text-white tracking-tight">12.4<span className="text-2xl text-harbor-muted">m</span></div>
                      <div className="text-harbor-muted text-xs mt-1 tracking-wider uppercase">distância</div>
                    </div>
                    {/* Container info */}
                    <div className="glass rounded-xl p-4 mt-4">
                      <div className="text-lg font-mono font-bold text-white text-center">MSCU1234567</div>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-harbor-muted">Destino</span>
                        <span className="text-xs text-harbor-green font-mono">Zona B-14</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-harbor-muted">Prioridade</span>
                        <span className="text-xs text-harbor-accent font-mono">ALTA</span>
                      </div>
                    </div>
                    {/* Action button */}
                    <button className="mt-4 w-full py-3 bg-harbor-green/20 border border-harbor-green/40 rounded-xl text-harbor-green font-bold text-sm">
                      CHEGUEI
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ AI TERMINAL DEMO ══════════ */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-harbor-green/30 bg-harbor-green/5 mb-6">
              <span className="text-xs text-harbor-green font-semibold tracking-wider uppercase">Inteligência Artificial</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              IA que economiza
              <br />
              <span className="text-harbor-green">horas por turno</span>
            </h2>
            <p className="text-xl text-harbor-muted max-w-2xl mx-auto">
              O motor de otimização analisa manifestos, posições e disponibilidade para gerar a melhor sequência de operações.
            </p>
          </div>

          {/* Terminal */}
          <div className="fade-up max-w-3xl mx-auto">
            <div className="glass-strong rounded-2xl overflow-hidden glow-green">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-6 py-4 border-b border-harbor-border/50">
                <div className="w-3 h-3 rounded-full bg-harbor-accent/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-harbor-green/70" />
                <span className="text-xs text-harbor-muted font-mono ml-4">pili-harbor — otimizador de embarques</span>
              </div>
              {/* Terminal body */}
              <div className="p-6 font-mono text-sm leading-loose">
                <div className="text-harbor-muted">
                  <span className="text-harbor-green">$</span> pili optimize --manifest &quot;Embarque MSC Diana&quot; --priority high
                </div>
                <div className="mt-4 space-y-1">
                  <div className="text-harbor-muted">Analisando manifesto...</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-harbor-green pulse-dot" />
                    <span className="text-harbor-green">Manifesto carregado: 34 containers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-harbor-green pulse-dot" />
                    <span className="text-harbor-green">Empilhadeiras disponíveis: 4</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-harbor-green pulse-dot" />
                    <span className="text-harbor-green">Posições mapeadas: 34/34</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-harbor-border/30">
                  <div className="text-white font-semibold mb-2">Resultado da otimização:</div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                    <div className="text-harbor-muted">Tempo estimado (IA):</div>
                    <div className="text-harbor-green font-bold">2h 14min</div>
                    <div className="text-harbor-muted">Tempo manual estimado:</div>
                    <div className="text-harbor-muted line-through">3h 50min</div>
                    <div className="text-harbor-muted">Movimentos eliminados:</div>
                    <div className="text-harbor-green">12 reposicionamentos</div>
                    <div className="text-harbor-muted">Economia de combustível:</div>
                    <div className="text-harbor-green">~38 litros</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-harbor-border/30 flex items-center justify-between">
                  <div>
                    <span className="text-harbor-green text-2xl font-bold">-41%</span>
                    <span className="text-harbor-muted ml-2">tempo total de operação</span>
                  </div>
                  <div className="px-3 py-1 rounded bg-harbor-green/10 border border-harbor-green/30 text-harbor-green text-xs font-bold">
                    OTIMIZADO
                  </div>
                </div>
                <div className="mt-4 text-harbor-muted cursor-blink">
                  <span className="text-harbor-green">$</span> _
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ PRICING ══════════ */}
      <section id="precos" className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-harbor-accent/[0.02] to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-harbor-accent/30 bg-harbor-accent/5 mb-6">
              <span className="text-xs text-harbor-accent font-semibold tracking-wider uppercase">Planos</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Invista em eficiência,
              <br />
              <span className="text-harbor-accent">não em infraestrutura</span>
            </h2>
            <p className="text-xl text-harbor-muted max-w-2xl mx-auto">
              Sem custo de instalação de servidores. Sem licenças perpétuas. Comece a rastrear em dias, não meses.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                name: 'Básico',
                price: 'R$ 990',
                period: '/mês',
                desc: 'Para pátios de pequeno porte que querem começar a rastrear.',
                features: [
                  '1 pátio',
                  'Até 300 containers',
                  '4 empilhadeiras',
                  'Mapa ao vivo',
                  'App do operador (EAZE)',
                  'Suporte por e-mail',
                ],
                popular: false,
                cta: 'Começar agora',
              },
              {
                name: 'Profissional',
                price: 'R$ 2.490',
                period: '/mês',
                desc: 'Para operações que precisam de IA e múltiplos pátios.',
                features: [
                  'Até 3 pátios',
                  'Containers ilimitados',
                  'Empilhadeiras ilimitadas',
                  'Otimização com IA',
                  'KPIs avançados e relatórios',
                  'Detecção de anomalias',
                  'API REST completa',
                  'Suporte prioritário',
                ],
                popular: true,
                cta: 'Começar agora',
              },
              {
                name: 'Enterprise',
                price: 'Sob consulta',
                period: '',
                desc: 'Para terminais portuários e grandes operações logísticas.',
                features: [
                  'Pátios ilimitados',
                  'SLA dedicado 99.9%',
                  'Integração ERP/TOS',
                  'SSO e RBAC avançado',
                  'Treinamento on-site',
                  'Suporte 24/7 com SLA',
                  'Ambiente dedicado',
                  'Consultoria de implantação',
                ],
                popular: false,
                cta: 'Falar com vendas',
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`fade-up relative rounded-2xl p-8 transition-all duration-500 ${
                  plan.popular
                    ? 'glass-strong border-harbor-green/40 glow-green scale-[1.02]'
                    : 'glass hover:border-harbor-border/80'
                }`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-harbor-green text-[#05080a] text-xs font-bold rounded-full tracking-wider uppercase">
                    Mais Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-harbor-muted mb-4">{plan.desc}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-harbor-muted text-sm">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm">
                      <svg className={`w-4 h-4 flex-shrink-0 ${plan.popular ? 'text-harbor-green' : 'text-harbor-muted'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-harbor-muted">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    plan.popular
                      ? 'bg-harbor-green text-[#05080a] hover:bg-emerald-400 hover:shadow-lg hover:shadow-harbor-green/20'
                      : 'glass hover:bg-white/5 text-harbor-text'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="relative py-32 overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1920&q=80)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-harbor-bg via-[#05080a]/85 to-harbor-bg" />
        <div className="absolute inset-0 bg-gradient-to-r from-harbor-accent/10 via-transparent to-harbor-green/10" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center fade-up">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Pronto para transformar
            <br />
            seu pátio?
          </h2>
          <p className="text-xl text-harbor-muted mb-10 max-w-2xl mx-auto leading-relaxed">
            Configure seu primeiro pátio em minutos. Sem cartão de crédito. Sem instalação de servidores. Comece a rastrear containers hoje.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="group px-10 py-5 bg-harbor-green text-[#05080a] text-lg font-bold rounded-xl hover:bg-emerald-400 transition-all duration-300 hover:shadow-xl hover:shadow-harbor-green/20 flex items-center justify-center gap-3"
            >
              Acesse grátis
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="mailto:contato@piliharbor.io"
              className="px-10 py-5 glass text-harbor-text text-lg font-semibold rounded-xl hover:bg-white/5 transition-all duration-300"
            >
              Agendar demonstração
            </a>
          </div>
          <p className="text-sm text-harbor-muted mt-8">
            Sem cartão de crédito &middot; Setup em 15 minutos &middot; Cancele quando quiser
          </p>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="py-16 border-t border-harbor-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-harbor-accent/20 border border-harbor-accent/40 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-sm bg-harbor-accent" />
                </div>
                <span className="text-xl font-bold tracking-tight">
                  <span className="text-harbor-accent">PILI</span>{' '}
                  <span className="text-white">HARBOR</span>
                </span>
              </div>
              <p className="text-harbor-muted text-sm leading-relaxed max-w-sm">
                Plataforma IoT cloud-native para gestão de pátios industriais. Localização em tempo real, otimização com IA e app de navegação para operadores.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4 tracking-wider uppercase">Produto</h4>
              <ul className="space-y-3">
                {['Funcionalidades', 'Preços', 'Documentação', 'API'].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-harbor-muted text-sm hover:text-white transition-colors duration-300">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-4 tracking-wider uppercase">Empresa</h4>
              <ul className="space-y-3">
                {['Sobre', 'Blog', 'Contato', 'Política de Privacidade'].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-harbor-muted text-sm hover:text-white transition-colors duration-300">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-harbor-border/30 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-harbor-muted text-sm">
              &copy; 2026 Pili Harbor. Todos os direitos reservados.
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-harbor-muted hover:text-white transition-colors duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.85.38-1.78.64-2.73.76 1-.6 1.76-1.54 2.12-2.67-.93.55-1.96.95-3.06 1.17a4.77 4.77 0 00-8.14 4.35C7.69 9.4 4.07 7.58 1.64 4.73a4.77 4.77 0 001.48 6.38c-.77-.02-1.5-.24-2.13-.59v.06a4.77 4.77 0 003.83 4.68c-.7.19-1.44.22-2.17.08a4.77 4.77 0 004.46 3.32A9.58 9.58 0 010 20.5a13.5 13.5 0 007.32 2.15c8.78 0 13.58-7.28 13.58-13.58 0-.21 0-.41-.01-.61A9.7 9.7 0 0024 4.56a9.53 9.53 0 01-2.54.7z" /></svg>
              </a>
              <a href="#" className="text-harbor-muted hover:text-white transition-colors duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016.02 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58A12.01 12.01 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
              </a>
              <a href="#" className="text-harbor-muted hover:text-white transition-colors duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.45 20.45H16.9v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 11-.01-4.12 2.06 2.06 0 01.01 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
