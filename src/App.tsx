import { useAuth } from './contexts/AuthContext'
import { LoginButton } from './components/LoginButton'
import { Dashboard } from './components/Dashboard'

function App() {
  const { isAuthenticated, logout, userEmail } = useAuth()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">torganizerbi</h1>
        {isAuthenticated && (
          <div className="flex items-center gap-3">
            {userEmail && (
              <span className="text-xs text-zinc-400 dark:text-zinc-500 hidden sm:block">
                {userEmail}
              </span>
            )}
            <button
              onClick={logout}
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Abmelden
            </button>
          </div>
        )}
      </header>

      <main className="p-4">
        {!isAuthenticated ? (
          <div className="flex flex-col items-center gap-4 pt-20">
            <p className="text-zinc-500 dark:text-zinc-400">Melde dich an um loszulegen.</p>
            <LoginButton />
          </div>
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  )
}

export default App
