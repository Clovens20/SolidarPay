'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, AlertCircle } from 'lucide-react'
import KYCDocumentCard from './KYCDocumentCard'

export default function ManualReviewTab({ documents, loading, onExamine }) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solidarpay-primary mx-auto"></div>
        <p className="mt-4 text-solidarpay-text/70">Chargement...</p>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="w-16 h-16 text-solidarpay-text/30 mb-4" />
          <h3 className="text-lg font-semibold text-solidarpay-text mb-2">
            Aucune revue manuelle
          </h3>
          <p className="text-sm text-solidarpay-text/70 text-center max-w-md">
            Excellent ! Tous les documents ont été traités automatiquement ou sont en cours d'analyse.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Documents nécessitant votre attention</p>
            <p>
              Ces documents ont un score entre 50-84% et nécessitent une vérification manuelle. 
              Le système automatique n'a pas pu prendre une décision définitive.
            </p>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <KYCDocumentCard
            key={doc.id}
            document={doc}
            onExamine={() => onExamine(doc)}
          />
        ))}
      </div>
    </div>
  )
}

