import { createContext, useContext } from 'react'

import { cn } from '@/lib/utils'

const TabsContext = createContext(null)

function Tabs({ value, onValueChange, className, ...props }) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn('w-full', className)} {...props} />
    </TabsContext.Provider>
  )
}

function TabsList({ className, ...props }) {
  return (
    <div
      className={cn(
        'inline-grid h-10 w-full grid-cols-2 items-center rounded-lg border border-border bg-muted p-1',
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({ value, className, ...props }) {
  const context = useTabsContext()
  const isActive = context.value === value

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        isActive
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
        className,
      )}
      onClick={() => context.onValueChange(value)}
      {...props}
    />
  )
}

function TabsContent({ value, className, ...props }) {
  const context = useTabsContext()

  if (context.value !== value) {
    return null
  }

  return <div className={cn('mt-4', className)} {...props} />
}

function useTabsContext() {
  const context = useContext(TabsContext)

  if (!context) {
    throw new Error('Tabs components must be used inside <Tabs>.')
  }

  return context
}

export { Tabs, TabsList, TabsTrigger, TabsContent }