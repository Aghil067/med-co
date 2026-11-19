export function Page({ title, description, action, children }) {
  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        </div>
        {action}
      </header>
      {children}
    </div>
  )
}

export function Panel({ title, children }) {
  return (
    <section className="min-w-0 rounded-2xl border border-border bg-bg-card shadow-[var(--shadow-card)]">
      <h2 className="border-b border-border px-4 py-3 text-sm font-bold sm:px-5">{title}</h2>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

export function Field({ label, children }) {
  return <label className="grid min-w-0 gap-1.5 text-xs font-semibold text-text-secondary">{label}{children}</label>
}

export function Form({ label = 'Save', onSubmit, children, message }) {
  return (
    <form className="workspace-form space-y-4" onSubmit={onSubmit}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button className="workspace-button workspace-primary" type="submit">{label}</button>
        {message && <span role="status" className="text-xs text-text-secondary">{message}</span>}
      </div>
    </form>
  )
}

export function Empty({ children }) {
  return <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-text-secondary">{children}</p>
}
