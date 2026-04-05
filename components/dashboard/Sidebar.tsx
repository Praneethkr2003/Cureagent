'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { SpecialtyBadge } from './SpecialtyBadge'
import { 
  Activity, 
  Users, 
  FolderOpen, 
  BarChart3, 
  LogOut,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Doctor } from '@/lib/types'
import { useState } from 'react'

type SidebarProps = {
  doctor: Doctor | null
}

const navItems = [
  { href: '/dashboard/queue', label: 'Queue', icon: Users },
  { href: '/dashboard/cases', label: 'All Cases', icon: FolderOpen },
  { href: '/dashboard/metrics', label: 'Metrics', icon: BarChart3 },
]

export function Sidebar({ doctor }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-sidebar">
      {/* Logo and Doctor Info */}
      <div className="flex flex-col gap-4 border-b border-sidebar-border p-4">
        <Link href="/dashboard/queue" className="flex items-center gap-2">
          <Activity className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-primary">CureAgent</span>
        </Link>
        {doctor && (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-sidebar-foreground">
              {doctor.name}
            </span>
            <SpecialtyBadge specialty={doctor.specialty} className="w-fit text-xs" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href === '/dashboard/cases' && pathname.startsWith('/dashboard/cases'))
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-l-2 border-primary bg-sidebar-accent text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          {isLoggingOut ? 'Signing out...' : 'Sign Out'}
        </Button>
      </div>
    </aside>
  )
}
