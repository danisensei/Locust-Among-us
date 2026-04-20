import { Card } from '@heroui/react'

export default function DroneOps() {
  const fleetData = [
    { label: 'Total Fleet', value: '12' },
    { label: 'On Mission', value: '4' },
    { label: 'Available', value: '7' },
    { label: 'Battery Avg', value: '76%' },
  ]

  return (
    <div className="space-y-6 pb-8">
      <div>
        <div className="font-orbitron text-base text-[#e2e8f0]">Drone Fleet Operations</div>
        <div className="text-xs text-slate-400 mt-1">Real-time fleet telemetry · Battery health · Mission status</div>
      </div>

      <div className="grid grid-cols-4 gap-3.5">
        {fleetData.map((item) => (
          <Card key={item.label} className="bg-[#0d1423] border-0 p-4 border-l-4 border-l-blue-500">
            <div className="text-2xl font-black font-orbitron text-blue-500">{item.value}</div>
            <div className="text-xs text-slate-400 font-space-mono mt-0.5">{item.label}</div>
          </Card>
        ))}
      </div>

      <Card className="bg-[#0d1423] border-0 p-4">
        <div className="text-sm font-medium font-space-mono text-slate-100 mb-4">Fleet Status</div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.07)]">
                <th className="text-left py-3 px-2 text-xs font-space-mono text-slate-400 font-semibold">Drone ID</th>
                <th className="text-left py-3 px-2 text-xs font-space-mono text-slate-400 font-semibold">Status</th>
                <th className="text-left py-3 px-2 text-xs font-space-mono text-slate-400 font-semibold">Battery</th>
                <th className="text-left py-3 px-2 text-xs font-space-mono text-slate-400 font-semibold">Mission</th>
                <th className="text-left py-3 px-2 text-xs font-space-mono text-slate-400 font-semibold">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {['DPP-Alpha', 'DPP-Beta', 'DPP-Gamma', 'DPP-Delta'].map((drone) => (
                <tr key={drone} className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(13,20,33,0.5)] transition-all">
                  <td className="py-3 px-2 text-sm font-space-mono">{drone}</td>
                  <td className="py-3 px-2">
                    <span className="inline-block bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">Active</span>
                  </td>
                  <td className="py-3 px-2 text-xs">{Math.floor(Math.random() * 40 + 60)}%</td>
                  <td className="py-3 px-2 text-xs">Khuzdar Survey</td>
                  <td className="py-3 px-2 text-xs text-slate-400">{Math.floor(Math.random() * 5)} min ago</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
