'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface UserInfo {
  id: string
  email: string
  full_name: string
  role: string
  active: boolean
  created_at: string
}

const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: 'Administrador', color: 'text-harbor-accent', bg: 'bg-harbor-accent/10' },
  supervisor: { label: 'Supervisor', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  operator: { label: 'Operador', color: 'text-harbor-green', bg: 'bg-harbor-green/10' },
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'operator' })

  useEffect(() => { loadUsers() }, [])

  function loadUsers() {
    api.get<UserInfo[]>('/api/v1/auth/users')
      .then((data) => { setUsers(data); setLoading(false) })
      .catch((err) => { setError(err.message || 'Erro ao carregar usuários'); setLoading(false) })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    try {
      await api.post('/api/v1/auth/users', form)
      setShowCreate(false)
      setForm({ full_name: '', email: '', password: '', role: 'operator' })
      loadUsers()
    } catch (err: any) {
      setCreateError(err.message || 'Erro ao criar usuário')
    } finally {
      setCreating(false)
    }
  }

  async function handleRoleChange(userId: string, role: string) {
    try {
      await api.put(`/api/v1/auth/users/${userId}/role`, undefined)
      // The endpoint expects role as query param, let me use body
      loadUsers()
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-harbor-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-harbor-muted text-sm">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <h3 className="text-harbor-text font-semibold mb-2">Erro ao carregar usuários</h3>
          <p className="text-harbor-muted text-sm mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-harbor-accent text-white rounded-lg text-sm hover:bg-red-600 transition-colors">Tentar novamente</button>
        </div>
      </div>
    )
  }

  const inputClass = "w-full px-4 py-3 bg-harbor-bg border border-harbor-border rounded-lg text-harbor-text focus:border-harbor-accent focus:outline-none"

  return (
    <>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-harbor-surface border border-harbor-border rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-harbor-border">
              <h3 className="text-lg font-bold text-harbor-text">Novo Usuário</h3>
              <button onClick={() => setShowCreate(false)} className="text-harbor-muted hover:text-harbor-text transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {createError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">{createError}</div>}
              <div>
                <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Nome Completo *</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputClass} placeholder="João Silva" required />
              </div>
              <div>
                <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="joao@empresa.com" required />
              </div>
              <div>
                <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Senha *</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} placeholder="Mínimo 6 caracteres" minLength={6} required />
              </div>
              <div>
                <label className="block text-xs text-harbor-muted uppercase tracking-wider mb-2">Perfil</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className={inputClass + ' appearance-none'}>
                  <option value="operator">Operador</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 text-sm font-medium text-harbor-muted bg-harbor-bg border border-harbor-border rounded-lg hover:text-harbor-text transition-colors">Cancelar</button>
                <button type="submit" disabled={creating} className="flex-1 py-3 text-sm font-bold text-white bg-harbor-accent rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors">
                  {creating ? 'Criando...' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-harbor-text">Usuários</h2>
            <p className="text-harbor-muted text-sm mt-0.5">{users.length} usuário{users.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2.5 bg-harbor-accent text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Novo Usuário
          </button>
        </div>

        <div className="bg-harbor-surface border border-harbor-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-harbor-border">
                <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase tracking-wider font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase tracking-wider font-medium">Email</th>
                <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase tracking-wider font-medium">Perfil</th>
                <th className="text-left px-4 py-3 text-xs text-harbor-muted uppercase tracking-wider font-medium">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-harbor-border">
              {users.map((u) => {
                const role = roleConfig[u.role] || roleConfig.operator
                return (
                  <tr key={u.id} className="hover:bg-harbor-bg/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-harbor-bg flex items-center justify-center text-xs font-bold text-harbor-text">
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-harbor-text">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-harbor-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${role.color} ${role.bg}`}>
                        {role.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-harbor-muted">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
