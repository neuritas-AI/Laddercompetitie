import Link from 'next/link'
import { Trophy, CalendarDays, User, LogOut, Menu, Home, ListOrdered } from 'lucide-react'

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-background">
      {/* Top Navigation */}
      <nav className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Trophy className="h-8 w-8 mr-2 text-accent" />
                <span className="font-bold text-xl tracking-tight">Tennis Ladder</span>
              </div>
            </div>
            {/* Desktop Menu */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
              <Link href="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/80">Dashboard</Link>
              <Link href="/matches" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/80">Wedstrijden</Link>
              <Link href="/ranking" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/80">Ranking</Link>
              <Link href="/profile" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/80">Profiel</Link>
              <form action="/auth/sign-out" method="post">
                <button type="submit" className="ml-4 px-3 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 text-white flex items-center">
                  <LogOut className="h-4 w-4 mr-1" />
                  Uitloggen
                </button>
              </form>
            </div>
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button className="p-2 rounded-md hover:bg-primary/80 focus:outline-none">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-16 sm:mb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation (PWA feel) */}
      <div className="sm:hidden fixed bottom-0 w-full bg-white dark:bg-card border-t border-gray-200 dark:border-border pb-safe">
        <div className="flex justify-around items-center h-16">
          <Link href="/dashboard" className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-primary dark:text-muted-foreground dark:hover:text-primary">
            <Home className="h-6 w-6" />
            <span className="text-[10px] mt-1 font-medium">Home</span>
          </Link>
          <Link href="/matches" className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-primary dark:text-muted-foreground dark:hover:text-primary">
            <CalendarDays className="h-6 w-6" />
            <span className="text-[10px] mt-1 font-medium">Wedstrijden</span>
          </Link>
          <Link href="/ranking" className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-primary dark:text-muted-foreground dark:hover:text-primary">
            <ListOrdered className="h-6 w-6" />
            <span className="text-[10px] mt-1 font-medium">Ranking</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-primary dark:text-muted-foreground dark:hover:text-primary">
            <User className="h-6 w-6" />
            <span className="text-[10px] mt-1 font-medium">Profiel</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
