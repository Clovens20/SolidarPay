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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function AddMemberModal({
  user,
  tontineName,
  onConfirm,
  onCancel,
  rotationMax = 1,
  rotationPosition = 1,
  onRotationPositionChange,
  isSubmitting = false,
  maxMembers = null,
  currentMemberCount = 0,
}) {
  if (!user) return null

  const positions = Array.from({ length: rotationMax }, (_, i) => i + 1)

  return (
    <Dialog
      open={!!user}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onCancel?.()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un membre</DialogTitle>
          <DialogDescription>
            Ajouter {user.fullName} à {tontineName} ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4 p-4 bg-solidarpay-bg rounded-lg">
            <div className="w-12 h-12 rounded-full bg-solidarpay-primary flex items-center justify-center text-white text-lg font-semibold">
              {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{user.fullName}</h3>
              <p className="text-sm text-solidarpay-text/70">{user.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-rotation">Position dans la rotation (réception)</Label>
            <Select
              value={String(rotationPosition)}
              onValueChange={(v) => onRotationPositionChange?.(parseInt(v, 10))}
            >
              <SelectTrigger id="add-rotation">
                <SelectValue placeholder="Choisir le rang" />
              </SelectTrigger>
              <SelectContent>
                {positions.map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {p === 1
                      ? `Rang ${p} — première réception`
                      : p === rotationMax
                        ? `Rang ${p} — en fin de liste`
                        : `Rang ${p}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-solidarpay-text/60">
              L’ordre définit qui reçoit en premier la cagnotte du cycle (tour par tour).
            </p>
            {maxMembers != null ? (
              <p className="text-xs text-solidarpay-text/70">
                Capacité de la tontine : {currentMemberCount + 1} / {maxMembers} après cet ajout.
              </p>
            ) : null}
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              Le membre sera ajouté immédiatement à la tontine.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
          >
            {isSubmitting ? 'Ajout…' : 'Confirmer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
