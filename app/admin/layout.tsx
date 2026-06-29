'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, BarChart3, Users, Calendar, Settings, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin/competitions', label: 'Competities', icon: Trophy },
  { href: '/admin/users', label: 'Spelers', icon: Users },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-background">
      {/* Sidebar – Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-white shrink-0">
        <div className="flex items-center gap-2 h-16 px-6 border-b border-gray-800">
          <Trophy className="h-6 w-6 text-accent" />
          <span className="font-bold text-lg tracking-tight">Admin</span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {adminNavItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <form action="/api/auth/sign-out" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Uitloggen
            </button>
          </form>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between bg-gray-900 text-white h-16 px-4 shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-accent" />
            <span className="font-bold">Admin</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md hover:bg-gray-700"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-800 text-white px-4 py-3 space-y-1">
            {adminNavItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700"
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}
            <form action="/api/auth/sign-out" method="post" className="pt-2 border-t border-gray-700">
              <button type="submit" className="flex w-full items-center gap-3 px-3 py-2 text-sm text-red-400">
                <LogOut className="h-5 w-5" />
                Uitloggen
              </button>
            </form>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
