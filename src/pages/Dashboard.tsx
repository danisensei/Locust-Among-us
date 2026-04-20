import { Card } from '@heroui/react'

export default function Dashboard() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <div className="font-orbitron text-base text-[#e2e8f0]">Command Dashboard</div>
        <div className="text-xs text-[#64748b] mt-1">Dept. of Plant Protection — Pakistan &nbsp;·&nbsp; Cloud-synced &nbsp;·&nbsp; AI risk scoring active</div>
      </div>

      {/* STAT GRID */}
      <div className="grid grid-cols-4 gap-3.5">
        <Card className="scard r bg-[#0d1423] border-0 p-4">
          <div className="sv text-red-500">3</div>
          <div className="sl">Active Swarms</div>
          <div className="sc up">▲ +1 since yesterday</div>
        </Card>
        <Card className="scard a bg-[#0d1423] border-0 p-4">
          <div className="sv text-amber-500">7</div>
          <div className="sl">Risk Zones</div>
          <div className="sc up">▲ Balochistan, Sindh</div>
        </Card>
        <Card className="scard g bg-[#0d1423] border-0 p-4">
          <div className="sv text-green-500">12</div>
          <div className="sl">Drones Deployed</div>
          <div className="sc dn">● 4 currently on mission</div>
        </Card>
        <Card className="scard b bg-[#0d1423] border-0 p-4">
          <div className="sv text-blue-500">38</div>
          <div className="sl">Field Reports Today</div>
          <div className="sc dn">▼ 94% verified by AI</div>
        </Card>
      </div>

      {/* MAIN GRID: MAP + ALERTS + SCORE */}
      <div className="grid grid-cols-7 gap-3.5">
        <div className="col-span-5">
          <div className="card">
            <div className="ctitle">Pakistan Risk Overview</div>
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
          </div>
        </div>

        <div className="col-span-2 space-y-3.5">
          <div className="card">
            <div className="ctitle">Latest Alerts</div>
            <div className="aitem cr">
              <div className="aicon">🔴</div>
              <div>
                <div className="atitle text-red-500">Swarm Detected — Khuzdar</div>
                <div className="adesc">Est. 2.3M locusts, moving NE at 28 km/h</div>
                <div className="atime">Today, 08:42 PKT</div>
              </div>
            </div>
            <div className="aitem wa">
              <div className="aicon">🟡</div>
              <div>
                <div className="atitle text-amber-500">High Wind Alert — Jacobabad</div>
                <div className="adesc">Wind 34 km/h NE — migration risk elevated</div>
                <div className="atime">Today, 07:15 PKT</div>
              </div>
            </div>
            <div className="aitem inf">
              <div className="aicon">🔵</div>
              <div>
                <div className="atitle text-blue-500">Drone Mission Complete</div>
                <div className="adesc">DPP-Alpha covered 180 ha, Khuzdar zone</div>
                <div className="atime">Today, 06:30 PKT</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="ctitle">AI Confidence Score</div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-orbitron text-3xl text-green-500 font-black">87%</span>
              <span className="text-xs text-[#64748b]">72-hr forecast accuracy</span>
            </div>
            <div className="rbar">
              <div className="rfill" style={{ width: '87%', background: 'linear-gradient(90deg,#10b981,#34d399)' }}></div>
            </div>
            <div className="text-xs text-[#64748b] mt-2 font-mono-space">Last trained: 2h ago · Model: GeoAI v2.4 · AWS SageMaker</div>
          </div>
        </div>
      </div>

      {/* WEATHER CARDS */}
      <div className="card">
        <div className="ctitle">Weather — Key Monitoring Zones</div>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="wc">
            <div className="wcity">📍 Quetta, Balochistan</div>
            <div className="wtemp">38°C</div>
            <div className="wdet">
              Wind: 28 km/h NE<br/>
              Humidity: 22%<br/>
              Rainfall: 0 mm<br/>
              <span className="text-red-500">Risk: CRITICAL</span>
            </div>
          </div>
          <div className="wc">
            <div className="wcity">📍 Jacobabad, Sindh</div>
            <div className="wtemp">41°C</div>
            <div className="wdet">
              Wind: 34 km/h NE<br/>
              Humidity: 18%<br/>
              Rainfall: 0 mm<br/>
              <span className="text-amber-500">Risk: HIGH</span>
            </div>
          </div>
          <div className="wc">
            <div className="wcity">📍 D.I. Khan, KPK</div>
            <div className="wtemp">34°C</div>
            <div className="wdet">
              Wind: 15 km/h SW<br/>
              Humidity: 35%<br/>
              Rainfall: 2 mm<br/>
              <span className="text-blue-500">Risk: MEDIUM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

