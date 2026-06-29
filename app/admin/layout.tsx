import Link from 'next/link'
import { Settings, Users, Trophy, BarChart3, LogOut, Menu, MenuSquare } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-background">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-white">
        <div className="flex items-center justify-center h-16 border-b border-gray-800">
          <Trophy className="h-6 w-6 text-accent mr-2" />
          <span className="font-bold text-lg">Admin Panel</span>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            <Link href="/admin/dashboard" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md bg-gray-800 text-white">
              <BarChart3 className="mr-3 flex-shrink-0 h-5 w-5 text-gray-300" />
              Dashboard
            </Link>
            <Link href="/admin/competitions" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white">
              <Trophy className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
              Competities
            </Link>
            <Link href="/admin/users" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white">
              <Users className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
              Spelers
            </Link>
            <Link href="/admin/settings" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white">
              <Settings className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
              Instellingen
            </Link>
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-800 p-4">
          <form action="/auth/sign-out" method="post" className="w-full">
            <button type="submit" className="flex-shrink-0 w-full group block">
              <div className="flex items-center text-red-400 hover:text-red-300">
                <LogOut className="inline-block h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Uitloggen</span>
              </div>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between bg-gray-900 text-white h-16 px-4">
          <div className="flex items-center">
            <Trophy className="h-6 w-6 text-accent mr-2" />
            <span className="font-bold text-lg">Admin</span>
          </div>
          <button className="p-2 rounded-md hover:bg-gray-800 focus:outline-none">
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
