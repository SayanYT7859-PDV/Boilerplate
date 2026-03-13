import { cloneElement, createContext, isValidElement, useContext } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'

const DialogContext = createContext(null)

function Dialog({ open, onOpenChange, children }) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

function DialogTrigger({ asChild = false, children }) {
  const context = useDialogContext()

  if (asChild && children) {
    return cloneAsTrigger(children, () => context.onOpenChange(true))
  }

  return <button onClick={() => context.onOpenChange(true)}>{children}</button>
}

function DialogContent({ className, children }) {
  const context = useDialogContext()

  if (!context.open) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <button
        className="absolute inset-0"
        aria-label="Close dialog"
        onClick={() => context.onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl',
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

function DialogHeader({ className, ...props }) {
  return <div className={cn('space-y-2', className)} {...props} />
}

function DialogTitle({ className, ...props }) {
  return <h3 className={cn('text-xl font-semibold tracking-tight', className)} {...props} />
}

function DialogDescription({ className, ...props }) {
  return <p className={cn('text-sm leading-6 text-muted-foreground', className)} {...props} />
}

function DialogFooter({ className, ...props }) {
  return <div className={cn('mt-6 flex justify-end gap-3', className)} {...props} />
}

function DialogClose({ asChild = false, children }) {
  const context = useDialogContext()

  if (asChild && children) {
    return cloneAsTrigger(children, () => context.onOpenChange(false))
  }

  return <button onClick={() => context.onOpenChange(false)}>{children}</button>
}

function useDialogContext() {
  const context = useContext(DialogContext)

  if (!context) {
    throw new Error('Dialog components must be used inside <Dialog>.')
  }

  return context
}

function cloneAsTrigger(child, onClickHandler) {
  if (!isValidElement(child)) {
    return null
  }

  return cloneElement(child, {
    onClick: (event) => {
      child.props?.onClick?.(event)
      onClickHandler()
    },
  })
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
}