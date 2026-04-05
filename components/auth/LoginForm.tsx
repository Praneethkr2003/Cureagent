'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/dashboard/queue')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign in')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/dashboard/queue`,
          data: {
            name: name,
            specialty: specialty || 'General Practice',
          },
        },
      })
      if (error) throw error
      setSuccess('Account created! Check your email to confirm, then sign in.')
      setIsSignUp(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign up')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSignUp) {
    return (
      <form onSubmit={handleSignUp} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-foreground/80">
            Full Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Dr. John Smith"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11"
            disabled={isLoading}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="specialty" className="text-foreground/80">
            Specialty
          </Label>
          <Input
            id="specialty"
            type="text"
            placeholder="Cardiology, General Practice, etc."
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="h-11"
            disabled={isLoading}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-email" className="text-foreground/80">
            Email
          </Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="doctor@hospital.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
            disabled={isLoading}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="signup-password" className="text-foreground/80">
            Password
          </Label>
          <Input
            id="signup-password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
        </div>
        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <Button 
          type="submit" 
          className="h-11 w-full bg-primary hover:bg-primary/90" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false)
              setError(null)
            }}
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </button>
        </p>
      </form>
    )
  }

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-foreground/80">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="doctor@hospital.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11"
          disabled={isLoading}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-foreground/80">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11"
          disabled={isLoading}
        />
      </div>
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-600">
          {success}
        </div>
      )}
      <Button 
        type="submit" 
        className="h-11 w-full bg-primary hover:bg-primary/90" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={() => {
            setIsSignUp(true)
            setError(null)
            setSuccess(null)
          }}
          className="font-medium text-primary hover:underline"
        >
          Sign up
        </button>
      </p>
    </form>
  )
}
