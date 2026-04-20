import { Card } from '@heroui/react'

export default function AIPrediction() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <div className="font-orbitron text-base text-[#e2e8f0]">AI Risk Prediction</div>
        <div className="text-xs text-[#64748b] mt-1">Machine learning forecast · 72-hour risk horizon · ARIMA + Random Forest ensemble</div>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        {['Today', 'Tomorrow', 'Day 3', 'Day 4'].map((day, idx) => (
          <Card key={day} className="card bg-[#0d1423] border-0 p-4">
            <div className="ctitle">{day}</div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-orbitron text-2xl font-black" style={{color: [40,65,72,58][idx] > 60 ? '#ef4444' : '#f59e0b'}}>
                {[87, 72, 65, 58][idx]}%
              </span>
              <span className="text-xs text-[#64748b]">Risk Level</span>
            </div>
            <div className="rbar">
              <div className="rfill" style={{width: `${[87,72,65,58][idx]}%`, background: [40,65,72,58][idx] > 60 ? '#ef4444' : '#f59e0b'}}></div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="card bg-[#0d1423] border-0 p-4">
        <div className="ctitle">8-Day Forecast</div>
        <div className="grid grid-cols-8 gap-1">
          {Array.from({length:8}, (_, i) => (
            <div key={i} className="fcell" style={{borderColor: Math.random() > 0.7 ? 'rgba(239,68,68,.38)' : Math.random() > 0.4 ? 'rgba(245,158,11,.38)' : 'rgba(16,185,129,.28)', background: Math.random() > 0.7 ? 'rgba(239,68,68,.07)' : Math.random() > 0.4 ? 'rgba(245,158,11,.07)' : 'rgba(16,185,129,.05)'}}>
              <div className="flbl">Day {i+1}</div>
              <div className="frisk" style={{color: Math.random() > 0.7 ? '#ef4444' : Math.random() > 0.4 ? '#f59e0b' : '#10b981'}}>
                {Math.floor(Math.random() * 100)}%
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
