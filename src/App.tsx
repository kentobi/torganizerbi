import { useAuth } from './contexts/AuthContext'
import { LoginButton } from './components/LoginButton'

function App() {
  const { isAuthenticated, logout } = useAuth()

  if (!isAuthenticated) {
    return (
      <div>
        <h1>torganizerbi</h1>
        <LoginButton />
      </div>
    )
  }

  return (
    <div>
      <h1>torganizerbi</h1>
      <button onClick={logout}>Abmelden</button>
      {/* Tasks, Notizen, Kalender kommen hier */}
    </div>
  )
}

export default App
