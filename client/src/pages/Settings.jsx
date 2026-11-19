import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Field, Form, Page, Panel } from '../components/WorkspaceUI'
import { useWearableFeed } from '../lib/useWearableFeed'
import { useWorkspaceData } from '../lib/useWorkspaceData'
import NotificationSettings from '../components/NotificationSettings'

export default function Settings() {
  const { data: { profile }, update } = useWorkspaceData()
  const { isDemo } = useWearableFeed()
  const [message, setMessage] = useState('')

  function save(event) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const name = fields.get('name').trim()
    const stepGoal = Number(fields.get('steps'))
    if (!name || !Number.isInteger(stepGoal) || stepGoal < 100 || stepGoal > 100000) {
      setMessage('Enter a name and a step goal between 100 and 100,000.')
      return
    }
    update('profile', () => ({ name, stepGoal }))
    setMessage('Profile settings updated.')
  }

  return (
    <Page title="Settings" description="Personalize the profile and step goal used throughout your Med-Co workspace.">
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Panel title="Profile preferences">
          <Form label="Save profile" message={message} onSubmit={save}>
            <Field label="Display name"><input required name="name" maxLength={60} defaultValue={profile.name} /></Field>
            <Field label="Daily step goal"><input required name="steps" type="number" min={100} max={100000} step={1} defaultValue={profile.stepGoal} /></Field>
          </Form>
        </Panel>
        <Panel title="Workspace information">
          <dl className="space-y-3 text-sm">
            <div><dt className="font-bold">Wearable mode</dt><dd className="text-text-secondary">{isDemo ? 'Demo wearable' : 'Watch backend'}</dd></div>
            <div><dt className="font-bold">Time zone</dt><dd className="text-text-secondary">India Standard Time (Asia/Kolkata)</dd></div>
            <div><dt className="font-bold">Saved data</dt><dd className="text-text-secondary">Settings, records, medication logs, and appointments are stored in this browser.</dd></div>
          </dl>
          <Link to="/devices" className="workspace-button mt-4">View device status</Link>
        </Panel>
      </div>
      <NotificationSettings />
    </Page>
  )
}
