import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Eye, EyeOff, Loader2, Shield, LogIn, UserPlus } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────
type Tab = 'login' | 'register'

const ROLES = [
  { value: 'analyst', label: 'Analyst', desc: 'View maps, risk zones & reports' },
  { value: 'field_officer', label: 'Field Officer', desc: 'Submit field observations' },
  // { value: 'admin', label: 'Admin', desc: 'Full system access' },
]

// ── Component ─────────────────────────────────────────────────
export default function Login() {
  const { login, register } = useAuth()

  const [tab, setTab] = useState<Tab>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('analyst')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(email, password)
      } else {
        if (!name.trim()) throw new Error('Full name is required')
        await register(name, email, password, role)
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background text-foreground">

      {/* Video Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute w-full h-full object-cover opacity-50 mix-blend-luminosity"
        >
          <source src="/models/locusts.mp4" type="video/mp4" />
        </video>
        {/* Subtle gradient overlay to blend smoothly into the dark theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/40 via-background/60 to-background" />
      </div>

      {/* Ambient grid pattern overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage:
            'linear-gradient(rgba(214,166,68,0.04) 1px,transparent 1px),' +
            'linear-gradient(90deg,rgba(214,166,68,0.04) 1px,transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      {/* Radial glow behind the card */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-primary/20 blur-[100px]" />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Glassmorphism card */}
        <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-border text-center">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="mb-3 flex justify-center h-24 relative"
            >
              {/* Perfectly centered using translate, with a radial mask to hide the hard image edges */}
              <img
                src="/models/locust-tech-logo.png"
                alt="Tech Locust Logo"
                className="absolute top-1/2 left-[50%] -translate-x-1/2 -translate-y-1/2 h-64 w-auto object-contain drop-shadow-2xl pointer-events-none dark:mix-blend-screen mix-blend-normal"
                style={{
                  WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 65%)',
                  maskImage: 'radial-gradient(circle at center, black 30%, transparent 65%)'
                }}
              />
            </motion.div>
            <h1 className="text-3xl font-black font-['Outfit'] text-foreground tracking-tighter mt-8">LC-EWS</h1>
            <p className="text-sm text-muted-foreground mt-1">Locust Early Warning System</p>
          </div>

          {/* Tab switcher */}
          <div className="flex mx-8 mt-6 bg-muted/70 rounded-lg p-1 gap-1">
            {(['login', 'register'] as Tab[])
              .filter(t => t !== 'register') // Commented out registration for now
              .map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(null) }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all duration-200 ${tab === t
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {t === 'login' ? <LogIn className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                  {t === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            <AnimatePresence mode="wait">
              {tab === 'register' && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1.5 pb-4">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Full Name</Label>
                    <Input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Khalid Ahmad"
                      required={tab === 'register'}
                      className="bg-input/60 border-border text-foreground placeholder:text-muted-foreground/60 focus:border-primary/70 focus:ring-primary/20 h-11"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@dpp.gov.pk"
                required
                className="bg-input/60 border-border text-foreground placeholder:text-muted-foreground/60 focus:border-primary/70 focus:ring-primary/20 h-11"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Password</Label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-input/60 border-border text-foreground placeholder:text-muted-foreground/60 focus:border-primary/70 focus:ring-primary/20 h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Role selector — register only */}
            <AnimatePresence mode="wait">
              {tab === 'register' && (
                <motion.div
                  key="role-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-1 pb-1">
                    <div className="flex justify-between items-center">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider">Role</Label>
                      <span className="text-[10px] text-muted-foreground/70">{ROLES.find(r => r.value === role)?.desc}</span>
                    </div>
                    <div className="flex bg-muted/40 p-1 rounded-lg border border-border">
                      {ROLES.map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setRole(r.value)}
                          className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-md transition-all duration-200 ${role === r.value
                            ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                            }`}
                        >
                          <Shield className={`h-3.5 w-3.5 ${role === r.value ? 'text-primary-foreground' : 'opacity-70'}`} />
                          <span className="text-[10px] font-semibold uppercase tracking-wider">{r.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 text-sm"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/15 transition-all duration-200 hover:shadow-primary/25 hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : tab === 'login' ? 'Sign In' : 'Create Account'
              }
            </Button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-muted-foreground/70">
              Protected system · Authorized personnel only
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
