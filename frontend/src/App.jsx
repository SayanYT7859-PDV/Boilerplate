import { Navigate, Route, Routes } from 'react-router-dom'

import Navbar from '@/components/Navbar.jsx'
import MapWidget from '@/components/MapWidget.jsx'
import { ThemeProvider } from '@/components/ThemeProvider.jsx'
import { PointsProvider } from '@/context/PointsContext.jsx'
import DirectoryFeed from '@/pages/DirectoryFeed.jsx'
import Leaderboard from '@/pages/Leaderboard.jsx'
import LoginPage from '@/pages/LoginPage.jsx'
import VisionScanner from '@/pages/VisionScanner.jsx'

const routes = [
  {
    path: '/',
    label: 'Home',
    eyebrow: 'Hackathon Boilerplate',
    title: 'Ship fast without locking in a theme.',
    description:
      'This shell keeps routing, content regions, and navigation independent so each feature can evolve as a separate brick.',
  },
  {
    path: '/login',
    label: 'Login',
    element: <LoginPage />,
  },
  {
    path: '/feed',
    label: 'Feed',
    element: <DirectoryFeed />,
  },
  {
    path: '/gamification',
    label: 'Gamification',
    element: <Leaderboard />,
  },
  {
    path: '/ai-vision',
    label: 'AI Vision',
    element: <VisionScanner />,
  },
]

const homeLocations = [
  { lat: 40.7128, lng: -74.006, title: 'Downtown Hub' },
  { lat: 40.73061, lng: -73.935242, title: 'East Node' },
  { lat: 40.758, lng: -73.9855, title: 'Central Ops' },
]

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <PointsProvider email="hacker@test.com">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(74,163,223,0.12),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(242,246,250,1))] dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.15),_transparent_35%),linear-gradient(180deg,_rgba(11,16,28,1),_rgba(8,12,22,1))]">
          <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
            <Navbar routes={routes} />
            <main className="flex-1 py-8">
              <Routes>
                {routes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={route.element ?? <RoutePanel route={route} />}
                  />
                ))}
                <Route path="*" element={<Navigate replace to="/" />} />
              </Routes>
            </main>
          </div>
        </div>
      </PointsProvider>
    </ThemeProvider>
  )
}

function RoutePanel({ route }) {
  const isHomeRoute = route.path === '/'

  return (
    <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <article className="rounded-[2rem] border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          {route.eyebrow}
        </p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
          {route.title}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          {route.description}
        </p>

        {isHomeRoute ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium text-foreground">Map Widget Preview</p>
            <MapWidget locations={homeLocations} />
          </div>
        ) : null}
      </article>

      <aside className="rounded-[2rem] border bg-secondary/60 p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-secondary-foreground">
          Lego brick contract
        </p>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
          <li>Route metadata is centralized in one array.</li>
          <li>Navigation renders from the same source of truth.</li>
          <li>Layout and page content stay replaceable without router changes.</li>
          <li>Each feature can graduate into its own component or lazy module later.</li>
        </ul>
      </aside>
    </section>
  )
}

export default App
