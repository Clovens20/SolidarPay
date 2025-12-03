'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, ArrowLeft } from 'lucide-react'

export default function SearchMembersPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/admin-tontine')}
        className="text-sm text-solidarpay-text/70 hover:text-solidarpay-text flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <Card>
        <CardHeader>
          <CardTitle>Recherche globale de membres</CardTitle>
          <CardDescription>
            Recherchez des membres dans toute la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Search className="w-16 h-16 text-solidarpay-text/30 mb-4" />
          <h3 className="text-lg font-semibold text-solidarpay-text mb-2">
            Recherche globale
          </h3>
          <p className="text-sm text-solidarpay-text/70 mb-4 text-center max-w-md">
            La recherche globale de membres sera disponible prochainement. 
            Pour l'instant, utilisez la recherche dans l'onglet "Membres" de chaque tontine.
          </p>
          <Button
            onClick={() => router.push('/admin-tontine')}
            className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
          >
            Retour à mes tontines
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

