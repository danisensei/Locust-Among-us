import { useEffect, useState } from 'react'

export default function Header() {
  const [time, setTime] = useState<string>('—')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Karachi',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        month: 'short',
        day: 'numeric',
      })
      setTime(formatter.format(now))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="relative z-10 flex items-center justify-between px-6 h-14 border-b border-[rgba(255,255,255,0.07)] bg-[rgba(6,9,16,0.95)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
          🦗
        </div>
        <div>
          <div className="font-orbitron text-xs font-black text-amber-500 tracking-widest">LC-EWS</div>
          <div className="font-space-mono text-xs text-[#64748b] tracking-wider uppercase">Locust Early Warning System</div>
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0d1423] border-l border-[#10b981] text-sm text-[#e2e8f0]">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          AI Engine Online
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0d1423] border-l border-[#f59e0b] text-sm text-[#e2e8f0]">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          3 Active Swarms
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0d1423] border-l border-[#10b981] text-sm text-[#e2e8f0]">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Cloud: AWS-ap-south-1
        </div>
        <span className="font-space-mono text-xs text-[#64748b]">{time}</span>
      </div>
    </header>
  )
}
