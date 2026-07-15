'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, User, LogOut, Home, ListOrdered, ChevronDown, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import Logo from '@/components/logo'
import NotificationsDropdown, { NotificationType } from '@/components/notifications-dropdown'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/competitions', label: 'Competities', icon: Trophy },
  { href: '/matches', label: 'Wedstrijden', icon: CalendarDays },
  { href: '/ranking', label: 'Rangschikking', icon: ListOrdered },
  { href: '/profile', label: 'Profiel', icon: User },
]

interface PlayerLayoutClientProps {
  children: React.ReactNode
  displayName: string
  avatarUrl: string | null
  pouleLabel: string | null
  notifications?: NotificationType[]
}

export default function PlayerLayoutClient({
  children,
  displayName,
  avatarUrl,
  pouleLabel,
  notifications = [],
}: PlayerLayoutClientProps) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[280px] flex-col bg-mockup-sidebar text-white shadow-xl fixed inset-y-0 z-50">
        <div className="p-8 flex items-center justify-center">
          <Logo size="lg" inverted />
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all',
                  isActive
                    ? 'bg-primary text-white shadow-soft-red'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-white/70")} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User Card */}
        <div className="p-4">
          <div className="bg-black/20 rounded-[1.5rem] p-4 flex flex-col gap-4 border border-white/10 backdrop-blur-sm">
            <Link href="/profile" className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-white/70" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{displayName}</p>
                  {pouleLabel && (
                    <p className="text-[10px] text-white/60 tracking-wider uppercase font-semibold">{pouleLabel}</p>
                  )}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-white/50 group-hover:text-white transition-colors" />
            </Link>

            <form action="/api/auth/sign-out" method="post">
              <button type="submit" className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors w-full">
                <LogOut className="h-4 w-4" />
                Uitloggen
              </button>
            </form>
          </div>
          <p className="text-center text-[10px] text-white/50 font-medium pt-3">Powered by Neuritas-AI</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-[280px] flex flex-col min-w-0">
        {/* Top bar with notifications */}
        <div className="hidden lg:flex items-center justify-end px-8 pt-6 pb-0 max-w-6xl mx-auto w-full">
          <NotificationsDropdown notifications={notifications} variant="light" />
        </div>

        <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-8 lg:p-10 pt-20 sm:pt-24 lg:pt-10 pb-28 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full bg-mockup-sidebar z-40 px-4 py-3 flex items-center justify-between shadow-md">
        <form action="/api/auth/sign-out" method="post">
          <button
            type="submit"
            aria-label="Uitloggen"
            title="Uitloggen"
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </form>
        <Logo size="sm" inverted />
        <NotificationsDropdown notifications={notifications} variant="dark" />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 w-full bg-white dark:bg-card border-t border-border z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.05)] px-2 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center w-full h-full gap-1 transition-all',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-all",
                  isActive ? "bg-primary/10" : "bg-transparent"
                )}>
                  <Icon className={cn("h-5 w-5", isActive ? "text-primary fill-primary/20" : "")} />
                </div>
                <span className={cn(
                  "text-[10px] font-bold tracking-tight transition-colors",
                  isActive ? "text-primary" : ""
                )}>{label}</span>
              </Link>
            )
          })}
        </div>
        <p className="text-center text-[9px] text-muted-foreground/60 font-medium pb-1">Powered by Neuritas-AI</p>
      </div>
    </div>
  )
}
