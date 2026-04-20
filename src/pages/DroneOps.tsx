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
        <div className="text-xs text-[#64748b] mt-1">Real-time fleet telemetry · Battery health · Mission status</div>
      </div>

      <div className="grid grid-cols-4 gap-3.5">
        {fleetData.map((item) => (
          <Card key={item.label} className="scard b bg-[#0d1423] border-0 p-4">
            <div className="sv text-blue-500">{item.value}</div>
            <div className="sl">{item.label}</div>
          </Card>
        ))}
      </div>

      <Card className="card bg-[#0d1423] border-0 p-4">
        <div className="ctitle">Fleet Status</div>
        <table>
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.07)]">
              <th className="px-3 py-2">Drone ID</th>
              <th>Status</th>
              <th>Battery</th>
              <th>Mission</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {['DPP-Alpha', 'DPP-Beta', 'DPP-Gamma', 'DPP-Delta'].map((drone) => (
              <tr key={drone} className="border-b border-[rgba(255,255,255,.03)]">
                <td className="px-3 py-2 font-mono-space text-xs">{drone}</td>
                <td><span className="badge bd-g">Active</span></td>
                <td className="text-xs">{Math.floor(Math.random() * 40 + 60)}%</td>
                <td className="text-xs">Khuzdar Survey</td>
                <td className="text-xs text-[#64748b]">{Math.floor(Math.random() * 5)} min ago</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
