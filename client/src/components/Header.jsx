import { useRef, useState } from 'react'
import { Bell, Menu, Plus, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getAlerts } from '../lib/healthSignals'
import { navigation } from '../lib/navigation'
import { useWearableFeed } from '../lib/useWearableFeed'
import { useNotifications } from '../lib/useNotifications'

export default function Header({ menuOpen, toggleMenu }) {
  const { profileName, isDemo, latest } = useWearableFeed()
  const [query, setQuery] = useState('')
  const searchDialog = useRef(null)
  const alertsDialog = useRef(null)
  const alerts = getAlerts(latest)
  const { reminders } = useNotifications()
  const alertCount = alerts.length + reminders.length
  const matching = navigation.flatMap(group => group.links).filter(link => link.label.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-sidebar px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <button type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="workspace-navigation" onClick={toggleMenu} className="workspace-button lg:hidden">
          {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
        <Link to="/" className="truncate text-sm font-extrabold lg:hidden">Med-Co</Link>
        <p className="hidden truncate text-sm font-bold lg:block">Welcome back, {profileName}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button type="button" aria-label="Search pages" className="workspace-button" onClick={() => { setQuery(''); searchDialog.current.showModal() }}><Search className="size-4" /><span className="hidden sm:inline">Search</span></button>
        <Link aria-label="Add health data" to="/records?new=1" className="workspace-button workspace-primary"><Plus className="size-4" /><span className="hidden sm:inline">Add health data</span></Link>
        <button type="button" aria-label={`Alerts (${alertCount} active)`} className="workspace-button relative" onClick={() => alertsDialog.current.showModal()}>
          <Bell className="size-4" />
          {alertCount > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-danger" />}
        </button>
        <Link to="/settings" aria-label="Profile settings" className="grid size-8 place-items-center rounded-lg bg-primary-50 text-sm font-bold text-primary-light">{Array.from(profileName)[0]?.toUpperCase()}</Link>
      </div>
      <dialog ref={searchDialog} aria-labelledby="search-title" className="workspace-dialog">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="search-title" className="font-bold">Find a page</h2>
          <form method="dialog"><button aria-label="Close search" className="workspace-button"><X className="size-4" /></button></form>
        </div>
        <div className="workspace-form"><input type="search" aria-label="Search pages by name" autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by page name" /></div>
        <ul className="mt-3 max-h-[45dvh] overflow-y-auto">
          {matching.map(({ label, path }) => <li key={path}><Link className="block rounded-lg px-3 py-2 text-sm hover:bg-white/5" to={path} onClick={() => searchDialog.current.close()}>{label}</Link></li>)}
        </ul>
        {!matching.length && <p role="status" className="mt-3 text-sm text-text-secondary">No matching pages.</p>}
      </dialog>
      <dialog ref={alertsDialog} aria-labelledby="alerts-title" className="workspace-dialog">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="alerts-title" className="font-bold">Alerts and reminders</h2>
          <form method="dialog"><button aria-label="Close alerts" className="workspace-button"><X className="size-4" /></button></form>
        </div>
        <div className="mb-4 space-y-3 text-sm text-text-secondary">
          <section aria-label="Wearable alerts">
            <h3 className="mb-1 font-bold text-white">{isDemo || latest.simulated ? 'Demo wearable alerts' : 'Wearable alerts'}</h3>
            {alerts.length ? <ul className="space-y-1">{alerts.map(alert => <li key={alert.type}>{alert.message}</li>)}</ul> : latest.recordedAt ? 'No active alerts in the current reading.' : 'Waiting for wearable readings.'}
          </section>
          <section aria-label="Medication reminders">
            <h3 className="mb-1 font-bold text-white">Medication reminders</h3>
            {reminders.length ? <ul className="space-y-1">{reminders.map(item => <li key={item.id}>{item.name} · unlogged since {item.time} IST on {item.date}</li>)}</ul> : 'No recently due, unlogged doses.'}
          </section>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="workspace-button" to="/risk" onClick={() => alertsDialog.current.close()}>Open Risk Analysis</Link>
          <Link className="workspace-button" to="/medications" onClick={() => alertsDialog.current.close()}>Open Medications</Link>
          <Link className="workspace-button" to="/settings#notifications" onClick={() => alertsDialog.current.close()}>Phone notifications</Link>
        </div>
      </dialog>
    </header>
  )
}
