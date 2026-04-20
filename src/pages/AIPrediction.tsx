import { Card, Button } from '@heroui/react'
import { useState } from 'react'

export default function AIPrediction() {
  const [selectedRange, setSelectedRange] = useState('4d')

  return (
    <div className="space-y-6 pb-8">
      <div>
        <div className="font-orbitron text-base text-[#e2e8f0]">AI Risk Prediction</div>
        <div className="text-xs text-slate-400 mt-1">Machine learning forecast · 72-hour risk horizon · ARIMA + Random Forest ensemble</div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button 
          size="sm" 
          variant={selectedRange === '24h' ? 'primary' : 'secondary'}
          onPress={() => setSelectedRange('24h')}
        >
          24 Hours
        </Button>
        <Button 
          size="sm" 
          variant={selectedRange === '4d' ? 'primary' : 'secondary'}
          onPress={() => setSelectedRange('4d')}
        >
          4 Days
        </Button>
        <Button 
          size="sm" 
          variant={selectedRange === '8d' ? 'primary' : 'secondary'}
          onPress={() => setSelectedRange('8d')}
        >
          8 Days
        </Button>
        <Button 
          size="sm" 
          variant="tertiary"
          className="ml-auto"
        >
          📊 Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        {['Today', 'Tomorrow', 'Day 3', 'Day 4'].map((day, idx) => (
          <Card key={day} className="bg-[#0d1423] border-0 p-4">
            <div className="text-sm font-medium font-space-mono text-slate-100 mb-3.5">{day}</div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-orbitron text-2xl font-black" style={{color: [40,65,72,58][idx] > 60 ? '#ef4444' : '#f59e0b'}}>
                {[87, 72, 65, 58][idx]}%
              </span>
              <span className="text-xs text-slate-400">Risk Level</span>
            </div>
            <div className="rounded-full h-1 bg-slate-700 overflow-hidden">
              <div style={{width: `${[87,72,65,58][idx]}%`, background: [40,65,72,58][idx] > 60 ? '#ef4444' : '#f59e0b'}} className="h-full transition-all"></div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="bg-[#0d1423] border-0 p-4">
        <div className="text-sm font-medium font-space-mono text-slate-100 mb-3.5">8-Day Forecast</div>
        <div className="grid grid-cols-8 gap-1">
          {Array.from({length:8}, (_, i) => {
            const riskColor = Math.random() > 0.7 ? 'rgba(239,68,68,.38)' : Math.random() > 0.4 ? 'rgba(245,158,11,.38)' : 'rgba(16,185,129,.28)';
            const bgColor = Math.random() > 0.7 ? 'rgba(239,68,68,.07)' : Math.random() > 0.4 ? 'rgba(245,158,11,.07)' : 'rgba(16,185,129,.05)';
            const textColor = Math.random() > 0.7 ? '#ef4444' : Math.random() > 0.4 ? '#f59e0b' : '#10b981';
            return (
              <div key={i} className="rounded border p-2 text-center transition-all" style={{borderColor: riskColor, background: bgColor}}>
                <div className="text-xs text-slate-400 font-space-mono mb-1">Day {i+1}</div>
                <div className="text-sm font-black font-orbitron" style={{color: textColor}}>
                  {Math.floor(Math.random() * 100)}%
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  )
}
