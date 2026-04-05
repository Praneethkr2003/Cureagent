'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

type ActiveCaseInfo = {
  session_id: string
  patient_name: string
  age: number
  sex: string
  top_symptoms: string[]
} | null

type ActiveCaseContextType = {
  activeCase: ActiveCaseInfo
  setActiveCase: (caseInfo: ActiveCaseInfo) => void
  clearActiveCase: () => void
}

const ActiveCaseContext = createContext<ActiveCaseContextType | undefined>(undefined)

export function ActiveCaseProvider({ children }: { children: ReactNode }) {
  const [activeCase, setActiveCase] = useState<ActiveCaseInfo>(null)

  const clearActiveCase = () => setActiveCase(null)

  return (
    <ActiveCaseContext.Provider value={{ activeCase, setActiveCase, clearActiveCase }}>
      {children}
    </ActiveCaseContext.Provider>
  )
}

export function useActiveCase() {
  const context = useContext(ActiveCaseContext)
  if (context === undefined) {
    throw new Error('useActiveCase must be used within an ActiveCaseProvider')
  }
  return context
}
