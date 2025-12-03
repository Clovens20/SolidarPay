'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, X, ZoomIn, ZoomOut } from 'lucide-react'

export default function KYCDocumentModal({ member, tontineName, onClose }) {
  const [zoom, setZoom] = useState(1)

  if (!member || !member.kyc) return null

  const kyc = member.kyc
  const user = member.user

  const handleDownload = async () => {
    try {
      // Create watermark and download
      // This is a simplified version - in production, you'd want to add watermark server-side
      const link = document.createElement('a')
      link.href = kyc.documentUrl
      link.download = `kyc_${user.fullName}_${tontineName}.pdf`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Log access
      // In production, log this to your system_logs table
      console.log('KYC document accessed', {
        userId: user.id,
        tontineName,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error downloading document:', error)
    }
  }

  const documentTypeLabel = {
    identity: 'Pièce d\'identité',
    proof_of_address: 'Justificatif de domicile',
    selfie: 'Selfie'
  }

  return (
    <Dialog open={!!member} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Document KYC de {user.fullName}</DialogTitle>
          <DialogDescription>
            Document confidentiel - {tontineName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Member Info */}
          <div className="p-4 bg-solidarpay-bg rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-solidarpay-primary flex items-center justify-center text-white text-lg font-semibold">
                {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{user.fullName}</h3>
                <p className="text-sm text-solidarpay-text/70">{user.email}</p>
                {user.phone && (
                  <p className="text-sm text-solidarpay-text/70">{user.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Document Info */}
          <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
            <div>
              <p className="text-sm text-solidarpay-text/70">Type de document</p>
              <p className="font-medium">{documentTypeLabel[kyc.documentType] || kyc.documentType}</p>
            </div>
            <div>
              <p className="text-sm text-solidarpay-text/70">Statut</p>
              <Badge className="bg-green-100 text-green-800">
                Vérifié et approuvé
              </Badge>
            </div>
            <div>
              <p className="text-sm text-solidarpay-text/70">Date de vérification</p>
              <p className="font-medium">
                {new Date(kyc.reviewedAt || kyc.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-solidarpay-text/70">Approuvé par</p>
              <p className="font-medium">Super Admin</p>
            </div>
          </div>

          {/* Document Image */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Document</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-solidarpay-text/70">{Math.round(zoom * 100)}%</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                  disabled={zoom >= 2}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="overflow-auto max-h-96 flex items-center justify-center">
              <img
                src={kyc.documentUrl}
                alt={`Document KYC - ${user.fullName}`}
                className="max-w-full h-auto"
                style={{ transform: `scale(${zoom})` }}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999"%3EDocument non disponible%3C/text%3E%3C/svg%3E'
                }}
              />
            </div>
          </div>

          {/* Confidentiality Note */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-900">
              <strong>Confidentiel:</strong> Ce document est confidentiel et réservé à la gestion de cette tontine. 
              Toute divulgation non autorisée est interdite.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
            <Button
              onClick={handleDownload}
              className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger (avec watermark)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

