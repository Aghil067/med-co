import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Empty, Field, Form, Page, Panel } from '../components/WorkspaceUI'
import { indiaDate, makeEntry, useWorkspaceData } from '../lib/useWorkspaceData'

export default function Medications() {
  const { data: { medications }, update } = useWorkspaceData()
  const [date, setDate] = useState(() => indiaDate())
  const [message, setMessage] = useState('')
  const scheduled = medications.filter(item => item.start <= date)
  const taken = scheduled.filter(item => item.log[date] === 'taken').length

  function add(event) {
    event.preventDefault()
    const form = event.currentTarget
    const fields = Object.fromEntries(new FormData(form))
    const name = fields.name.trim()
    if (!name) return setMessage('Enter the medication name.')
    const entry = makeEntry({ ...fields, name, instructions: fields.instructions.trim(), log: {} })
    update('medications', items => [...items, entry])
    form.reset()
    setMessage('Medication added.')
  }

  function mark(id, status) {
    update('medications', items => items.map(item => {
      if (item.id !== id) return item
      const log = { ...item.log }
      if (status === 'clear') delete log[date]
      else log[date] = status
      return { ...item, log }
    }))
  }

  return (
    <Page title="Medications" description="Log once-daily medications and track which scheduled doses you recorded."
      action={<Link to="/settings#notifications" className="workspace-button">Set up phone reminders</Link>}>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Panel title="Add a daily medication">
          <Form onSubmit={add} label="Add medication" message={message}>
            <Field label="Medication name"><input name="name" required maxLength={100} /></Field>
            <Field label="Instructions from your prescription"><textarea name="instructions" rows={3} maxLength={300} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Start date"><input name="start" type="date" required defaultValue={indiaDate()} /></Field>
              <Field label="Daily time (IST)"><input name="time" type="time" required /></Field>
            </div>
          </Form>
        </Panel>
        <Panel title="Dose log">
          <div className="workspace-form mb-4 flex flex-wrap items-end justify-between gap-3">
            <Field label="Log date"><input type="date" required max={indiaDate()} value={date} onChange={event => { if (event.target.value) setDate(event.target.value) }} /></Field>
            <p className="text-sm font-bold text-primary-light">{taken} of {scheduled.length} marked taken</p>
          </div>
          {scheduled.length ? <ul className="divide-y divide-border">
            {[...scheduled].sort((a, b) => a.time.localeCompare(b.time)).map(item => {
              const status = item.log[date]
              return <li key={item.id} className="space-y-2 py-3 first:pt-0">
                <div className="flex flex-wrap justify-between gap-2">
                  <div className="min-w-0 break-words"><h3 className="text-sm font-bold">{item.name}</h3><p className="text-xs text-text-secondary">{item.time} IST · {status === 'taken' ? 'Taken' : status === 'skipped' ? 'Skipped' : 'Pending'}</p></div>
                  <div className="flex flex-wrap gap-2">
                    {['taken', 'skipped', 'clear'].map(value => <button key={value} type="button" aria-pressed={value === status} disabled={value === 'clear' && !status} className={`workspace-button ${value === status ? 'workspace-primary' : ''}`} onClick={() => mark(item.id, value)}>{value === 'taken' ? 'Taken' : value === 'skipped' ? 'Skipped' : 'Undo'}</button>)}
                  </div>
                </div>
                {item.instructions && <p className="break-words text-sm text-text-secondary">{item.instructions}</p>}
              </li>
            })}
          </ul> : <Empty>No doses scheduled for this date.</Empty>}
        </Panel>
      </div>
      {medications.length > 0 && <Panel title="Manage medications">
        <ul className="divide-y divide-border">{medications.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
          <span className="min-w-0 break-words text-sm">{item.name} · {item.time} IST · starts {item.start}</span>
          <button type="button" className="workspace-button" onClick={() => {
            if (window.confirm(`Remove “${item.name}” and its dose history?`)) update('medications', items => items.filter(entry => entry.id !== item.id))
          }}>Remove</button>
        </li>)}</ul>
      </Panel>}
    </Page>
  )
}
