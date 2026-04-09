import { useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (payload: { title: string; description: string }) => Promise<{ ok: true; error?: string } | { ok: false; error: string }>
}

export default function SuggestionModal({ open, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!open) return null

  const reset = () => {
    setTitle('')
    setDescription('')
    setSubmitError(null)
    setSuccess(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!title.trim() || !description.trim()) return

    setSubmitError(null)
    setSubmitting(true)

    try {
      const result = await onSubmit({ title, description })
      if (!result.ok) {
        setSubmitError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          handleClose()
        }, 2000)
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit suggestion.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-glider-black/30 dark:bg-glider-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="card w-full max-w-lg p-6 space-y-5 shadow-card my-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-glider-black dark:text-glider-darkText">
              Submit a Suggestion
            </h2>
            <p className="text-sm text-glider-gray dark:text-glider-darkMuted mt-0.5">
              Have an idea or spotted a bug? Let us know!
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-glider-gray dark:text-glider-darkMuted hover:text-glider-black dark:hover:text-glider-darkText text-2xl leading-none w-8 h-8 rounded-full hover:bg-glider-light dark:hover:bg-glider-darkPanel2 flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-glider-mint/20 text-glider-olive dark:text-glider-mint mb-3 group-hover:scale-110 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-glider-black dark:text-glider-darkText">Thank You!</h3>
            <p className="text-sm text-glider-gray dark:text-glider-darkMuted mt-1">Your suggestion has been submitted.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            <Field label="Suggestion Title">
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="e.g. Add a dark mode toggle"
              />
            </Field>

            <Field label="Details">
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input min-h-[120px]"
                placeholder="Describe your suggestion or the issue you found..."
              />
            </Field>
          </div>
        )}

        {submitError && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-3 py-2">
            {submitError}
          </div>
        )}

        {!success && (
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={handleClose} className="btn-ghost text-sm" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary text-sm" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Suggestion'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-glider-gray dark:text-glider-darkMuted font-medium mb-1.5">
        {label}
      </span>
      {children}
    </label>
  )
}
