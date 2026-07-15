'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Trophy, BarChart3, Users, LogOut, Menu, X,
  Shield, GitCommitHorizontal, CalendarClock, ListOrdered
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import Logo from '@/components/logo'

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin/competitions', label: 'Competities', icon: Trophy },
  { href: '/admin/poules', label: 'Poules', icon: ListOrdered },
  { href: '/admin/players', label: 'Spelers & Betalingen', icon: Users },
  { href: '/admin/teams', label: 'Dubbelteams', icon: GitCommitHorizontal },
  { href: '/admin/matches', label: 'Wedstrijden', icon: CalendarClock },
  { href: '/admin/administrators', label: 'Administrators', icon: Shield },
]

interface Props {
  children: React.ReactNode
  adminName: string
  adminEmail: string
}

export default function AdminLayoutClient({ children, adminName, adminEmail }: Props) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-background">
      {/* Sidebar – Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-950 text-white shrink-0 fixed inset-y-0 z-50">
        <div className="flex items-center h-16 px-5 border-b border-white/10 gap-3">
          <Logo size="sm" inverted />
          <span className="bg-red-600 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full mt-1">Admin</span>
        </div>
        <div className="px-2 py-1 mt-3 mb-1">
          <span className="text-[10px] uppercase tracking-widest text-white/30 px-3 font-semibold">TPA Beheer</span>
        </div>
        <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto">
          {adminNavItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive(href)
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <Shield className="w-8 h-8 p-1.5 bg-white/10 rounded-full text-white/70 shrink-0" />
            <div className="text-sm min-w-0">
              <p className="font-bold truncate">{adminName}</p>
              <p className="text-xs text-white/50 truncate">{adminEmail}</p>
            </div>
          </div>
          <form action="/api/auth/sign-out" method="post">
            <button type="submit" className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
              <LogOut className="h-4 w-4" />
              Uitloggen
            </button>
          </form>
          <p className="text-center text-[10px] text-white/30 font-medium pt-1">Powered by Neuritas-AI</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        <header className="md:hidden flex items-center justify-between bg-gray-950 text-white h-16 px-4 shrink-0 relative z-50">
          <div className="flex items-center gap-3">
            <Logo size="sm" inverted />
            <span className="bg-red-600 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-md hover:bg-white/10">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-900 text-white px-3 py-4 space-y-1 fixed top-16 left-0 right-0 z-40 shadow-xl border-b border-white/10">
            {adminNavItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium',
                  isActive(href) ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/10'
                )}>
                <Icon className="h-4 w-4" />{label}
              </Link>
            ))}
            <form action="/api/auth/sign-out" method="post" className="pt-2 border-t border-white/10 mt-2">
              <button type="submit" className="flex w-full items-center gap-3 px-3 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg">
                <LogOut className="h-4 w-4" />Uitloggen
              </button>
            </form>
            <p className="text-center text-[10px] text-white/30 font-medium pt-2">Powered by Neuritas-AI</p>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-background min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
