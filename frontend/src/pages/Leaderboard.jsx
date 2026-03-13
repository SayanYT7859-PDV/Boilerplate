import { useEffect, useState } from 'react'

import { Trophy } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabaseClient'

function Leaderboard() {
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadLeaderboard() {
      if (!supabase) {
        if (isMounted) {
          setErrorMessage('Supabase is not configured in frontend env variables.')
          setIsLoading(false)
        }
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('email, points')
        .order('points', { ascending: false })
        .limit(10)

      if (!isMounted) {
        return
      }

      if (error) {
        setErrorMessage(error.message)
        setIsLoading(false)
        return
      }

      setRows((data ?? []).map((entry, index) => ({
        rank: index + 1,
        email: entry.email,
        points: Number(entry.points || 0),
      })))
      setIsLoading(false)
    }

    loadLeaderboard()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="grid gap-6">
      <Card className="border bg-card/95 shadow-sm">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Gamification
          </p>
          <CardTitle className="text-3xl">Top 10 Leaderboard</CardTitle>
          <CardDescription>
            Highest scoring users from the Supabase `profiles` table.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {isLoading ? <p className="text-sm text-muted-foreground">Loading leaderboard...</p> : null}
          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

          {!isLoading && !errorMessage && !rows.length ? (
            <p className="text-sm text-muted-foreground">No users found yet.</p>
          ) : null}

          {!isLoading && !errorMessage
            ? rows.map((row) => (
                <article
                  key={row.email}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-secondary/25 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {row.rank}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{row.email}</p>
                      <p className="text-xs text-muted-foreground">Rank #{row.rank}</p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-amber-950">
                    <Trophy className="size-3.5" />
                    {row.points} pts
                  </div>
                </article>
              ))
            : null}
        </CardContent>
      </Card>
    </section>
  )
}

export default Leaderboard