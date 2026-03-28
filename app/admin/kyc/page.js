'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * La vérification par documents (KYC) n’est plus proposée dans SolidarPay.
 */
export default function KycDeprecatedPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin')
  }, [router])

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <p className="text-sm text-solidarpay-text/70">Redirection vers le tableau de bord…</p>
    </div>
  )
}
