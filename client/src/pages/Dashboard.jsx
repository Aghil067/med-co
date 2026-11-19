import HealthMetrics from '../components/HealthMetrics'
import DigitalTwin from '../components/DigitalTwin'
import HealthTrends from '../components/HealthTrends'
import DiseaseRiskSummary from '../components/DiseaseRiskSummary'
import AIHealthInsights from '../components/AIHealthInsights'
import WhatIfSimulator from '../components/WhatIfSimulator'
import CaretakerAlertPanel from '../components/CaretakerAlertPanel'

export default function Dashboard() {
  return (
    <div className="space-y-4">
      {/* Row 1: Vitals & Trends + Disease Risk */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Left Side: Vitals Grid + Trends Chart */}
        <div className="w-full flex-1 min-w-0 flex flex-col gap-4">
          <HealthMetrics />
          <HealthTrends />
        </div>
        {/* Right Side: Caretaker Alert & Disease Risk */}
        <div className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-4">
          <CaretakerAlertPanel />
          <DiseaseRiskSummary />
        </div>
      </div>

      {/* Row 2: Digital Twin + Simulator & AI Insights */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Left Side: Digital Twin */}
        <div className="w-full lg:w-[320px] flex-shrink-0">
          <DigitalTwin />
        </div>
        {/* Right Side: What-If Simulator + AI Health Insights */}
        <div className="w-full flex-1 min-w-0 flex flex-col gap-4">
          <WhatIfSimulator />
          <AIHealthInsights />
        </div>
      </div>
    </div>
  )
}
