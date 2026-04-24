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
  { value: 'analyst',       label: 'Analyst',       desc: 'View maps, risk zones & reports' },
  { value: 'field_officer', label: 'Field Officer',  desc: 'Submit field observations' },
  { value: 'admin',         label: 'Admin',          desc: 'Full system access' },
]

// ── Component ─────────────────────────────────────────────────
export default function Login() {
  const { login, register } = useAuth()

  const [tab,       setTab]       = useState<Tab>('login')
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [role,      setRole]      = useState('analyst')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

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
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#060910]">

      {/* Ambient grid pattern */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(245,158,11,0.03) 1px,transparent 1px),' +
            'linear-gradient(90deg,rgba(245,158,11,0.03) 1px,transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      {/* Radial glow behind the card */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Glassmorphism card */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/6 text-center">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="text-5xl mb-3"
            >
              🦗
            </motion.div>
            <h1 className="text-xl font-bold text-white tracking-tight">LC-EWS</h1>
            <p className="text-sm text-white/40 mt-1">Locust Early Warning System</p>
            <p className="text-xs text-white/25 mt-0.5">Dept. of Plant Protection · Pakistan</p>
          </div>

          {/* Tab switcher */}
          <div className="flex mx-8 mt-6 bg-white/5 rounded-lg p-1 gap-1">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null) }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  tab === t
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                    : 'text-white/50 hover:text-white/80'
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
                    <Label className="text-white/60 text-xs uppercase tracking-wider">Full Name</Label>
                    <Input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Khalid Ahmad"
                      required={tab === 'register'}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-amber-500/60 focus:ring-amber-500/20 h-11"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@dpp.gov.pk"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-amber-500/60 focus:ring-amber-500/20 h-11"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider">Password</Label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-amber-500/60 focus:ring-amber-500/20 h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
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
                  <div className="space-y-2 pt-1">
                    <Label className="text-white/60 text-xs uppercase tracking-wider">Role</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {ROLES.map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setRole(r.value)}
                          className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all duration-150 ${
                            role === r.value
                              ? 'border-amber-500/60 bg-amber-500/10'
                              : 'border-white/8 bg-white/3 hover:border-white/15'
                          }`}
                        >
                          <Shield className={`h-4 w-4 mt-0.5 flex-shrink-0 ${role === r.value ? 'text-amber-400' : 'text-white/30'}`} />
                          <div>
                            <p className={`text-sm font-medium ${role === r.value ? 'text-amber-300' : 'text-white/70'}`}>{r.label}</p>
                            <p className="text-xs text-white/30 mt-0.5">{r.desc}</p>
                          </div>
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
              className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm shadow-lg shadow-amber-500/20 transition-all duration-200 hover:shadow-amber-500/40 hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : tab === 'login' ? 'Sign In' : 'Create Account'
              }
            </Button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-white/20">
              Protected system · Authorized personnel only
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
