'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/api'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '◉' },
  { label: 'Tarefas', href: '/dashboard/tasks', icon: '☰' },
  { label: 'Manifestos', href: '/dashboard/manifests', icon: '📋' },
  { label: 'Empilhadeiras', href: '/dashboard/forklifts', icon: '🏗' },
  { label: 'Configurações', href: '/dashboard/settings', icon: '⚙' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex bg-harbor-bg">
      {/* Sidebar */}
      <aside className="w-60 bg-harbor-surface border-r border-harbor-border flex flex-col">
        <div className="p-4 border-b border-harbor-border">
          <h1 className="text-xl font-bold text-harbor-accent tracking-wider">PILI HARBOR</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-harbor-accent/10 text-harbor-accent'
                  : 'text-harbor-muted hover:text-harbor-text hover:bg-harbor-border/30'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-harbor-border">
          <button
            onClick={logout}
            className="w-full px-3 py-2 text-sm text-harbor-muted hover:text-harbor-accent transition-colors text-left"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
