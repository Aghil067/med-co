import { Link } from 'react-router-dom'
import { Page, Panel } from '../components/WorkspaceUI'

export default function Help() {
  return (
    <Page title="Help" description="Find out how Med-Co’s demo and workspace tools work.">
      <Panel title="Common questions">
        <div className="divide-y divide-border text-sm">
          <details className="py-3 first:pt-0"><summary className="cursor-pointer font-bold">Where do the readings come from?</summary><p className="mt-2 text-text-secondary">Simulation mode creates one synthetic sample per minute and displays the last hour. Devices & Sync shows the source and latest timestamp.</p></details>
          <details className="py-3"><summary className="cursor-pointer font-bold">Where are my entries saved?</summary><p className="mt-2 text-text-secondary">Records, medication logs, appointments, and profile settings are stored in this browser. Reports exports wearable readings as a CSV.</p></details>
          <details className="py-3"><summary className="cursor-pointer font-bold">What can MediVox read?</summary><p className="mt-2 text-text-secondary">MediVox uses your configured display name, wearable readings, goal, and recent conversation. Your journal, medications, and appointments stay in the workspace.</p></details>
        </div>
        <Link className="workspace-button mt-3" to="/medivox">Open MediVox</Link>
      </Panel>
    </Page>
  )
}
