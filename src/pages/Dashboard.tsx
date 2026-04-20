import { Card, Chip, Button } from '@heroui/react'
import { useState } from 'react'

export default function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefreshScore = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1500)
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <div className="font-orbitron text-base text-[#e2e8f0]">Command Dashboard</div>
        <div className="text-xs text-[#64748b] mt-1">Dept. of Plant Protection — Pakistan &nbsp;·&nbsp; Cloud-synced &nbsp;·&nbsp; AI risk scoring active</div>
      </div>

      {/* STAT GRID */}
      <div className="grid grid-cols-4 gap-3.5">
        <Card className="bg-[#0d1423] border-0 p-4 border-l-4 border-l-red-500">
          <div className="text-2xl font-black font-orbitron text-red-500">3</div>
          <div className="text-xs text-slate-400 font-space-mono mt-0.5">Active Swarms</div>
          <div className="text-xs text-green-500 font-space-mono mt-1.5">▲ +1 since yesterday</div>
        </Card>
        <Card className="bg-[#0d1423] border-0 p-4 border-l-4 border-l-amber-500">
          <div className="text-2xl font-black font-orbitron text-amber-500">7</div>
          <div className="text-xs text-slate-400 font-space-mono mt-0.5">Risk Zones</div>
          <div className="text-xs text-green-500 font-space-mono mt-1.5">▲ Balochistan, Sindh</div>
        </Card>
        <Card className="bg-[#0d1423] border-0 p-4 border-l-4 border-l-green-500">
          <div className="text-2xl font-black font-orbitron text-green-500">12</div>
          <div className="text-xs text-slate-400 font-space-mono mt-0.5">Drones Deployed</div>
          <div className="text-xs text-slate-400 font-space-mono mt-1.5">● 4 currently on mission</div>
        </Card>
        <Card className="bg-[#0d1423] border-0 p-4 border-l-4 border-l-blue-500">
          <div className="text-2xl font-black font-orbitron text-blue-500">38</div>
          <div className="text-xs text-slate-400 font-space-mono mt-0.5">Field Reports Today</div>
          <div className="text-xs text-slate-400 font-space-mono mt-1.5">▼ 94% verified by AI</div>
        </Card>
      </div>

      {/* MAIN GRID: MAP + ALERTS + SCORE */}
      <div className="grid grid-cols-7 gap-3.5">
        <Card className="col-span-5 bg-[#0d1423] border-0 p-4">
          <div className="text-sm font-medium font-space-mono text-slate-100 mb-3.5">Pakistan Risk Overview</div>
            <div className="bg-[#060d18] rounded-lg overflow-hidden" style={{ height: '270px' }}>
              <svg viewBox="0 0 440 280" style={{ width: '100%', height: '100%' }}>
                <polygon points="22,240 22,115 82,78 122,58 142,88 162,78 162,138 182,158 142,198 122,240 82,270 42,278" fill="rgba(239,68,68,.18)" stroke="#ef4444" strokeWidth="1.4"/>
                <polygon points="162,138 202,128 222,148 242,178 222,218 202,238 162,238 142,198 182,158" fill="rgba(245,158,11,.18)" stroke="#f59e0b" strokeWidth="1.4"/>
                <polygon points="202,58 242,38 282,48 302,78 282,118 262,128 222,148 202,128 162,78 162,58" fill="rgba(59,130,246,.13)" stroke="#3b82f6" strokeWidth="1.4"/>
                <polygon points="162,58 162,28 192,13 222,18 242,38 202,58" fill="rgba(16,185,129,.13)" stroke="#10b981" strokeWidth="1.4"/>
                <polygon points="192,13 222,4 272,8 302,28 282,48 242,38 222,18" fill="rgba(100,116,139,.1)" stroke="#64748b" strokeWidth="1"/>
                <text x="85" y="175" fill="rgba(239,68,68,.9)" fontFamily="Space Mono,monospace" fontSize="9" textAnchor="middle">BALOCHISTAN</text>
                <text x="85" y="187" fill="rgba(239,68,68,.65)" fontFamily="Space Mono,monospace" fontSize="7.5" textAnchor="middle">⚠ CRITICAL</text>
                <text x="192" y="188" fill="rgba(245,158,11,.9)" fontFamily="Space Mono,monospace" fontSize="9" textAnchor="middle">SINDH</text>
                <text x="240" y="92" fill="rgba(59,130,246,.9)" fontFamily="Space Mono,monospace" fontSize="9" textAnchor="middle">PUNJAB</text>
                <text x="190" y="40" fill="rgba(16,185,129,.9)" fontFamily="Space Mono,monospace" fontSize="8" textAnchor="middle">KPK</text>
                <text x="252" y="26" fill="rgba(100,116,139,.8)" fontFamily="Space Mono,monospace" fontSize="7.5" textAnchor="middle">GB/AJK</text>
                <circle cx="72" cy="198" r="7" fill="none" stroke="#ef4444" strokeWidth="1.8">
                  <animate attributeName="r" values="7;14;7" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="1;.15;1" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="72" cy="198" r="3.5" fill="#ef4444"/>
                <circle cx="112" cy="148" r="6" fill="none" stroke="#ef4444" strokeWidth="1.8">
                  <animate attributeName="r" values="6;12;6" dur="2.4s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="1;.15;1" dur="2.4s" repeatCount="indefinite"/>
                </circle>
                <circle cx="112" cy="148" r="3" fill="#ef4444"/>
                <circle cx="178" cy="173" r="5.5" fill="none" stroke="#f59e0b" strokeWidth="1.8">
                  <animate attributeName="r" values="5.5;10;5.5" dur="1.9s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="1;.15;1" dur="1.9s" repeatCount="indefinite"/>
                </circle>
                <circle cx="178" cy="173" r="2.8" fill="#f59e0b"/>
                <rect x="300" y="175" width="128" height="95" rx="4" fill="rgba(13,20,33,.92)" stroke="rgba(255,255,255,.07)"/>
                <text x="310" y="192" fill="#64748b" fontFamily="Space Mono,monospace" fontSize="7.5" letterSpacing="1">RISK LEGEND</text>
                <rect x="310" y="200" width="7" height="7" rx="1" fill="rgba(239,68,68,.35)" stroke="#ef4444"/>
                <text x="322" y="207" fill="#e2e8f0" fontFamily="Space Mono,monospace" fontSize="8.5">Critical</text>
                <rect x="310" y="213" width="7" height="7" rx="1" fill="rgba(245,158,11,.35)" stroke="#f59e0b"/>
                <text x="322" y="220" fill="#e2e8f0" fontFamily="Space Mono,monospace" fontSize="8.5">High</text>
                <rect x="310" y="226" width="7" height="7" rx="1" fill="rgba(59,130,246,.28)" stroke="#3b82f6"/>
                <text x="322" y="233" fill="#e2e8f0" fontFamily="Space Mono,monospace" fontSize="8.5">Medium</text>
                <rect x="310" y="239" width="7" height="7" rx="1" fill="rgba(16,185,129,.28)" stroke="#10b981"/>
                <text x="322" y="246" fill="#e2e8f0" fontFamily="Space Mono,monospace" fontSize="8.5">Low</text>
                <circle cx="314" cy="258" r="3.5" fill="none" stroke="#ef4444" strokeWidth="1.4"/>
                <circle cx="314" cy="258" r="1.8" fill="#ef4444"/>
                <text x="323" y="261" fill="#e2e8f0" fontFamily="Space Mono,monospace" fontSize="8.5">Active Swarm</text>
              </svg>
            </div>
        </Card>

        <div className="col-span-2 space-y-3.5">
          <Card className="bg-[#0d1423] border-0 p-4">
            <div className="text-sm font-medium font-space-mono text-slate-100 mb-3.5">Latest Alerts</div>
            <div className="flex gap-3 p-3 rounded border-l-4 border-l-red-500 bg-slate-900/30 mb-3 last:mb-0">
              <div className="text-lg flex-shrink-0">🔴</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium font-space-mono text-red-500 mb-0.5">Swarm Detected — Khuzdar</div>
                <div className="text-xs text-slate-400 mb-1">Est. 2.3M locusts, moving NE at 28 km/h</div>
                <div className="text-xs text-slate-500 font-space-mono">Today, 08:42 PKT</div>
              </div>
            </div>
            <div className="flex gap-3 p-3 rounded border-l-4 border-l-amber-500 bg-slate-900/30 mb-3 last:mb-0">
              <div className="text-lg flex-shrink-0">🟡</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium font-space-mono text-amber-500 mb-0.5">High Wind Alert — Jacobabad</div>
                <div className="text-xs text-slate-400 mb-1">Wind 34 km/h NE — migration risk elevated</div>
                <div className="text-xs text-slate-500 font-space-mono">Today, 07:15 PKT</div>
              </div>
            </div>
            <div className="flex gap-3 p-3 rounded border-l-4 border-l-blue-500 bg-slate-900/30">
              <div className="text-lg flex-shrink-0">🔵</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium font-space-mono text-blue-500 mb-0.5">Drone Mission Complete</div>
                <div className="text-xs text-slate-400 mb-1">DPP-Alpha covered 180 ha, Khuzdar zone</div>
                <div className="text-xs text-slate-500 font-space-mono">Today, 06:30 PKT</div>
              </div>
            </div>
          </Card>

          <Card className="bg-[#0d1423] border-0 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium font-space-mono text-slate-100">AI Confidence Score</div>
              <Button 
                size="sm" 
                variant="secondary"
                isPending={isRefreshing}
                onPress={handleRefreshScore}
              >
                {isRefreshing ? '🔄 Recalculating...' : '🔄 Refresh'}
              </Button>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-orbitron text-3xl text-green-500 font-black">87%</span>
              <span className="text-xs text-[#64748b]">72-hr forecast accuracy</span>
            </div>
            <div className="rounded-full h-1 bg-slate-700 overflow-hidden mt-3">
              <div style={{ width: '87%', background: 'linear-gradient(90deg,#10b981,#34d399)' }} className="h-full transition-all"></div>
            </div>
            <div className="text-xs text-slate-400 mt-2 font-space-mono">Last trained: 2h ago · Model: GeoAI v2.4 · AWS SageMaker</div>
          </Card>
        </div>
      </div>

      {/* WEATHER CARDS */}
      <Card className="bg-[#0d1423] border-0 p-4">
        <div className="text-sm font-medium font-space-mono text-slate-100 mb-3.5">Weather — Key Monitoring Zones</div>
        <hr className="mb-4 border border-[rgba(255,255,255,0.07)]" />
        <div className="grid grid-cols-3 gap-2.5">
          <Card className="bg-[#0a0f1a] border border-slate-700 p-3 rounded">
            <div className="text-xs text-slate-400 font-space-mono mb-2">📍 Quetta, Balochistan</div>
            <div className="text-xl font-black font-orbitron mb-2">38°C</div>
            <div className="text-xs text-slate-400 leading-relaxed font-space-mono mb-3">
              Wind: 28 km/h NE<br/>
              Humidity: 22%<br/>
              Rainfall: 0 mm
            </div>
            <Chip size="sm" color="danger" variant="secondary">CRITICAL</Chip>
          </Card>
          <Card className="bg-[#0a0f1a] border border-slate-700 p-3 rounded">
            <div className="text-xs text-slate-400 font-space-mono mb-2">📍 Jacobabad, Sindh</div>
            <div className="text-xl font-black font-orbitron mb-2">41°C</div>
            <div className="text-xs text-slate-400 leading-relaxed font-space-mono mb-3">
              Wind: 34 km/h NE<br/>
              Humidity: 18%<br/>
              Rainfall: 0 mm
            </div>
            <Chip size="sm" color="warning" variant="secondary">HIGH</Chip>
          </Card>
          <Card className="bg-[#0a0f1a] border border-slate-700 p-3 rounded">
            <div className="text-xs text-slate-400 font-space-mono mb-2">📍 D.I. Khan, KPK</div>
            <div className="text-xl font-black font-orbitron mb-2">34°C</div>
            <div className="text-xs text-slate-400 leading-relaxed font-space-mono mb-3">
              Wind: 15 km/h SW<br/>
              Humidity: 35%<br/>
              Rainfall: 2 mm
            </div>
            <Chip size="sm" variant="secondary">MEDIUM</Chip>
          </Card>
        </div>
      </Card>
    </div>
  )
}

