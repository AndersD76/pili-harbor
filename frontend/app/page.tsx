'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
          }
        })
      },
      { threshold: 0.1 }
    )
    document.querySelectorAll('.fade-up').forEach((el) => observerRef.current?.observe(el))
    return () => observerRef.current?.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-harbor-bg text-harbor-text overflow-x-hidden">
      <style jsx global>{`
        .fade-up { opacity: 0; transform: translateY(30px); transition: all 0.7s ease-out; }
        .animate-in { opacity: 1 !important; transform: translateY(0) !important; }
        .glow { box-shadow: 0 0 60px rgba(0, 224, 122, 0.15); }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
        @keyframes move-forklift { 0% { transform: translateX(0); } 50% { transform: translateX(40px); } 100% { transform: translateX(0); } }
        .move-forklift { animation: move-forklift 4s ease-in-out infinite; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .float { animation: float 3s ease-in-out infinite; }
      `}</style>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-harbor-bg/80 backdrop-blur-md border-b border-harbor-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold">
            <span className="text-harbor-accent">PILI</span> <span className="text-white">HARBOR</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#funcionalidades" className="text-harbor-muted hover:text-white text-sm hidden md:block">Funcionalidades</a>
            <a href="#precos" className="text-harbor-muted hover:text-white text-sm hidden md:block">Preços</a>
            <Link href="/login" className="px-5 py-2 bg-harbor-accent text-white text-sm font-semibold rounded hover:bg-red-600 transition">
              Entrar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Cada container<br />no <span className="text-[#00e07a]">lugar certo</span>
            </h1>
            <p className="text-harbor-muted text-lg mb-8 leading-relaxed">
              SaaS cloud-native para pátios industriais. Localização em tempo real via rede mesh IoT e otimização de carga com IA.
            </p>
            <div className="flex gap-4 mb-10">
              <a href="#precos" className="px-6 py-3 bg-harbor-accent text-white font-semibold rounded-lg hover:bg-red-600 transition">
                Ver planos
              </a>
              <a href="#como-funciona" className="px-6 py-3 border border-harbor-border text-harbor-text rounded-lg hover:border-harbor-muted transition">
                Como funciona
              </a>
            </div>
            <div className="flex gap-8 text-sm">
              <div><span className="text-[#00e07a] font-bold text-xl">&lt;2m</span><br /><span className="text-harbor-muted">precisão</span></div>
              <div><span className="text-[#00e07a] font-bold text-xl">2s</span><br /><span className="text-harbor-muted">atualização</span></div>
              <div><span className="text-[#00e07a] font-bold text-xl">100%</span><br /><span className="text-harbor-muted">na nuvem</span></div>
            </div>
          </div>
          {/* Mock Dashboard */}
          <div className="bg-harbor-surface border border-harbor-border rounded-xl p-4 glow">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-harbor-accent"></div>
              <span className="text-xs text-harbor-muted font-mono">PÁTIO A — AO VIVO</span>
              <div className="w-2 h-2 rounded-full bg-[#00e07a] pulse-dot ml-auto"></div>
            </div>
            <svg viewBox="0 0 400 220" className="w-full">
              <rect x="10" y="10" width="380" height="200" fill="#0a0f14" stroke="#1a2332" rx="4" />
              {/* Grid */}
              {[60, 110, 160, 210, 260, 310, 360].map((x) => (
                <line key={`gv${x}`} x1={x} y1="10" x2={x} y2="210" stroke="#111820" strokeWidth="0.5" />
              ))}
              {[50, 90, 130, 170].map((y) => (
                <line key={`gh${y}`} x1="10" y1={y} x2="390" y2={y} stroke="#111820" strokeWidth="0.5" />
              ))}
              {/* Containers */}
              {[
                { x: 40, y: 30, c: '#00e07a' }, { x: 40, y: 55, c: '#00e07a' }, { x: 40, y: 80, c: '#00e07a' },
                { x: 120, y: 30, c: '#00e07a' }, { x: 120, y: 55, c: '#facc15' }, { x: 120, y: 80, c: '#00e07a' },
                { x: 200, y: 30, c: '#00e07a' }, { x: 200, y: 55, c: '#00e07a' }, { x: 200, y: 80, c: '#ef4444' },
                { x: 280, y: 30, c: '#00e07a' }, { x: 280, y: 55, c: '#00e07a' },
                { x: 40, y: 130, c: '#00e07a' }, { x: 40, y: 155, c: '#facc15' },
                { x: 120, y: 130, c: '#00e07a' }, { x: 120, y: 155, c: '#00e07a' }, { x: 120, y: 180, c: '#00e07a' },
                { x: 200, y: 130, c: '#00e07a' }, { x: 200, y: 155, c: '#00e07a' },
                { x: 280, y: 130, c: '#00e07a' }, { x: 280, y: 155, c: '#00e07a' }, { x: 280, y: 180, c: '#00e07a' },
              ].map((ct, i) => (
                <rect key={i} x={ct.x} y={ct.y} width="50" height="18" rx="2" fill={ct.c + '20'} stroke={ct.c} strokeWidth="0.8" />
              ))}
              {/* Forklifts */}
              <g className="move-forklift">
                <polygon points="170,100 180,92 180,108" fill="#facc1540" stroke="#facc15" strokeWidth="1.5" />
                <text x="182" y="104" fontSize="7" fill="#facc15" fontFamily="monospace">EMP-01</text>
              </g>
              <g className="move-forklift" style={{ animationDelay: '2s' }}>
                <polygon points="310,160 320,152 320,168" fill="#3b82f640" stroke="#3b82f6" strokeWidth="1.5" />
                <text x="322" y="164" fontSize="7" fill="#3b82f6" fontFamily="monospace">EMP-02</text>
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* Problema */}
      <section className="py-20 px-6 border-t border-harbor-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 fade-up">O problema dos pátios hoje</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Busca manual', desc: 'Operadores perdem até 40% do turno procurando containers no pátio.' },
              { title: 'Infra cara e frágil', desc: 'Soluções tradicionais exigem servidores locais, cabos e manutenção constante.' },
              { title: 'Embarques atrasados', desc: 'Sem otimização, manifestos urgentes ficam parados por falta de sequenciamento.' },
            ].map((item, i) => (
              <div key={i} className="fade-up bg-harbor-surface border border-harbor-border rounded-xl p-6" style={{ transitionDelay: `${i * 150}ms` }}>
                <h3 className="text-lg font-semibold text-harbor-accent mb-2">{item.title}</h3>
                <p className="text-harbor-muted text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="py-20 px-6 border-t border-harbor-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 fade-up">Como funciona</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Placas IoT', desc: 'Instaladas nos containers, comunicam via mesh.' },
              { step: '02', title: 'Gateway', desc: 'Na empilhadeira, coleta sinais das placas.' },
              { step: '03', title: 'Cloud', desc: 'Backend na nuvem processa e posiciona tudo.' },
              { step: '04', title: 'IA', desc: 'Distribui e otimiza as tarefas automaticamente.' },
            ].map((item, i) => (
              <div key={i} className="fade-up text-center" style={{ transitionDelay: `${i * 150}ms` }}>
                <div className="text-[#00e07a] font-mono text-3xl font-bold mb-3">{item.step}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-harbor-muted text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="py-20 px-6 border-t border-harbor-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 fade-up">Funcionalidades</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Mapa ao vivo', desc: 'Veja todos os containers e empilhadeiras em tempo real no canvas interativo.' },
              { title: 'App Waze para operadores', desc: 'Seta direcional e distância. O operador só segue a seta.' },
              { title: 'Otimização com IA', desc: 'Claude analisa o manifesto e gera a sequência ideal de tarefas.' },
              { title: 'Filas inteligentes', desc: 'Cada empilhadeira recebe sua fila de tarefas em ordem de prioridade.' },
              { title: 'Detecção de anomalias', desc: 'Container sem sinal, empilhadeira offline, prazo vencendo — tudo alertado.' },
              { title: 'KPIs e histórico', desc: 'Métricas do turno, eficiência por operador, tempo médio de operação.' },
            ].map((item, i) => (
              <div key={i} className="fade-up bg-harbor-surface border border-harbor-border rounded-xl p-6" style={{ transitionDelay: `${i * 100}ms` }}>
                <h3 className="text-lg font-semibold text-[#00e07a] mb-2">{item.title}</h3>
                <p className="text-harbor-muted text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App do operador */}
      <section className="py-20 px-6 border-t border-harbor-border">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="fade-up">
            <h2 className="text-3xl font-bold mb-6">O operador só precisa<br />ver a <span className="text-harbor-accent">seta</span></h2>
            <p className="text-harbor-muted text-lg mb-6 leading-relaxed">
              App tipo Waze instalado no tablet da empilhadeira. Sem treinamento.
              A seta aponta pro container, a distância atualiza a cada 2 segundos.
              Chegou perto? O botão "Cheguei" aparece.
            </p>
            <ul className="space-y-3 text-harbor-muted">
              <li>✓ PWA instalável no tablet</li>
              <li>✓ Funciona offline</li>
              <li>✓ Fonte grande para leitura a distância</li>
              <li>✓ Próxima tarefa carrega automaticamente</li>
            </ul>
          </div>
          {/* Phone mockup */}
          <div className="fade-up flex justify-center">
            <div className="w-64 bg-harbor-surface border-2 border-harbor-border rounded-3xl p-6 float">
              <div className="text-center mb-4">
                <span className="text-harbor-accent font-bold tracking-widest">EAZE</span>
              </div>
              <div className="flex justify-center my-6">
                <svg viewBox="0 0 100 100" className="w-32 h-32" style={{ animation: 'spin 8s linear infinite' }}>
                  <polygon points="50,15 65,70 50,60 35,70" fill="#ef4444" stroke="#ef4444" strokeWidth="1" />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold font-mono text-harbor-text">12.4m</div>
                <div className="text-harbor-muted text-sm mt-1">distância</div>
                <div className="text-xl font-mono text-harbor-text mt-4">MSCU1234567</div>
                <div className="text-[#00e07a] text-sm mt-1">→ Zona B-14</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IA */}
      <section className="py-20 px-6 border-t border-harbor-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 fade-up">IA que economiza horas</h2>
          <div className="fade-up max-w-2xl mx-auto bg-harbor-surface border border-harbor-border rounded-xl p-6 font-mono text-sm">
            <div className="text-harbor-muted mb-2">$ pili optimize --manifest "Embarque MSC Diana"</div>
            <div className="text-[#00e07a]">✓ Manifesto: 34 containers</div>
            <div className="text-[#00e07a]">✓ Empilhadeiras: 4 disponíveis</div>
            <div className="text-harbor-text mt-2">Otimização concluída:</div>
            <div className="text-harbor-text">  Tempo estimado: <span className="text-[#00e07a]">2h14min</span></div>
            <div className="text-harbor-text">  Tempo manual:   <span className="text-harbor-muted">3h50min</span></div>
            <div className="text-[#00e07a] mt-2 text-lg">  Economia: 41% ↓</div>
          </div>
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="py-20 px-6 border-t border-harbor-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 fade-up">Planos</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Básico', price: 'R$ 990', period: '/mês', features: ['1 pátio', 'Até 300 containers', '4 empilhadeiras', 'Mapa ao vivo', 'App do operador'], popular: false },
              { name: 'Profissional', price: 'R$ 2.490', period: '/mês', features: ['Até 3 pátios', 'Containers ilimitados', 'Empilhadeiras ilimitadas', 'Otimização com IA', 'KPIs avançados'], popular: true },
              { name: 'Enterprise', price: 'Sob consulta', period: '', features: ['Pátios ilimitados', 'SLA dedicado', 'Integração ERP', 'Treinamento on-site', 'Suporte 24/7'], popular: false },
            ].map((plan, i) => (
              <div key={i} className={`fade-up rounded-xl p-6 border ${plan.popular ? 'border-[#00e07a] bg-harbor-surface glow' : 'border-harbor-border bg-harbor-surface'}`} style={{ transitionDelay: `${i * 150}ms` }}>
                {plan.popular && <div className="text-[#00e07a] text-xs font-bold mb-2 tracking-widest">POPULAR</div>}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-harbor-muted">{plan.period}</span>
                </div>
                <ul className="space-y-2 text-sm text-harbor-muted">
                  {plan.features.map((f, j) => (
                    <li key={j}>✓ {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-harbor-border text-center">
        <div className="fade-up">
          <h2 className="text-3xl font-bold mb-4">Veja o PILI HARBOR ao vivo</h2>
          <p className="text-harbor-muted mb-8">Agende uma demonstração com dados reais do seu pátio</p>
          <a href="mailto:contato@piliharbor.io" className="inline-block px-8 py-4 bg-harbor-accent text-white text-lg font-bold rounded-lg hover:bg-red-600 transition">
            Agendar demonstração
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-harbor-border text-center">
        <div className="text-harbor-accent font-bold">PILI <span className="text-white">HARBOR</span></div>
        <div className="text-harbor-muted text-sm mt-2">piliharbor.io — © 2026</div>
      </footer>
    </div>
  )
}
