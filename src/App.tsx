import { useAuth } from './contexts/AuthContext'
import { LoginButton } from './components/LoginButton'
import { TasksView } from './components/TasksView'

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
      <TasksView />
    </div>
  )
}

export default App
