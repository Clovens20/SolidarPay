'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, ShieldCheck } from 'lucide-react'

export default function AddMemberModal({ user, tontineName, onConfirm, onCancel }) {
  if (!user) return null

  const getKYCStatus = (kyc) => {
    if (!kyc || kyc.status !== 'approved') {
      return { label: 'Non vérifié', color: 'destructive' }
    }
    return { label: 'Vérifié', color: 'default', className: 'bg-green-100 text-green-800' }
  }

  const kycInfo = getKYCStatus(user.kyc)

  return (
    <Dialog open={!!user} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un membre</DialogTitle>
          <DialogDescription>
            Ajouter {user.fullName} à {tontineName} ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Member Summary */}
          <div className="flex items-center gap-4 p-4 bg-solidarpay-bg rounded-lg">
            <div className="w-12 h-12 rounded-full bg-solidarpay-primary flex items-center justify-center text-white text-lg font-semibold">
              {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{user.fullName}</h3>
              <p className="text-sm text-solidarpay-text/70">{user.email}</p>
            </div>
          </div>

          {/* KYC Status */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-solidarpay-primary" />
              <span className="text-sm font-medium">Statut KYC:</span>
            </div>
            <Badge className={kycInfo.className || ''} variant={kycInfo.color}>
              <CheckCircle className="w-3 h-3 mr-1" />
              {kycInfo.label}
            </Badge>
          </div>

          {/* Info Note */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              Son document KYC sera accessible dans votre interface une fois ajouté.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
          >
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

