import { useState } from 'react'
import { Empty, Field, Form, Page, Panel } from '../components/WorkspaceUI'
import { indiaDate, makeEntry, useWorkspaceData } from '../lib/useWorkspaceData'

export default function Appointments() {
  const { data: { appointments }, update } = useWorkspaceData()
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState('all')
  const sorted = [...appointments].filter(item => filter === 'all' || item.status === filter)
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))

  function save(event) {
    event.preventDefault()
    const form = event.currentTarget
    const fields = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, value.trim()]))
    if (!fields.title) return setMessage('Enter an appointment title.')
    if (editing) update('appointments', items => items.map(item => item.id === editing.id ? { ...item, ...fields } : item))
    else {
      const entry = makeEntry({ ...fields, status: 'planned' })
      update('appointments', items => [...items, entry])
    }
    form.reset()
    setEditing(null)
    setMessage(editing ? 'Appointment updated.' : 'Appointment saved.')
  }

  return (
    <Page title="Appointments" description="Keep a personal list of visits you arrange with your healthcare providers.">
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Panel title={editing ? 'Edit appointment' : 'Add an appointment'}>
          <Form key={editing?.id ?? 'new'} onSubmit={save} label={editing ? 'Save changes' : 'Save appointment'} message={message}>
            <Field label="Visit title"><input name="title" required maxLength={100} defaultValue={editing?.title} /></Field>
            <Field label="Provider or location"><input name="location" maxLength={150} defaultValue={editing?.location} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Date"><input name="date" type="date" required defaultValue={editing?.date ?? indiaDate()} /></Field>
              <Field label="Time (IST)"><input name="time" type="time" required defaultValue={editing?.time} /></Field>
            </div>
            <Field label="Notes"><textarea name="notes" rows={3} maxLength={500} defaultValue={editing?.notes} /></Field>
            {editing && <button type="button" className="workspace-button" onClick={() => setEditing(null)}>Cancel editing</button>}
          </Form>
        </Panel>
        <Panel title="Visit planner">
          <div className="workspace-form mb-4">
            <Field label="Filter by status"><select value={filter} onChange={event => setFilter(event.target.value)}>
              <option value="all">All appointments</option><option value="planned">Planned</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
            </select></Field>
          </div>
          {sorted.length === 0 ? <Empty>No appointments in this view.</Empty> : <ul className="divide-y divide-border">
            {sorted.map(item => <li key={item.id} className="space-y-2 break-words py-3 first:pt-0">
              <h3 className="text-sm font-bold">{item.title}</h3>
              <p className="text-xs text-text-secondary">{item.date} · {item.time} IST{item.location && ` · ${item.location}`}</p>
              {item.notes && <p className="whitespace-pre-wrap text-sm text-text-secondary">{item.notes}</p>}
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="workspace-button" onClick={() => { setEditing(item); setMessage('') }}>Edit</button>
                <label className="workspace-form flex items-center gap-2 text-xs">Status
                  <select aria-label={`Status for ${item.title}`} value={item.status} onChange={event => {
                    const status = event.target.value
                    update('appointments', items => items.map(entry => entry.id === item.id ? { ...entry, status } : entry))
                  }}><option value="planned">Planned</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
                </label>
              </div>
            </li>)}
          </ul>}
        </Panel>
      </div>
    </Page>
  )
}
