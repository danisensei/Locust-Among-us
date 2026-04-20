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
        <div className="text-xs text-[#64748b] mt-1">User roles · Permissions · Activity logs</div>
      </div>

      <Card className="card bg-[#0d1423] border-0 p-4">
        <div className="ctitle mb-4">Team Members</div>
        <table>
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.07)]">
              <th className="px-3 py-2">Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((m) => (
              <tr key={m.name} className="border-b border-[rgba(255,255,255,.03)] hover:bg-[#131d2e]">
                <td className="px-3 py-2 text-sm font-medium">{m.name}</td>
                <td className="text-sm text-[#64748b]">{m.role}</td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${m.status === 'Online' ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                    <span className="text-xs">{m.status}</span>
                  </div>
                </td>
                <td className="text-xs text-[#64748b]">{m.status === 'Online' ? 'now' : '2h ago'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
