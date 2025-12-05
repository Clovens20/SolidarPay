'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/currency-utils'
import { PiggyBank, Users, TrendingUp, Plus, ArrowRight, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import CompleteProfileModal from '@/components/profile/CompleteProfileModal'

export default function AdminTontineDashboard() {
  const [user, setUser] = useState(null)
  const [tontines, setTontines] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTontineId, setDeleteTontineId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [showCompleteProfile, setShowCompleteProfile] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setUser(userData)
      
      // Vérifier si le profil est complet
      await checkProfileCompletion(userData)

      // Load tontines where user is admin
      const { data: tontinesData, error } = await supabase
        .from('tontines')
        .select(`
          *,
          members:tontine_members(count)
        `)
        .eq('adminId', session.user.id)
        .order('createdAt', { ascending: false })

      if (error) throw error

      // Get member counts
      const tontinesWithCounts = await Promise.all(
        (tontinesData || []).map(async (tontine) => {
          const { count } = await supabase
            .from('tontine_members')
            .select('*', { count: 'exact', head: true })
            .eq('tontineId', tontine.id)

          return {
            ...tontine,
            memberCount: count || 0
          }
        })
      )

      setTontines(tontinesWithCounts)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkProfileCompletion = async (userData) => {
    if (!userData?.id) return

    try {
      // Vérifier si l'utilisateur a un pays
      const needsCountry = !userData.country

      // Vérifier si l'utilisateur a au moins une méthode de paiement active
      const { data: paymentMethods, error } = await supabase
        .from('user_payment_methods')
        .select('id')
        .eq('userId', userData.id)
        .eq('isActive', true)
        .limit(1)

      const hasPayment = paymentMethods && paymentMethods.length > 0

      // Afficher la modal si le profil est incomplet
      if (needsCountry || !hasPayment) {
        setShowCompleteProfile(true)
      }
    } catch (error) {
      console.error('Error checking profile completion:', error)
    }
  }

  const handleProfileComplete = async () => {
    // Recharger les données utilisateur
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (userData) {
        setUser(userData)
      }
    }
    
    // Recharger les méthodes de paiement
    if (user) {
      await checkProfileCompletion(user)
    }
    setShowCompleteProfile(false)
  }

  const handleDeleteTontine = async () => {
    if (!deleteTontineId) return

    try {
      setDeleting(true)

      // Vérifier s'il y a des cycles actifs
      const { data: activeCycles } = await supabase
        .from('cycles')
        .select('id')
        .eq('tontineId', deleteTontineId)
        .eq('status', 'active')
        .limit(1)

      if (activeCycles && activeCycles.length > 0) {
        toast({
          title: 'Action impossible',
          description: 'Vous ne pouvez pas supprimer une tontine avec des cycles actifs. Terminez ou annulez d\'abord les cycles actifs.',
          variant: 'destructive'
        })
        setDeleteTontineId(null)
        setDeleting(false)
        return
      }

      // Supprimer la tontine
      const { error } = await supabase
        .from('tontines')
        .delete()
        .eq('id', deleteTontineId)

      if (error) throw error

      toast({
        title: 'Tontine supprimée',
        description: 'La tontine a été supprimée avec succès'
      })

      setDeleteTontineId(null)
      loadData() // Recharger la liste
    } catch (error) {
      console.error('Error deleting tontine:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer la tontine',
        variant: 'destructive'
      })
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      active: { variant: 'default', label: 'Active', color: 'bg-green-100 text-green-800' },
      suspended: { variant: 'secondary', label: 'Suspendue', color: 'bg-yellow-100 text-yellow-800' },
      completed: { variant: 'secondary', label: 'Terminée', color: 'bg-gray-100 text-gray-800' }
    }
    const config = variants[status] || variants.active
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
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

  return (
    <>
      {/* Modal de complétion du profil */}
      {user && (
        <CompleteProfileModal
          user={user}
          open={showCompleteProfile}
          onComplete={handleProfileComplete}
        />
      )}
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-solidarpay-text">Mes Tontines</h1>
          <p className="text-solidarpay-text/70 mt-1">Gérez vos tontines et leurs membres</p>
        </div>
        <Button 
          onClick={() => router.push('/admin-tontine/new')}
          className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Créer une tontine
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tontines</CardTitle>
            <PiggyBank className="w-4 h-4 text-solidarpay-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tontines.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Membres</CardTitle>
            <Users className="w-4 h-4 text-solidarpay-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tontines.reduce((sum, t) => sum + (t.memberCount || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tontines Actives</CardTitle>
            <TrendingUp className="w-4 h-4 text-solidarpay-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tontines.filter(t => t.status === 'active').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tontines List */}
      {tontines.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PiggyBank className="w-16 h-16 text-solidarpay-text/30 mb-4" />
            <h3 className="text-lg font-semibold text-solidarpay-text mb-2">
              Aucune tontine
            </h3>
            <p className="text-sm text-solidarpay-text/70 mb-4">
              Créez votre première tontine pour commencer
            </p>
            <Button 
              onClick={() => router.push('/admin-tontine/new')}
              className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer une tontine
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tontines.map((tontine) => (
            <Card 
              key={tontine.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/admin-tontine/tontine/${tontine.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{tontine.name}</CardTitle>
                  {getStatusBadge(tontine.status)}
                </div>
                <CardDescription>
                  Créée le {new Date(tontine.createdAt).toLocaleDateString('fr-FR')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-solidarpay-text/70">Cotisation:</span>
                    <span className="font-semibold">
                      {formatCurrency(tontine.contributionAmount, tontine.currency || 'CAD')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-solidarpay-text/70">Fréquence:</span>
                    <span className="font-semibold">
                      {tontine.frequency === 'monthly' ? 'Mensuelle' : 
                       tontine.frequency === 'biweekly' ? 'Bi-hebdomadaire' : 
                       'Hebdomadaire'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-solidarpay-text/70">Membres:</span>
                    <span className="font-semibold">{tontine.memberCount || 0}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/admin-tontine/tontine/${tontine.id}`)
                    }}
                  >
                    Gérer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteTontineId(tontine.id)
                    }}
                    title="Supprimer la tontine"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Tontine Dialog */}
      <Dialog open={!!deleteTontineId} onOpenChange={(open) => !open && setDeleteTontineId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la tontine</DialogTitle>
            <DialogDescription>
              {deleteTontineId && (() => {
                const tontine = tontines.find(t => t.id === deleteTontineId)
                return (
                  <>
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
                  </>
                )
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteTontineId(null)}
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
    </>
  )
}

