import { AlertOctagon, ShieldAlert } from 'lucide-react'
import { getAlerts } from '../lib/healthSignals'
import { useWearableFeed } from '../lib/useWearableFeed'
import { wearableDrills } from '../lib/wearableSimulation'

export default function CaretakerAlertPanel() {
  const { latest, isDemo, setDrill } = useWearableFeed()
  const alerts = getAlerts(latest)

  return (
    <section className="bg-bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-primary-light" />
        <h3 className="text-[13px] font-bold">Caretaker Alerts</h3>
      </div>
      <div role="status" className={`rounded-xl border px-3 py-2.5 text-[11px] ${alerts.length ? 'border-danger/30 bg-danger/10' : 'border-border bg-bg-subtle'}`}>
        {alerts.length > 0 ? (
          <>
            <p className="flex items-center gap-1.5 font-bold text-danger"><AlertOctagon className="w-4 h-4" />{isDemo || latest.simulated ? 'Demo alert' : 'Wearable alert'}</p>
            {alerts.map(alert => <p key={alert.type} className="mt-1">{alert.message}</p>)}
          </>
        ) : latest.recordedAt ? 'No active alerts' : 'Waiting for readings'}
      </div>
      {isDemo && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {wearableDrills.map(({ label, overrides }) => (
              <button key={label} type="button" onClick={() => setDrill(overrides)} className="bg-bg-subtle border border-border rounded-lg p-2 text-[10px] font-bold hover:border-primary-light">
                {label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-text-muted">Drills affect the current simulation minute.</p>
        </>
      )}
    </section>
  )
}
