'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, CalendarDays, User, LogOut, Home, ListOrdered, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/matches', label: 'Wedstrijden', icon: CalendarDays },
  { href: '/ranking', label: 'Ranking', icon: ListOrdered },
  { href: '/profile', label: 'Profiel', icon: User },
]

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-background">
      {/* Top Navigation */}
      <nav className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Trophy className="h-7 w-7 text-accent" />
                <span className="font-bold text-xl tracking-tight">Tennis Ladder</span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden sm:flex sm:items-center gap-1">
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname === href
                      ? 'bg-primary-foreground/10 text-white'
                      : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-white'
                  )}
                >
                  {label}
                </Link>
              ))}
              <form action="/api/auth/sign-out" method="post" className="ml-4">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Uitloggen
                </button>
              </form>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md hover:bg-primary-foreground/10"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-primary-foreground/20 px-4 py-3 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-primary-foreground/10'
                    : 'text-primary-foreground/80 hover:bg-primary-foreground/10'
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}
            <form action="/api/auth/sign-out" method="post" className="pt-2 border-t border-primary-foreground/20">
              <button type="submit" className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-300 hover:bg-red-500/20">
                <LogOut className="h-5 w-5" />
                Uitloggen
              </button>
            </form>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 sm:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 w-full bg-white dark:bg-card border-t border-gray-200 dark:border-border z-40">
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full transition-colors',
                pathname === href
                  ? 'text-primary'
                  : 'text-gray-500 dark:text-muted-foreground hover:text-primary'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] mt-1 font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
