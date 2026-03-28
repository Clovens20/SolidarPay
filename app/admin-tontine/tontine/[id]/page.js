'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Trash2 } from 'lucide-react'
import OverviewTab from '@/components/admin-tontine/OverviewTab'
import MembersTab from '@/components/admin-tontine/MembersTab'
import CyclesTab from '@/components/admin-tontine/CyclesTab'
import SettingsTab from '@/components/admin-tontine/SettingsTab'
import CommunicationTab from '@/components/admin-tontine/CommunicationTab'

export default function ManageTontinePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [tontine, setTontine] = useState(null)
  const [pendingValidationCount, setPendingValidationCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadTontine()
    }
  }, [params.id])

  const loadTontine = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('tontines')
        .select('*')
        .eq('id', params.id)
        .eq('adminId', session.user.id)
        .single()

      if (error) throw error
      if (!data) {
        router.push('/admin-tontine')
        return
      }

      setTontine(data)

      const { data: activeCycles, error: activeCyclesError } = await supabase
        .from('cycles')
        .select('id')
        .eq('tontineId', data.id)
        .eq('status', 'active')

      if (activeCyclesError) throw activeCyclesError

      const activeCycleIds = (activeCycles || []).map((c) => c.id)
      if (activeCycleIds.length === 0) {
        setPendingValidationCount(0)
      } else {
        const { count, error: pendingErr } = await supabase
          .from('contributions')
          .select('id', { count: 'exact', head: true })
          .in('cycleId', activeCycleIds)
          .eq('status', 'pending_validation')

        if (pendingErr) throw pendingErr
        setPendingValidationCount(count || 0)
      }
    } catch (error) {
      console.error('Error loading tontine:', error)
      router.push('/admin-tontine')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTontine = async () => {
    if (!tontine) return

    try {
      setDeleting(true)

      // Vérifier s'il y a des cycles actifs
      const { data: activeCycles } = await supabase
        .from('cycles')
        .select('id')
        .eq('tontineId', tontine.id)
        .eq('status', 'active')
        .limit(1)

      if (activeCycles && activeCycles.length > 0) {
        toast({
          title: 'Action impossible',
          description: 'Vous ne pouvez pas supprimer une tontine avec des cycles actifs. Terminez ou annulez d\'abord les cycles actifs.',
          variant: 'destructive'
        })
        setShowDeleteDialog(false)
        setDeleting(false)
        return
      }

      // Supprimer la tontine (les membres et cycles seront supprimés automatiquement via CASCADE)
      const { error } = await supabase
        .from('tontines')
        .delete()
        .eq('id', tontine.id)

      if (error) throw error

      toast({
        title: 'Tontine supprimée',
        description: 'La tontine a été supprimée avec succès'
      })

      router.push('/admin-tontine')
    } catch (error) {
      console.error('Error deleting tontine:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer la tontine',
        variant: 'destructive'
      })
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solidarpay-primary mx-auto"></div>
          <p className="mt-4 text-solidarpay-text">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!tontine) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <button
            onClick={() => router.push('/admin-tontine')}
            className="text-sm text-solidarpay-text/70 hover:text-solidarpay-text mb-4"
          >
            ← Retour à mes tontines
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-solidarpay-text break-words">{tontine.name}</h1>
          <p className="text-solidarpay-text/70 mt-1">Gérez votre tontine</p>
        </div>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
          className="mt-0 w-full shrink-0 sm:mt-4 sm:w-auto"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Supprimer la tontine
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full min-w-0">
        <TabsList className="flex w-full max-w-full flex-nowrap justify-start gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:thin]">
          <TabsTrigger value="overview" className="shrink-0 basis-auto sm:flex-1">
            Vue d&apos;ensemble
          </TabsTrigger>
          <TabsTrigger value="members" className="shrink-0 basis-auto sm:flex-1">
            Membres
          </TabsTrigger>
          <TabsTrigger value="cycles" className="shrink-0 basis-auto sm:flex-1">
            {pendingValidationCount > 0 ? `Cycles (${pendingValidationCount})` : 'Cycles'}
          </TabsTrigger>
          <TabsTrigger value="communication" className="shrink-0 basis-auto sm:flex-1">
            Communication
          </TabsTrigger>
          <TabsTrigger value="settings" className="shrink-0 basis-auto sm:flex-1">
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab tontine={tontine} onTontineUpdated={loadTontine} />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <MembersTab
            tontineId={tontine.id}
            tontineName={tontine.name}
            tontineStatus={tontine.status}
            paymentMode={tontine.paymentMode}
            currency={tontine.currency}
            kohoReceiverEmail={tontine.kohoReceiverEmail}
            adminId={tontine.adminId}
            maxMembers={tontine.maxMembers}
          />
        </TabsContent>

        <TabsContent value="cycles" className="mt-6">
          <CyclesTab tontineId={tontine.id} onRefreshMeta={loadTontine} />
        </TabsContent>

        <TabsContent value="communication" className="mt-6">
          <CommunicationTab tontineId={tontine.id} tontineName={tontine.name} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SettingsTab tontine={tontine} onUpdate={loadTontine} />
        </TabsContent>
      </Tabs>

      {/* Delete Tontine Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la tontine</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la tontine <strong>{tontine?.name}</strong> ?
              <br /><br />
              Cette action est <strong>irréversible</strong> et supprimera :
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Tous les membres de la tontine</li>
                <li>Tous les cycles et contributions</li>
                <li>Toutes les données associées</li>
              </ul>
              <br />
              <strong>Note :</strong> Vous ne pouvez pas supprimer une tontine avec des cycles actifs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTontine}
              disabled={deleting}
            >
              {deleting ? 'Suppression...' : 'Supprimer définitivement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

