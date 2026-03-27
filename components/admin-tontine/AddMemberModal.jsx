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

export default function AddMemberModal({ user, tontineName, onConfirm, onCancel }) {
  if (!user) return null

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

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              Le membre sera ajouté immédiatement à la tontine (mode MVP sans blocage KYC).
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

