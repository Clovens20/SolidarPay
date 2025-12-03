'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Wrench, Plus, Calendar, Clock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { logSystemEvent } from '@/lib/system-logger'

export default function MaintenancePage() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    loadSchedules()
  }, [])

  const loadSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_schedule')
        .select('*')
        .order('startTime', { ascending: false })

      if (error) throw error
      setSchedules(data || [])
    } catch (error) {
      console.error('Error loading maintenance schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusBadge = (status) => {
    const variants = {
      scheduled: { variant: 'default', label: 'Planifié' },
      in_progress: { variant: 'default', label: 'En cours' },
      completed: { variant: 'secondary', label: 'Terminé' },
      cancelled: { variant: 'destructive', label: 'Annulé' }
    }
    const config = variants[status] || variants.scheduled
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-solidarpay-text">Maintenance</h1>
          <p className="text-solidarpay-text/70 mt-1">Planifiez et gérez les périodes de maintenance</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle maintenance
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plannings de maintenance</CardTitle>
          <CardDescription>Historique et planifications des maintenances</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solidarpay-primary mx-auto"></div>
              <p className="mt-4 text-solidarpay-text/70">Chargement...</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="w-12 h-12 text-solidarpay-text/30 mx-auto mb-4" />
              <p className="text-solidarpay-text/70">Aucune maintenance planifiée</p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{schedule.title}</h3>
                      {schedule.description && (
                        <p className="text-sm text-solidarpay-text/70 mt-1">{schedule.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-solidarpay-text/70">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Début: {new Date(schedule.startTime).toLocaleString('fr-FR')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Fin: {new Date(schedule.endTime).toLocaleString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      {statusBadge(schedule.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de création */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle maintenance</DialogTitle>
            <DialogDescription>
              Planifiez une nouvelle période de maintenance pour la plateforme
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de la maintenance</Label>
              <Input
                id="title"
                value={newSchedule.title}
                onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                placeholder="Ex: Maintenance mensuelle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newSchedule.description}
                onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                placeholder="Décrivez la raison de cette maintenance..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Date et heure de début</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={newSchedule.startTime}
                onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Date et heure de fin</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={newSchedule.endTime}
                onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateModal(false)
                setNewSchedule({ title: '', description: '', startTime: '', endTime: '' })
              }}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              onClick={async () => {
                try {
                  setSaving(true)
                  const { data: { user } } = await supabase.auth.getUser()

                  if (!newSchedule.title || !newSchedule.startTime || !newSchedule.endTime) {
                    toast({
                      title: 'Erreur',
                      description: 'Veuillez remplir tous les champs obligatoires',
                      variant: 'destructive'
                    })
                    return
                  }

                  const startDate = new Date(newSchedule.startTime)
                  const endDate = new Date(newSchedule.endTime)

                  if (endDate <= startDate) {
                    toast({
                      title: 'Erreur',
                      description: 'La date de fin doit être après la date de début',
                      variant: 'destructive'
                    })
                    return
                  }

                  const { error } = await supabase
                    .from('maintenance_schedule')
                    .insert({
                      title: newSchedule.title,
                      description: newSchedule.description || null,
                      startTime: startDate.toISOString(),
                      endTime: endDate.toISOString(),
                      status: 'scheduled',
                      createdBy: user?.id
                    })

                  if (error) throw error

                  await logSystemEvent('system_maintenance', `Maintenance planifiée: ${newSchedule.title}`, {
                    title: newSchedule.title,
                    startTime: startDate.toISOString(),
                    endTime: endDate.toISOString()
                  }, null, user?.id)

                  toast({
                    title: 'Succès',
                    description: 'Maintenance planifiée avec succès',
                  })

                  setShowCreateModal(false)
                  setNewSchedule({ title: '', description: '', startTime: '', endTime: '' })
                  loadSchedules()
                } catch (error) {
                  console.error('Error creating maintenance:', error)
                  toast({
                    title: 'Erreur',
                    description: 'Impossible de créer la maintenance',
                    variant: 'destructive'
                  })
                } finally {
                  setSaving(false)
                }
              }}
              disabled={saving || !newSchedule.title || !newSchedule.startTime || !newSchedule.endTime}
              className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

