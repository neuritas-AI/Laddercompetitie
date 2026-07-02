'use client'

import { useState, useTransition, useEffect } from 'react'
import { formatDateInBrussels } from '@/lib/brussels'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, MapPin, Clock, CheckCircle2, AlertCircle, PenSquare, ArrowLeft, MoreVertical, X } from 'lucide-react'
import ScoreForm from '@/components/score-form'

type Tab = 'upcoming' | 'confirm' | 'past'

interface Match {
  id: string
  scheduled_date: string | null
  location: string | null
  status: string
  score_player1: string | null
  score_player2: string | null
  winner_id: string | null
  player1_id: string
  player2_id: string
  player1: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null
  player2: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null
  poule: { name: string } | null
}

interface Props {
  upcoming: Match[]
  past: Match[]
  userId: string
  pouleName: string | null
  hasCompetition: boolean
}

export default function MatchesClient({ upcoming, past, userId, pouleName, hasCompetition }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('upcoming')
  const [confirmMatches, setConfirmMatches] = useState<Match[]>([])
  const [loadingConfirm, setLoadingConfirm] = useState(false)
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null)
  const [showScore, setShowScore] = useState(false)
  const [scoreMatchId, setScoreMatchId] = useState<string | null>(null)
  const [scoreOpponent, setScoreOpponent] = useState('')
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleMatchId, setScheduleMatchId] = useState<string | null>(null)
  const [scheduleData, setScheduleData] = useState({ date: '', time: '', location: '' })
  const [scheduling, setScheduling] = useState(false)
  const [scheduledIds, setScheduledIds] = useState<Set<string>>(new Set())
  const [scheduleError, setScheduleError] = useState('')

  const getOpponent = (match: Match) => {
    const isPlayer1 = match.player1_id === userId
    const opp = isPlayer1 ? match.player2 : match.player1
    if (!opp) return { name: 'Tegenstander', avatar: null, phone: null, sharePhone: false }
    const name = `${opp.first_name || ''} ${opp.last_name || ''}`.trim() || 'Tegenstander'
    return { name, avatar: opp.avatar_url, phone: (opp as any).phone, sharePhone: (opp as any).share_phone }
  }

  const formatDate = (d: string | null) => {
    if (!d) return null
    return formatDateInBrussels(d, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
  }

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    setScheduleError('')
    setScheduling(true)
    try {
      const res = await fetch('/api/matches/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: scheduleMatchId, ...scheduleData }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fout bij plannen')
      setScheduledIds(prev => new Set([...prev, scheduleMatchId!]))
      setShowSchedule(false)
    } catch (err: any) {
      setScheduleError(err.message)
    } finally {
      setScheduling(false)
    }
  }

  if (showScore && scoreMatchId) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <button 
          onClick={() => setShowScore(false)} 
          className="flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border shadow-sm w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Terug naar overzicht
        </button>
        <ScoreForm matchId={scoreMatchId} opponent={scoreOpponent} competition={pouleName ?? ''} />
      </div>
    )
  }

  const renderMatchRow = (match: Match) => {
    const { name: oppName, avatar: oppAvatar, phone, sharePhone } = getOpponent(match)
    const isPlayer1 = match.player1_id === userId
    const myScore = isPlayer1 ? match.score_player1 : match.score_player2
    const oppScore = isPlayer1 ? match.score_player2 : match.score_player1
    const won = match.winner_id === userId
    const isScheduled = match.scheduled_date != null || scheduledIds.has(match.id)
    const isPendingConfirmation = match.status === 'played'
    const isConfirmed = match.status === 'confirmed'
    const isDisputed = match.status === 'disputed'
    const isPast = isConfirmed || isPendingConfirmation || isDisputed
    const poule = (match.poule as any)?.name ?? pouleName ?? ''

    const statusBadge = isConfirmed
      ? { label: 'Bevestigd', className: 'text-green-600 bg-green-100' }
      : isPendingConfirmation
      ? { label: 'Wacht op bevestiging', className: 'text-orange-700 bg-orange-100' }
      : isDisputed
      ? { label: 'Betwist', className: 'text-red-600 bg-red-100' }
      : null

    return (
      <div key={match.id} className="p-4 rounded-xl transition-colors hover:bg-muted/10 relative">
        <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden shrink-0 shadow-inner">
              {oppAvatar ? (
                <img src={oppAvatar} alt={oppName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 font-black text-xl">{oppName.charAt(0)}</div>
              )}
            </div>
            <div>
              <p className="font-black text-lg text-foreground">{oppName}</p>
              <div className="flex flex-col gap-0.5 mt-0.5">
                <p className="text-xs text-muted-foreground font-bold tracking-wider uppercase">{poule}</p>
                {sharePhone ? (
                  <p className="text-xs text-primary font-medium">{phone || 'Geen nummer'}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Nummer niet gedeeld</p>
                )}
              </div>
            </div>
          </div>

          {!isPast && (
            <div className="flex gap-2">
              {isScheduled ? (
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1.5 rounded-full">
                  <Calendar className="w-4 h-4" /> {formatDate(match.scheduled_date)}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-yellow-600 bg-yellow-100 px-3 py-1.5 rounded-full">
                  <AlertCircle className="w-4 h-4" /> Te plannen
                </div>
              )}
            </div>
          )}

          {isPast && (
            <div className="flex flex-col items-center">
              <p className="font-black text-2xl">{myScore ?? '?'} – {oppScore ?? '?'}</p>
              {statusBadge ? (
                <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full mt-1 ${statusBadge.className}`}>
                  {statusBadge.label}
                </span>
              ) : (
                <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full mt-1 ${won ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                  {won ? 'Winst' : 'Verlies'}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mt-2 sm:mt-0">
            {!isPast && !isScheduled && (
              <Button onClick={() => { setScheduleMatchId(match.id); setShowSchedule(true) }} className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-sm">
                Plan datum
              </Button>
            )}
            {!isPast && (
              <Button variant="outline" onClick={() => { setScoreMatchId(match.id); setScoreOpponent(oppName); setShowScore(true) }} className="border-2 font-bold rounded-xl hover:bg-muted/50">
                <PenSquare className="w-4 h-4 mr-2" /> Score
              </Button>
            )}
            {isPendingConfirmation && (
              <a
                href={`/matches/redirect/${match.id}/confirm`}
                className="inline-flex items-center justify-center rounded-xl border border-primary px-4 py-3 text-sm font-bold text-primary transition hover:bg-primary/10"
              >
                Score bevestigen
              </a>
            )}
            {isConfirmed && (
              <span className="bg-green-100 text-green-800 text-[10px] uppercase px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Bevestigd
              </span>
            )}
            {isDisputed && (
              <span className="bg-red-100 text-red-600 text-[10px] uppercase px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> Betwist
              </span>
            )}
          </div>
        </div>

        {/* Schedule form inline */}
        {showSchedule && scheduleMatchId === match.id && (
          <form onSubmit={handleSchedule} className="mt-6 border border-border/50 rounded-[1.5rem] p-6 bg-muted/10 shadow-inner">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-foreground">Datum voorstellen</h3>
              <button type="button" onClick={() => setShowSchedule(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Datum</Label>
                <Input id="date" type="date" required value={scheduleData.date} onChange={e => setScheduleData(d => ({ ...d, date: e.target.value }))} className="h-12 rounded-xl bg-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tijdstip</Label>
                <Input id="time" type="time" required value={scheduleData.time} onChange={e => setScheduleData(d => ({ ...d, time: e.target.value }))} className="h-12 rounded-xl bg-white" />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Locatie (optioneel)</Label>
              <Input id="location" placeholder="bv. Terrein 2" value={scheduleData.location} onChange={e => setScheduleData(d => ({ ...d, location: e.target.value }))} className="h-12 rounded-xl bg-white" />
            </div>
            {scheduleError && <p className="text-red-600 text-sm font-semibold flex items-center gap-1.5 mt-4"><AlertCircle className="h-4 w-4" />{scheduleError}</p>}
            <div className="flex gap-3 pt-6">
              <Button type="submit" disabled={scheduling} className="h-12 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90">
                {scheduling ? 'Opslaan...' : 'Bevestigen'}
              </Button>
            </div>
          </form>
        )}
      </div>
    )
  }

  // Combine provided lists and compute groups for the three tabs
  const allMatches = [...upcoming, ...past]
  const now = new Date()

  const upcomingMatches = allMatches.filter(m => {
    if (m.status === 'scheduled') return true
    if (m.scheduled_date) {
      const d = new Date(m.scheduled_date)
      return d > now && m.status !== 'played' && m.status !== 'confirmed' && m.status !== 'disputed'
    }
    return false
  })

  // confirmMatches state will be populated from server when user opens the confirm tab
  const pastMatches = allMatches.filter(m => m.status === 'confirmed' || m.status === 'disputed')

  const currentMatches = activeTab === 'upcoming' ? upcomingMatches : activeTab === 'confirm' ? confirmMatches : pastMatches

  // Fetch confirmable matches when the confirm tab is opened
  useEffect(() => {
    let mounted = true
    if (activeTab !== 'confirm') return
    setLoadingConfirm(true)
    fetch('/api/matches/pending')
      .then(r => r.json())
      .then(data => {
        if (!mounted) return
        setConfirmMatches(data.matches ?? [])
      })
      .catch(() => setConfirmMatches([]))
      .finally(() => setLoadingConfirm(false))

    // Listen for optimistic updates from other pages (confirm form)
    let bc: BroadcastChannel | null = null
    try {
      bc = new BroadcastChannel('matches')
      bc.onmessage = (e) => {
        const msg = e.data as any
        if (!msg || !msg.matchId) return
        if (msg.type === 'confirmed' || msg.type === 'disputed') {
          setConfirmMatches(prev => prev.filter(m => m.id !== msg.matchId))
        }
      }
    } catch (e) {
      // ignore if not supported
    }
    return () => { mounted = false }
  }, [activeTab])

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">Wedstrijden</h1>
          <p className="text-muted-foreground font-medium">Je volledige overzicht en planning.</p>
        </div>
        <div className="flex bg-muted/30 p-1.5 rounded-[1.5rem] w-fit shadow-inner">
          {(['upcoming', 'confirm', 'past'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-800 text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'upcoming' ? 'Aankomend' : tab === 'confirm' ? 'Score bevestigen' : 'Afgelopen'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-[1.5rem] border border-border/50 shadow-soft overflow-hidden divide-y divide-border/40 p-2">
        {!hasCompetition ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Calendar className="w-14 h-14 text-muted-foreground/30 mb-4" />
            <p className="font-bold text-muted-foreground text-lg">Je bent momenteel nog niet ingeschreven voor een competitie.</p>
            <p className="text-sm text-muted-foreground/70 mt-1 font-medium">Bekijk beschikbare competities om wedstrijden te zien.</p>
            <a
              href="/competitions"
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
            >
              Bekijk beschikbare competities
            </a>
          </div>
        ) : currentMatches.length > 0 ? (
          currentMatches.map(renderMatchRow)
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Calendar className="w-14 h-14 text-muted-foreground/30 mb-4" />
            <p className="font-bold text-muted-foreground text-lg">
              {activeTab === 'upcoming' ? 'Geen aankomende wedstrijden' : 'Geen afgelopen wedstrijden'}
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1 font-medium">
              {activeTab === 'upcoming'
                ? 'Je geplande wedstrijden verschijnen hier zodra ze zijn aangemaakt door een beheerder.'
                : 'Je gespeelde wedstrijden verschijnen hier na bevestiging.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
