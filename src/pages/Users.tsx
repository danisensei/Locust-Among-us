import { Card } from '@heroui/react'

export default function Users() {
  const teamMembers = [
    { name: 'Dr. Muhammad Ali', role: 'Administrator', status: 'Online' },
    { name: 'Fatima Khan', role: 'Field Coordinator', status: 'Online' },
    { name: 'Hassan Ahmed', role: 'Data Analyst', status: 'Offline' },
    { name: 'Aisha Khalid', role: 'AI Specialist', status: 'Online' },
  ]

  return (
    <div className="space-y-6 pb-8">
      <div>
        <div className="font-orbitron text-base text-[#e2e8f0]">Team Management</div>
        <div className="text-xs text-slate-400 mt-1">User roles · Permissions · Activity logs</div>
      </div>

      <Card className="bg-[#0d1423] border-0 p-4">
        <div className="text-sm font-medium font-space-mono text-slate-100 mb-4">Team Members</div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.07)]">
                <th className="text-left py-3 px-2 text-xs font-space-mono text-slate-400 font-semibold">Name</th>
                <th className="text-left py-3 px-2 text-xs font-space-mono text-slate-400 font-semibold">Role</th>
                <th className="text-left py-3 px-2 text-xs font-space-mono text-slate-400 font-semibold">Status</th>
                <th className="text-left py-3 px-2 text-xs font-space-mono text-slate-400 font-semibold">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((m) => (
                <tr key={m.name} className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(13,20,33,0.5)] transition-all">
                  <td className="py-3 px-2 text-sm font-medium">{m.name}</td>
                  <td className="py-3 px-2 text-sm text-slate-400">{m.role}</td>
                  <td className="py-3 px-2">
                    <span className={`inline-block text-xs px-2 py-1 rounded ${
                      m.status === 'Online'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      <span className="inline-block w-2 h-2 rounded-full mr-1.5 bg-current"></span>
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-xs text-slate-400">{m.status === 'Online' ? 'now' : '2h ago'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
