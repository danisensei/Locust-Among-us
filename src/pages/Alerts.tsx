import { Card } from '@heroui/react'

export default function Alerts() {
  const metrics = [
    { label: 'Critical', value: '2', color: 'r' },
    { label: 'High', value: '5', color: 'a' },
    { label: 'Medium', value: '8', color: 'b' },
    { label: 'Resolved', value: '124', color: 'g' },
  ]

  return (
    <div className="space-y-6 pb-8">
      <div>
        <div className="font-orbitron text-base text-[#e2e8f0]">Alerts Management</div>
        <div className="text-xs text-[#64748b] mt-1">Real-time alert aggregation · Auto-escalation · Integration with SMS/Email</div>
      </div>

      <div className="grid grid-cols-4 gap-3.5">
        {metrics.map((m) => (
          <Card key={m.label} className={`scard ${m.color} bg-[#0d1423] border-0 p-4`}>
            <div className={`sv ${m.color === 'r' ? 'text-red-500' : m.color === 'a' ? 'text-amber-500' : m.color === 'b' ? 'text-blue-500' : 'text-green-500'}`}>
              {m.value}
            </div>
            <div className="sl">{m.label}</div>
          </Card>
        ))}
      </div>

      <Card className="card bg-[#0d1423] border-0 p-4">
        <div className="ctitle">Recent Alerts</div>
        <div>
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
              <div className="atitle text-blue-500">Drone Battery Low — DPP-Gamma</div>
              <div className="adesc">Battery at 15%, returning to base</div>
              <div className="atime">Today, 06:30 PKT</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
