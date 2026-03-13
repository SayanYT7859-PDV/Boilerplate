import { useMemo, useState } from 'react'

import { Plus, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

const seedItems = [
  {
    id: 'seed-1',
    title: 'Alpha Directory Profile',
    description: 'Starter listing for a local services catalog.',
    imageUrl: 'https://placehold.co/800x500/png?text=Alpha+Profile',
  },
  {
    id: 'seed-2',
    title: 'Beta Team Workspace',
    description: 'Shared card used by a multi-team project pod.',
    imageUrl: 'https://placehold.co/800x500/png?text=Beta+Workspace',
  },
  {
    id: 'seed-3',
    title: 'Gamma Logistics Node',
    description: 'Feed entry describing logistics and distribution metadata.',
    imageUrl: 'https://placehold.co/800x500/png?text=Gamma+Node',
  },
  {
    id: 'seed-4',
    title: 'Delta Research Hub',
    description: 'Directory card for research snapshots and notes.',
    imageUrl: 'https://placehold.co/800x500/png?text=Delta+Hub',
  },
  {
    id: 'seed-5',
    title: 'Epsilon Design Desk',
    description: 'Contains reusable UX artifacts for rapid experiments.',
    imageUrl: 'https://placehold.co/800x500/png?text=Epsilon+Desk',
  },
  {
    id: 'seed-6',
    title: 'Zeta Ops Console',
    description: 'Operational metadata and status panels grouped in one record.',
    imageUrl: 'https://placehold.co/800x500/png?text=Zeta+Console',
  },
]

const initialForm = {
  title: '',
  description: '',
}

function DirectoryFeed() {
  const [items, setItems] = useState(seedItems)
  const [searchTerm, setSearchTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const filteredItems = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()

    if (!normalized) {
      return items
    }

    // O(n) scan over cards; simple and fast for a medium feed on constrained hardware.
    return items.filter((item) => item.title.toLowerCase().includes(normalized))
  }, [items, searchTerm])

  function handleFieldChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleCreateItem(event) {
    event.preventDefault()

    setErrorMessage('')

    const title = form.title.trim()
    const description = form.description.trim()

    if (!title || !description) {
      setErrorMessage('Title and description are required.')
      return
    }

    setIsSaving(true)

    try {
      // Bridge: JSON payload from React form to Express -> Supabase insert.
      const response = await fetch(`${API_BASE_URL}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ title, description }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to create item.')
      }

      const insertedItem = {
        id: payload.item?.id ?? `local-${Date.now()}`,
        title: payload.item?.title ?? title,
        description: payload.item?.description ?? description,
        imageUrl: `https://placehold.co/800x500/png?text=${encodeURIComponent(
          (payload.item?.title ?? title).slice(0, 24),
        )}`,
      }

      // Update UI immediately so no page refresh is needed.
      setItems((currentItems) => [insertedItem, ...currentItems])
      setForm(initialForm)
      setOpen(false)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border bg-card/90 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Directory Feed
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Supabase Persistent Grid</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Search by title, add new items with a modal form, and persist each new card through
              the Express API.
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" />
                Add New Item
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a new directory item</DialogTitle>
                <DialogDescription>
                  This creates a permanent record in your Supabase PostgreSQL `items` table.
                </DialogDescription>
              </DialogHeader>

              <form className="mt-5 space-y-4" onSubmit={handleCreateItem}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="new-item-title">
                    Title
                  </label>
                  <input
                    id="new-item-title"
                    name="title"
                    value={form.title}
                    onChange={handleFieldChange}
                    maxLength={120}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Enter item title"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="new-item-description"
                  >
                    Description
                  </label>
                  <textarea
                    id="new-item-description"
                    name="description"
                    value={form.description}
                    onChange={handleFieldChange}
                    maxLength={1000}
                    className="min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Enter item description"
                  />
                </div>

                {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isSaving}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Item'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative mt-6 max-w-lg">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Search cards by title"
          />
        </div>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="h-44 w-full object-cover"
              loading="lazy"
            />
            <CardHeader>
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.id}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!filteredItems.length ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No cards match your search term.
          </CardContent>
        </Card>
      ) : null}
    </section>
  )
}

export default DirectoryFeed