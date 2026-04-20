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
        <div className="text-xs text-slate-400 mt-1">Observer submissions · AI verification · Ground truth data</div>
      </div>

      <Card className="bg-[#0d1423] border-0 p-4">
        <div className="text-sm font-medium font-space-mono text-slate-100 mb-4">Recent Field Reports</div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.07)]">
                <th className="text-left py-3 px-2 text-xs font-space-mono text-slate-400 font-semibold">Observer</th>
                <th className="text-left py-3 px-2 text-xs font-space-mono text-slate-400 font-semibold">Zone</th>
                <th className="text-left py-3 px-2 text-xs font-space-mono text-slate-400 font-semibold">Verification</th>
                <th className="text-left py-3 px-2 text-xs font-space-mono text-slate-400 font-semibold">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.observer} className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(13,20,33,0.5)] transition-all">
                  <td className="py-3 px-2 text-sm">{r.observer}</td>
                  <td className="py-3 px-2 text-sm text-slate-400">{r.zone}</td>
                  <td className="py-3 px-2">
                    <span className={`inline-block text-xs px-2 py-1 rounded ${
                      r.verified
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {r.verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-xs text-slate-400">Today, {Math.floor(Math.random() * 12)}:{String(Math.floor(Math.random() * 60)).padStart(2, '0')} PKT</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
