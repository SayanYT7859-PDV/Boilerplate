import { useEffect, useState } from 'react'

import { Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabaseClient'

function LoginPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('sign-in')
  const [authError, setAuthError] = useState(
    supabase ? '' : 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.',
  )
  const [authSuccess, setAuthSuccess] = useState('')
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(supabase))
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showSignInPassword, setShowSignInPassword] = useState(false)
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)

  const [signInForm, setSignInForm] = useState({
    email: '',
    password: '',
  })
  const [signUpForm, setSignUpForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })

  const isBusy = isBootstrapping || isSigningIn || isCreatingAccount || isGoogleLoading

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let isMounted = true

    async function bootstrapSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      if (session?.user) {
        navigate('/', { replace: true })
      }

      if (isMounted) {
        setIsBootstrapping(false)
      }
    }

    bootstrapSession().catch(() => {
      if (isMounted) {
        setIsBootstrapping(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        navigate('/', { replace: true })
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [navigate])

  async function handleGoogleLogin() {
    setAuthError('')
    setAuthSuccess('')

    if (!supabase) {
      setAuthError('Supabase frontend environment variables are missing.')
      return
    }

    setIsGoogleLoading(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    })

    if (error) {
      setAuthError(error.message)
      setIsGoogleLoading(false)
    }
  }

  async function handleSignIn(event) {
    event.preventDefault()
    setAuthError('')
    setAuthSuccess('')

    if (!supabase) {
      setAuthError('Supabase frontend environment variables are missing.')
      return
    }

    const email = signInForm.email.trim().toLowerCase()
    const password = signInForm.password

    if (!email || !password) {
      setAuthError('Email and password are required.')
      return
    }

    setIsSigningIn(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setAuthError(error.message)
      setIsSigningIn(false)
      return
    }

    setAuthSuccess('Signed in successfully. Redirecting...')
    setIsSigningIn(false)
    navigate('/', { replace: true })
  }

  async function handleCreateAccount(event) {
    event.preventDefault()
    setAuthError('')
    setAuthSuccess('')

    if (!supabase) {
      setAuthError('Supabase frontend environment variables are missing.')
      return
    }

    const email = signUpForm.email.trim().toLowerCase()
    const password = signUpForm.password
    const confirmPassword = signUpForm.confirmPassword

    if (!email || !password || !confirmPassword) {
      setAuthError('Email, password, and confirm password are required.')
      return
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.')
      return
    }

    setIsCreatingAccount(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })

    if (error) {
      setAuthError(error.message)
      setIsCreatingAccount(false)
      return
    }

    setAuthSuccess('Account created. Check your email to verify your account, then sign in.')
    setIsCreatingAccount(false)
    setActiveTab('sign-in')
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-xl border-white/60 bg-white/90 shadow-xl backdrop-blur">
        <CardHeader>
          <CardTitle>Welcome to the God Boilerplate</CardTitle>
          <CardDescription>
            Sign in with Google to unlock your modular dashboard and protected app flows.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isBootstrapping ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="sign-in">Sign In</TabsTrigger>
                <TabsTrigger value="create-account">Create Account</TabsTrigger>
              </TabsList>

              <TabsContent value="sign-in" className="space-y-4">
                <form className="space-y-3" onSubmit={handleSignIn}>
                  <label className="space-y-1 block">
                    <span className="text-sm font-medium text-foreground">Email</span>
                    <input
                      type="email"
                      autoComplete="email"
                      value={signInForm.email}
                      onChange={(event) =>
                        setSignInForm((current) => ({ ...current, email: event.target.value }))
                      }
                      className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                      placeholder="you@example.com"
                    />
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-sm font-medium text-foreground">Password</span>
                    <div className="relative">
                      <input
                        type={showSignInPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={signInForm.password}
                        onChange={(event) =>
                          setSignInForm((current) => ({ ...current, password: event.target.value }))
                        }
                        className="h-10 w-full rounded-xl border border-input bg-background px-3 pr-10 text-sm"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword((current) => !current)}
                        className="absolute inset-y-0 right-2 inline-flex items-center text-muted-foreground"
                        aria-label="Toggle sign in password visibility"
                      >
                        {showSignInPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </label>

                  <Button type="submit" className="h-10 w-full" disabled={isBusy}>
                    {isSigningIn ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="create-account" className="space-y-4">
                <form className="space-y-3" onSubmit={handleCreateAccount}>
                  <label className="space-y-1 block">
                    <span className="text-sm font-medium text-foreground">Email</span>
                    <input
                      type="email"
                      autoComplete="email"
                      value={signUpForm.email}
                      onChange={(event) =>
                        setSignUpForm((current) => ({ ...current, email: event.target.value }))
                      }
                      className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                      placeholder="you@example.com"
                    />
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-sm font-medium text-foreground">Password</span>
                    <div className="relative">
                      <input
                        type={showSignUpPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={signUpForm.password}
                        onChange={(event) =>
                          setSignUpForm((current) => ({ ...current, password: event.target.value }))
                        }
                        className="h-10 w-full rounded-xl border border-input bg-background px-3 pr-10 text-sm"
                        placeholder="Minimum 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword((current) => !current)}
                        className="absolute inset-y-0 right-2 inline-flex items-center text-muted-foreground"
                        aria-label="Toggle sign up password visibility"
                      >
                        {showSignUpPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-sm font-medium text-foreground">Confirm Password</span>
                    <div className="relative">
                      <input
                        type={showSignUpPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={signUpForm.confirmPassword}
                        onChange={(event) =>
                          setSignUpForm((current) => ({ ...current, confirmPassword: event.target.value }))
                        }
                        className="h-10 w-full rounded-xl border border-input bg-background px-3 pr-10 text-sm"
                        placeholder="Re-enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword((current) => !current)}
                        className="absolute inset-y-0 right-2 inline-flex items-center text-muted-foreground"
                        aria-label="Toggle confirm password visibility"
                      >
                        {showSignUpPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </label>

                  <Button type="submit" className="h-10 w-full" disabled={isBusy}>
                    {isCreatingAccount ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>

              <Button
                onClick={handleGoogleLogin}
                disabled={isBusy}
                className="mt-3 h-11 w-full text-base"
                variant="outline"
              >
                {isGoogleLoading ? 'Redirecting...' : 'Sign in with Google'}
              </Button>
            </Tabs>
          )}

          {authError ? <p className="text-sm text-destructive">{authError}</p> : null}
          {authSuccess ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{authSuccess}</p> : null}
        </CardContent>
      </Card>
    </section>
  )
}

export default LoginPage