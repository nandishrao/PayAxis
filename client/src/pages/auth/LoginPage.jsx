import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useLogin } from '@/hooks/useAuth'
import ErrorMessage from '@/components/shared/ErrorMessage'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

const demoAccounts = {
  agency: {
    role: 'Agency Admin',
    email: 'alice@agency.com',
    password: 'Agency1234!',
  },
  umbrella: {
    role: 'Umbrella Admin',
    email: 'uma@umbrella.com',
    password: 'Umbrella1234!',
  },
  contractor: {
    role: 'Contractor',
    email: 'charlie@contractor.com',
    password: 'Contractor1234!',
  },
}

const LoginPage = () => {
  const { mutate: login, isPending, error } = useLogin()

  const [selectedRole, setSelectedRole] = useState('agency')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: demoAccounts.agency.email,
      password: demoAccounts.agency.password,
    },
  })

  const handleRoleSelect = (key) => {
    setSelectedRole(key)

    setValue('email', demoAccounts[key].email)
    setValue('password', demoAccounts[key].password)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            PayAxis
          </h1>

          <p className="text-sm text-muted-foreground mt-2">
             Umbrella Payroll Platform
          </p>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-7 shadow-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">
              Welcome Back!!
            </h2>

            <p className="text-sm text-muted-foreground mt-1">
              Select roles to login 
            </p>
          </div>

          <div className="mb-6">
            <p className="text-sm font-medium mb-3">
              Select Demo Role
            </p>

            <div className="grid gap-3">
              {Object.entries(demoAccounts).map(([key, account]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleRoleSelect(key)}
                  className={`text-left border rounded-xl p-4 transition-all duration-200 hover:scale-[1.01]
                    ${
                      selectedRole === key
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/40'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-sm">
                        {account.role}
                      </h3>

                      <p className="text-xs text-muted-foreground mt-1">
                        Click to autofill credentials
                      </p>
                    </div>

                    {selectedRole === key && (
                      <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(login)} className="space-y-4">
            
            <div>
              <label className="text-sm font-medium block mb-1.5">
                Email
              </label>

              <input
                {...register('email')}
                type="email"
                className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />

              {errors.email && (
                <p className="text-xs text-destructive mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">
                Password
              </label>

              <input
                {...register('password')}
                type="password"
                className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />

              {errors.password && (
                <p className="text-xs text-destructive mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && <ErrorMessage error={error} />}

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {isPending ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            No account?{' '}
            <Link
              to="/register"
              className="text-primary hover:underline font-medium"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage