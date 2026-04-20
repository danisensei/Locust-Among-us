import { Card } from '@heroui/react'

export default function SwarmMap() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <div className="font-orbitron text-base text-[#e2e8f0]">Swarm Distribution Map</div>
        <div className="text-xs text-[#64748b] mt-1">GIS terrain-aware risk visualization · DBSCAN clustering · Real-time satellite overlay (simulated)</div>
      </div>

      <Card className="card bg-[#0d1423] border-0 p-4">
        <div className="flex justify-between items-center mb-3.5">
          <div className="ctitle m-0">Interactive Risk Map — Pakistan</div>
          <div className="flex gap-1.75">
            <button className="btn-o">🔴 Swarms</button>
            <button className="btn-o">🛸 Drones</button>
            <button className="btn-o">🌡 Heatmap</button>
            <button className="btn-p">Export PNG</button>
          </div>
        </div>
        <div className="bg-[#060d18] rounded-lg h-96" style={{ minHeight: '400px' }}>
          <svg viewBox="0 0 440 280" style={{ width: '100%', height: '100%' }}>
            <rect width="440" height="280" fill="#060d18"/>
            <polygon points="22,240 22,115 82,78 122,58 142,88 162,78 162,138 182,158 142,198 122,240 82,270 42,278" fill="rgba(239,68,68,.18)" stroke="#ef4444" strokeWidth="1.4"/>
          </svg>
        </div>
      </Card>
    </div>
  )
}
