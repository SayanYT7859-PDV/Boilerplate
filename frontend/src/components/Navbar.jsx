import { useEffect, useMemo, useState } from 'react'

import { Moon, Sparkles, Sun } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTheme } from 'next-themes'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePoints } from '@/context/PointsContext'
import { supabase } from '@/lib/supabaseClient'

function Navbar({ routes }) {
  const { points, isLoading } = usePoints()
  const { resolvedTheme, setTheme } = useTheme()
  const [currentUser, setCurrentUser] = useState(null)

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

      setCurrentUser(session?.user ?? null)
    }

    bootstrapSession().catch(() => undefined)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return
      }

      setCurrentUser(session?.user ?? null)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const visibleRoutes = useMemo(
    () => (currentUser ? routes.filter((route) => route.path !== '/login') : routes),
    [currentUser, routes],
  )

  function toggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  async function handleSignOut() {
    if (!supabase) {
      return
    }

    await supabase.auth.signOut()
  }

  return (
    <header className="rounded-3xl border bg-card/90 p-4 shadow-sm backdrop-blur sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            God Boilerplate
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Modular React shell for low-overhead local builds
          </h1>
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <nav className="flex flex-wrap gap-2" aria-label="Primary navigation">
            {visibleRoutes.map((route) => (
              <NavLink
                key={route.path}
                to={route.path}
                className={({ isActive }) =>
                  [
                    'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-accent',
                  ].join(' ')
                }
              >
                {route.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            ) : null}

            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>

            <Badge className="bg-amber-400 text-amber-950 animate-pulse">
              <Sparkles className="size-3.5" />
              {isLoading ? 'Loading' : points}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar