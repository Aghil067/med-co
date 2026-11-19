import { Activity, BarChart3, Bot, CalendarCheck, ClipboardList, FileText, FlaskConical, Heart, LayoutDashboard, Lightbulb, Pill, Settings, Smartphone } from 'lucide-react'

export const navigation = [
  { group: 'Overview', links: [
    { Icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { Icon: Bot, label: 'AI Chatbot', path: '/medivox' },
    { Icon: Heart, label: 'Digital Twin', path: '/digital-twin' },
  ] },
  { group: 'Health & care', links: [
    { Icon: FileText, label: 'Health Records', path: '/records' },
    { Icon: BarChart3, label: 'Risk Analysis', path: '/risk' },
    { Icon: FlaskConical, label: 'What-If Simulator', path: '/simulator' },
    { Icon: Lightbulb, label: 'Recommendations', path: '/recommendations' },
    { Icon: Pill, label: 'Medications', path: '/medications' },
    { Icon: ClipboardList, label: 'Reports', path: '/reports' },
    { Icon: CalendarCheck, label: 'Appointments', path: '/appointments' },
  ] },
  { group: 'Workspace', links: [
    { Icon: Smartphone, label: 'Devices & Sync', path: '/devices' },
    { Icon: Settings, label: 'Settings', path: '/settings' },
    { Icon: Activity, label: 'Need Help?', path: '/help' },
  ] },
]
