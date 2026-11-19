import { Heart } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { navigation } from '../lib/navigation'
import { useWearableFeed } from '../lib/useWearableFeed'

export default function Sidebar({ open, onNavigate }) {
  const { isDemo } = useWearableFeed()
  return (
    <aside id="workspace-navigation" className={`${open ? 'block' : 'hidden'} fixed inset-y-16 left-0 z-50 w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:static lg:flex`}>
      <Link to="/" onClick={onNavigate} className="hidden items-center gap-3 px-5 py-5 lg:flex">
        <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white"><Heart className="size-5" /></span>
        <div><p className="text-sm font-extrabold">Med-Co</p><p className="text-xs text-text-secondary">Digital health twin</p></div>
      </Link>
      <nav aria-label="Workspace" className="h-full overflow-y-auto px-3 py-3 lg:flex-1 lg:py-0">
        {navigation.map(({ group, links }) => (
          <div key={group} className="mb-4">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary">{group}</p>
            <ul className="space-y-1">{links.map(({ Icon, path, label }) => (
              <li key={path}>
                <NavLink to={path} end onClick={onNavigate}
                  className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold ${isActive ? 'bg-indigo-600 text-white' : 'text-text-secondary hover:bg-white/5 hover:text-white'}`}>
                  <Icon aria-hidden="true" className="size-4 shrink-0" />{label}
                </NavLink>
              </li>
            ))}</ul>
          </div>
        ))}
      </nav>
      <div className="hidden border-t border-border px-5 py-4 text-xs text-text-secondary lg:block">{isDemo ? 'Demo wearable' : 'Watch backend'}</div>
    </aside>
  )
}
