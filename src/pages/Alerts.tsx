import { Card, Chip, Button } from '@heroui/react'
import { useState } from 'react'

export default function Alerts() {
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([])
  const [isAcknowledging, setIsAcknowledging] = useState<number | null>(null)

  const handleAcknowledge = (index: number) => {
    setIsAcknowledging(index)
    setTimeout(() => {
      setDismissedAlerts([...dismissedAlerts, index])
      setIsAcknowledging(null)
    }, 1000)
  }

  const handleEscalate = (index: number) => {
    alert(`Alert ${index} escalated to operations team!`)
  }
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
          <Card key={m.label} className={`bg-[#0d1423] border-0 p-4 border-l-4 ${
            m.color === 'r' ? 'border-l-red-500' : 
            m.color === 'a' ? 'border-l-amber-500' : 
            m.color === 'b' ? 'border-l-blue-500' : 
            'border-l-green-500'
          }`}>
            <div className={`text-2xl font-black font-orbitron ${
              m.color === 'r' ? 'text-red-500' : 
              m.color === 'a' ? 'text-amber-500' : 
              m.color === 'b' ? 'text-blue-500' : 
              'text-green-500'
            }`}>
              {m.value}
            </div>
            <div className="text-xs text-slate-400 font-space-mono mt-0.5">{m.label}</div>
          </Card>
        ))}
      </div>

      <Card className="bg-[#0d1423] border-0 p-4">
        <div className="text-sm font-medium font-space-mono text-slate-100 mb-3.5">Recent Alerts</div>
        <hr className="mb-4 border border-[rgba(255,255,255,0.07)]" />
        <div className="space-y-3">
          {dismissedAlerts.includes(0) ? null : (
            <>
              <div className="flex gap-3 p-3 rounded border-l-4 border-l-red-500 bg-slate-900/30">
                <div className="text-lg flex-shrink-0">🔴</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium font-space-mono text-red-500 mb-1">Swarm Detected — Khuzdar</div>
                  <div className="text-xs text-slate-400 mb-2">Est. 2.3M locusts, moving NE at 28 km/h</div>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    <Chip
                      size="sm"
                      variant="secondary"
                      color="danger"
                      className="text-xs"
                    >
                      CRITICAL
                    </Chip>
                    <Button size="sm" variant="secondary" onPress={() => handleAcknowledge(0)} isPending={isAcknowledging === 0}>
                      {isAcknowledging === 0 ? '✓ Done' : 'Acknowledge'}
                    </Button>
                    <Button size="sm" variant="danger" onPress={() => handleEscalate(0)}>
                      📢 Escalate
                    </Button>
                  </div>
                  <div className="text-xs text-slate-500 font-space-mono">Today, 08:42 PKT</div>
                </div>
              </div>
              <hr className="border border-[rgba(255,255,255,0.05)]" />
            </>
          )}
          {dismissedAlerts.includes(1) ? null : (
            <>
              <div className="flex gap-3 p-3 rounded border-l-4 border-l-amber-500 bg-slate-900/30">
                <div className="text-lg flex-shrink-0">🟡</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium font-space-mono text-amber-500 mb-1">High Wind Alert — Jacobabad</div>
                  <div className="text-xs text-slate-400 mb-2">Wind 34 km/h NE — migration risk elevated</div>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    <Chip
                      size="sm"
                      variant="secondary"
                      color="warning"
                      className="text-xs"
                    >
                      HIGH
                    </Chip>
                    <Button size="sm" variant="secondary" onPress={() => handleAcknowledge(1)} isPending={isAcknowledging === 1}>
                      {isAcknowledging === 1 ? '✓ Done' : 'Acknowledge'}
                    </Button>
                    <Button size="sm" variant="danger" onPress={() => handleEscalate(1)}>
                      📢 Escalate
                    </Button>
                  </div>
                  <div className="text-xs text-slate-500 font-space-mono">Today, 07:15 PKT</div>
                </div>
              </div>
              <hr className="border border-[rgba(255,255,255,0.05)]" />
            </>
          )}
          {dismissedAlerts.includes(2) ? null : (
            <div className="flex gap-3 p-3 rounded border-l-4 border-l-blue-500 bg-slate-900/30">
              <div className="text-lg flex-shrink-0">🔵</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium font-space-mono text-blue-500 mb-1">Drone Battery Low — DPP-Gamma</div>
                <div className="text-xs text-slate-400 mb-2">Battery at 15%, returning to base</div>
                <div className="flex gap-2 mb-2 flex-wrap">
                  <Chip
                    size="sm"
                    variant="secondary"
                    className="text-xs"
                  >
                    INFO
                  </Chip>
                  <Button size="sm" variant="secondary" onPress={() => handleAcknowledge(2)} isPending={isAcknowledging === 2}>
                    {isAcknowledging === 2 ? '✓ Done' : 'Acknowledge'}
                  </Button>
                </div>
                <div className="text-xs text-slate-500 font-space-mono">Today, 06:30 PKT</div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
