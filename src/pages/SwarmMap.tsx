import { Card, Button } from '@heroui/react'
import { useState } from 'react'

export default function SwarmMap() {
  const [activeOverlay, setActiveOverlay] = useState<'swarms' | 'drones' | 'heatmap' | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const handleOverlayToggle = (overlay: 'swarms' | 'drones' | 'heatmap') => {
    setActiveOverlay(activeOverlay === overlay ? null : overlay)
  }

  const handleExport = () => {
    setIsExporting(true)
    setTimeout(() => setIsExporting(false), 2000)
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <div className="font-orbitron text-base text-[#e2e8f0]">Swarm Distribution Map</div>
        <div className="text-xs text-[#64748b] mt-1">GIS terrain-aware risk visualization · DBSCAN clustering · Real-time satellite overlay (simulated)</div>
      </div>

      <Card className="bg-[#0d1423] border-0 p-4">
        <div className="flex justify-between items-center mb-3.5">
          <div className="text-sm font-medium font-space-mono text-slate-100">Interactive Risk Map — Pakistan</div>
          <div className="flex gap-2">
            <Button 
              size="md" 
              variant={activeOverlay === 'swarms' ? 'primary' : 'outline'}
              onPress={() => handleOverlayToggle('swarms')}
            >
              🔴 Swarms {activeOverlay === 'swarms' ? '✓' : ''}
            </Button>
            <Button 
              size="md" 
              variant={activeOverlay === 'drones' ? 'primary' : 'outline'}
              onPress={() => handleOverlayToggle('drones')}
            >
              🛸 Drones {activeOverlay === 'drones' ? '✓' : ''}
            </Button>
            <Button 
              size="md" 
              variant={activeOverlay === 'heatmap' ? 'primary' : 'outline'}
              onPress={() => handleOverlayToggle('heatmap')}
            >
              🌡 Heatmap {activeOverlay === 'heatmap' ? '✓' : ''}
            </Button>
            <Button 
              size="md"
              variant="primary"
              isPending={isExporting}
              onPress={handleExport}
            >
              {isExporting ? '⏳ Exporting...' : '📥 Export PNG'}
            </Button>
          </div>
        </div>

        {/* Overlay Status Indicator */}
        {activeOverlay && (
          <div className="mb-3 p-2 bg-[rgba(245,158,11,0.1)] border border-[#f59e0b] rounded text-sm text-[#f59e0b] font-mono-space">
            Active Overlay: <span className="font-bold">{activeOverlay.toUpperCase()}</span>
          </div>
        )}

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
