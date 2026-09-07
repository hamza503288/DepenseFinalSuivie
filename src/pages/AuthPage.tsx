import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Wallet } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { Field, inputClassName } from '@/components/ui/Field'
import { isSupabaseConfigured } from '@/lib/supabase'

export function AuthPage() {
  const { user, signIn, signUp } = useAuth()
  const toast = useToast()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nextErrors: typeof errors = {}
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = 'Adresse email invalide.'
    if (password.length < 6) nextErrors.password = '6 caractères minimum.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    const { error } = mode === 'login' ? await signIn(email, password) : await signUp(email, password)
    setLoading(false)

    if (error) {
      setErrors({ form: error })
      return
    }
    if (mode === 'signup') {
      toast.success('Compte créé ! Vérifiez vos emails si la confirmation est requise.')
    }
  }

  // Une connexion réussie met à jour la session (voir AuthContext), mais ne
  // change pas seule l'URL : c'est cette redirection qui ramène l'utilisateur
  // vers l'application une fois authentifié.
  if (user) return <Navigate to="/" replace />

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-page)] px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white">
            <Wallet size={28} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Masrouf</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Gère tes dépenses à la voix, en darja.
          </p>
        </div>

        {!isSupabaseConfigured && (
          <p className="mb-4 rounded-xl bg-status-warning/15 px-3 py-2 text-center text-xs font-medium text-[var(--text-primary)]">
            Supabase n'est pas encore configuré (voir .env.example) : la connexion ne fonctionnera pas.
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Email" error={errors.email} htmlFor="email">
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputClassName} pl-9`}
                placeholder="toi@exemple.com"
              />
            </div>
          </Field>

          <Field label="Mot de passe" error={errors.password} htmlFor="password">
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                id="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClassName} pl-9`}
                placeholder="••••••••"
              />
            </div>
          </Field>

          {errors.form && <p className="text-sm font-medium text-status-critical">{errors.form}</p>}

          <Button type="submit" loading={loading} fullWidth>
            {mode === 'login' ? 'Se connecter' : 'Créer un compte'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          {mode === 'login' ? "Pas encore de compte ?" : 'Déjà un compte ?'}{' '}
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="font-semibold text-brand-500 hover:underline"
          >
            {mode === 'login' ? "S'inscrire" : 'Se connecter'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
