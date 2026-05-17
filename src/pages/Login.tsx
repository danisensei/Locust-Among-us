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
        <div className="w-[600px] h-[600px] rounded-full bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-sky-500/5 dark:from-emerald-500/20 dark:via-teal-500/10 dark:to-sky-500/10 blur-[120px]" />
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
          <div className="pt-8 pb-6 border-b border-border text-center flex flex-col items-center overflow-hidden relative">

            {/* Full-width header background gradient — theme-specific */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.07] via-transparent to-transparent dark:from-emerald-500/[0.12] dark:via-emerald-900/5 dark:to-transparent pointer-events-none" />
            
            {/* The Logo Zone */}
            <motion.div
              initial={{ scale: 0.75, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 160, damping: 14 }}
              className="relative flex items-center justify-center mb-5 w-28 h-28 group"
            >
              {/* ——— DARK MODE LAYERS ——— */}
              {/* Outermost slow-pulse ring */}
              <div className="hidden dark:block absolute w-28 h-28 rounded-full border border-emerald-500/10 animate-[ping_3s_ease-out_infinite] opacity-30" />
              {/* Mid glow halo */}
              <div className="hidden dark:block absolute w-24 h-24 rounded-full bg-emerald-500/[0.18] blur-2xl animate-pulse" />
              {/* Crisp outer ring */}
              <div className="hidden dark:block absolute w-[88px] h-[88px] rounded-full border border-emerald-400/25 group-hover:border-emerald-400/45 transition-all duration-700" />
              {/* Inner ring */}
              <div className="hidden dark:block absolute w-[72px] h-[72px] rounded-full border border-emerald-500/15 group-hover:border-emerald-500/30 transition-all duration-700" />
              {/* Dark glass orb core */}
              <div 
                className="hidden dark:flex absolute w-[68px] h-[68px] rounded-full items-center justify-center overflow-hidden"
                style={{ background: 'radial-gradient(circle at 35% 35%, rgba(16,185,129,0.15) 0%, rgba(2,6,23,0.95) 65%)', boxShadow: 'inset 0 1px 1px rgba(16,185,129,0.2), 0 0 30px rgba(16,185,129,0.12)' }}
              >
                {/* Scanline sweep inside orb */}
                <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,rgba(16,185,129,0.08)_50%,transparent_60%)] animate-[spin_6s_linear_infinite]" />
              </div>

              {/* ——— LIGHT MODE LAYERS ——— */}
              {/* Soft ambient halo */}
              <div className="block dark:hidden absolute w-24 h-24 rounded-full bg-emerald-400/10 blur-2xl animate-pulse" />
              {/* Outer decorative ring */}
              <div className="block dark:hidden absolute w-[88px] h-[88px] rounded-full border border-emerald-400/20 group-hover:border-emerald-400/40 transition-all duration-700" />
              {/* Frosted glass orb core */}
              <div 
                className="block dark:hidden absolute w-[68px] h-[68px] rounded-full"
                style={{ background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95) 0%, rgba(240,253,250,0.7) 60%, rgba(209,250,229,0.4) 100%)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.9), 0 4px 20px rgba(16,185,129,0.1), 0 1px 3px rgba(0,0,0,0.05)' }}
              />

              {/* ——— LOGO IMAGE — adaptive blend ——— */}
              <div className="relative z-10 w-[68px] h-[68px] flex items-center justify-center dark:mix-blend-screen mix-blend-multiply dark:opacity-100 opacity-85 group-hover:scale-110 transition-transform duration-500">
                <img 
                  src="/models/locust-tech-logo.png" 
                  alt="Tech Locust Logo"
                  className="h-14 w-auto object-contain pointer-events-none dark:invert-0 invert"
                  style={{ filter: 'drop-shadow(0 2px 8px rgba(16,185,129,0.35))' }}
                />
              </div>
            </motion.div>

            {/* Wordmark */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.4 }}
              className="space-y-1.5 relative z-10"
            >
              <h1 className="text-[2rem] font-black font-['Outfit'] tracking-tight leading-none bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 dark:from-emerald-300 dark:via-emerald-400 dark:to-sky-400 bg-clip-text text-transparent pb-0.5">
                PestiScope
              </h1>
              <p className="text-[8.5px] font-bold uppercase tracking-[0.28em] text-emerald-700/50 dark:text-emerald-400/40">
                Locust Early Warning &amp; Control System
              </p>
            </motion.div>
          </div>

          {/* Tab switcher */}
          <div className="flex mx-8 mt-6 bg-muted/70 rounded-lg p-1 gap-1">
            {(['login', 'register'] as Tab[]).map((t) => (
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
                  className="overflow-hidden px-1.5 -mx-1.5"
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
