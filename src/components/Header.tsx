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
          <div className="text-xs text-[#64748b] tracking-wider uppercase">Locust Early Warning System</div>
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        <span className="pill pill-g">
          <span className="dot"></span>
          AI Engine Online
        </span>
        <span className="pill pill-a">
          <span className="dot"></span>
          3 Active Swarms
        </span>
        <span className="pill pill-g">
          <span className="dot"></span>
          Cloud: AWS-ap-south-1
        </span>
        <span className="font-mono-space text-xs text-[#64748b]">{time}</span>
      </div>
    </header>
  )
}
