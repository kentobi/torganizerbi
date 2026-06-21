import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../contexts/AuthContext'

const SCOPES = [
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/calendar',
].join(' ')

export function LoginButton() {
  const { setToken } = useAuth()

  const login = useGoogleLogin({
    scope: SCOPES,
    onSuccess: (response) => setToken(response.access_token),
    onError: () => console.error('Google Login fehlgeschlagen'),
  })

  return (
    <button onClick={() => login()}>
      Mit Google anmelden
    </button>
  )
}
