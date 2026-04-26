import { useMe } from '@/hooks/useAuth'

const AuthLoader = ({ children }) => {
  useMe() // fetches /auth/me and sets full user in store on every app load
  return children
}

export default AuthLoader