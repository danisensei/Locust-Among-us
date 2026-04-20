import { Card } from '@heroui/react'

export default function FieldReports() {
  const reports = [
    { observer: 'Ahmed Khan', zone: 'Khuzdar District', verified: true },
    { observer: 'Fatima Malik', zone: 'Jacobabad District', verified: true },
    { observer: 'Hassan Ali', zone: 'Hyderabad Region', verified: false },
    { observer: 'Ayesha Siddiqui', zone: 'Quetta Area', verified: true },
  ]

  return (
    <div className="space-y-6 pb-8">
      <div>
        <div className="font-orbitron text-base text-[#e2e8f0]">Field Reports</div>
        <div className="text-xs text-[#64748b] mt-1">Observer submissions · AI verification · Ground truth data</div>
      </div>

      <Card className="card bg-[#0d1423] border-0 p-4">
        <table>
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.07)]">
              <th className="px-3 py-2">Observer</th>
              <th>Zone</th>
              <th>Verification</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.observer} className="border-b border-[rgba(255,255,255,.03)] hover:bg-[#131d2e]">
                <td className="px-3 py-2 text-sm">{r.observer}</td>
                <td className="text-sm text-[#64748b]">{r.zone}</td>
                <td>
                  <span className={`badge ${r.verified ? 'bd-g' : 'bd-a'}`}>
                    {r.verified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="text-xs text-[#64748b]">Today, {Math.floor(Math.random() * 12)}:{String(Math.floor(Math.random() * 60)).padStart(2, '0')} PKT</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
