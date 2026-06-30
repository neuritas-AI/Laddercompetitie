'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { Bell, Check, Trash2, Clock, CalendarDays, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { markAsRead, markAllAsRead, deleteNotification } from '@/app/actions/notifications'
import Link from 'next/link'

export type NotificationType = {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  link_url?: string
  created_at: string
}

export default function NotificationsDropdown({ notifications }: { notifications: NotificationType[] }) {
  const [open, setOpen] = useState(false)
  const [localNotifications, setLocalNotifications] = useState(notifications)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  // Sync when server re-renders with fresh data
  useEffect(() => {
    setLocalNotifications(notifications)
  }, [notifications])

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const unreadCount = localNotifications.filter(n => !n.is_read).length

  const handleMarkAsRead = (id: string) => {
    setLocalNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    startTransition(async () => {
      await markAsRead(id)
    })
  }

  const handleMarkAllAsRead = () => {
    setLocalNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    startTransition(async () => {
      await markAllAsRead()
    })
  }

  const handleDelete = (id: string) => {
    setLocalNotifications(prev => prev.filter(n => n.id !== id))
    startTransition(async () => {
      await deleteNotification(id)
    })
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'match_tomorrow':
      case 'match_today':
      case 'match_scheduled':
        return <CalendarDays className="w-4 h-4 text-blue-500" />
      case 'score_entered':
        return <Trophy className="w-4 h-4 text-green-500" />
      default:
        return <Bell className="w-4 h-4 text-primary" />
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors shrink-0"
        aria-label="Meldingen"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#121212]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-[200]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/50">
            <h3 className="font-bold text-sm text-foreground">Meldingen</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isPending}
                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
              >
                Alles gelezen
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[400px] overflow-y-auto">
            {localNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Bell className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm font-medium">Je hebt geen nieuwe meldingen</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {localNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex p-4 gap-3 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                  >
                    {/* Icon */}
                    <div className="shrink-0 mt-0.5">
                      <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center">
                        {getIcon(n.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {n.link_url ? (
                        <Link
                          href={n.link_url}
                          onClick={() => { handleMarkAsRead(n.id); setOpen(false) }}
                          className="font-semibold text-sm hover:underline hover:text-primary leading-tight block mb-1"
                        >
                          {n.title}
                        </Link>
                      ) : (
                        <p className="font-semibold text-sm leading-tight mb-1">{n.title}</p>
                      )}
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(n.created_at).toLocaleDateString('nl-BE')} om{' '}
                          {new Date(n.created_at).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="flex gap-1">
                          {!n.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(n.id)}
                              className="h-6 w-6 flex items-center justify-center rounded-full text-primary hover:bg-primary/10 transition-colors"
                              title="Markeer als gelezen"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(n.id)}
                            className="h-6 w-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Verwijderen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
