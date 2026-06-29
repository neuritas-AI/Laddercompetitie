import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-background text-center px-4">
      <div className="space-y-6 max-w-md">
        <div className="text-8xl font-black text-primary/20">404</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">Pagina niet gevonden</h1>
        <p className="text-muted-foreground">
          De pagina die je zoekt bestaat niet of is verplaatst.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Ga naar Dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Aanmelden
          </Link>
        </div>
      </div>
    </div>
  )
}

