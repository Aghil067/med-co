import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Empty, Field, Form, Page, Panel } from '../components/WorkspaceUI'
import { indiaDate, makeEntry, useWorkspaceData } from '../lib/useWorkspaceData'

const categories = ['Observation', 'Visit', 'Lab result', 'Symptom', 'Other']

export default function HealthRecords() {
  const { data: { records }, update } = useWorkspaceData()
  const [params] = useSearchParams()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')
  const visible = records.filter(record => [record.title, record.category, record.notes].some(value => value.toLowerCase().includes(search.trim().toLowerCase())))

  function save(event) {
    event.preventDefault()
    const form = event.currentTarget
    const fields = Object.fromEntries(new FormData(form))
    fields.title = fields.title.trim()
    fields.notes = fields.notes.trim()
    if (!fields.title) return setMessage('Enter a record title.')
    if (editing) update('records', entries => entries.map(entry => entry.id === editing.id ? { ...entry, ...fields } : entry))
    else {
      const entry = makeEntry(fields)
      update('records', entries => [entry, ...entries])
    }
    form.reset()
    setEditing(null)
    setMessage(editing ? 'Record updated.' : 'Record added.')
  }

  return (
    <Page title="Health Records" description="Keep a dated journal of observations, visits, symptoms, and lab results.">
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Panel title={editing ? 'Edit record' : 'Add a record'}>
          <Form key={editing?.id ?? params.get('new') ?? 'new'} label={editing ? 'Save changes' : 'Add record'} onSubmit={save} message={message}>
            <Field label="Title"><input name="title" required maxLength={120} defaultValue={editing?.title} autoFocus={params.has('new') || !!editing} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Category"><select name="category" defaultValue={editing?.category}>{categories.map(category => <option key={category}>{category}</option>)}</select></Field>
              <Field label="Date"><input name="date" type="date" required defaultValue={editing?.date ?? indiaDate()} /></Field>
            </div>
            <Field label="Notes"><textarea name="notes" rows={4} maxLength={3000} defaultValue={editing?.notes} /></Field>
            {editing && <button className="workspace-button" type="button" onClick={() => setEditing(null)}>Cancel editing</button>}
          </Form>
        </Panel>
        <Panel title={`Saved records (${records.length})`}>
          <div className="workspace-form mb-4"><Field label="Search records"><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search titles, categories or notes" /></Field></div>
          {visible.length === 0 ? <Empty>{records.length ? 'No records match this search.' : 'Your saved records will appear here.'}</Empty> : (
            <ul className="divide-y divide-border">
              {visible.map(record => (
                <li key={record.id} className="space-y-2 py-3 first:pt-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 break-words"><h3 className="text-sm font-bold">{record.title}</h3><p className="text-xs text-text-secondary">{record.category} · <time dateTime={record.date}>{record.date}</time></p></div>
                    <div className="flex gap-2">
                      <button className="workspace-button" type="button" onClick={() => { setEditing(record); setMessage('') }}>Edit</button>
                      <button className="workspace-button" type="button" onClick={() => {
                        if (window.confirm(`Delete “${record.title}”?`)) {
                          update('records', entries => entries.filter(entry => entry.id !== record.id))
                          if (editing?.id === record.id) setEditing(null)
                          setMessage('Record deleted.')
                        }
                      }}>Delete</button>
                    </div>
                  </div>
                  {record.notes && <p className="whitespace-pre-wrap break-words text-sm text-text-secondary">{record.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </Page>
  )
}
