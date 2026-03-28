'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Calendar, Plus } from 'lucide-react'

export default function CyclesTab({ tontineId, onRefreshMeta }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [validatingId, setValidatingId] = useState(null)
  const [adminId, setAdminId] = useState(null)
  const [tontine, setTontine] = useState(null)
  const [cycles, setCycles] = useState([])
  const [activeCycle, setActiveCycle] = useState(null)
  const [contributions, setContributions] = useState([])

  const hasActiveCycle = useMemo(() => !!activeCycle?.id, [activeCycle])

  const memberCount = tontine?.members?.length ?? 0
  const canCreateCycle = memberCount > 0 && !hasActiveCycle

  useEffect(() => {
    if (!tontineId) return
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tontineId])

  const loadData = async () => {
    try {
      setLoading(true)
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

      const [tontineRes, cyclesRes, activeRes] = await Promise.all([
        fetch(`/api/tontines/${tontineId}`, { headers: authHeaders }),
        fetch(`/api/cycles/tontine/${tontineId}`, { headers: authHeaders }),
        fetch(`/api/cycles/active/${tontineId}`, { headers: authHeaders }),
      ])

      const [tontineData, cyclesData, activeData] = await Promise.all([
        tontineRes.json(),
        cyclesRes.json(),
        activeRes.json(),
      ])

      if (tontineData?.error) throw new Error(tontineData.error)
      if (cyclesData?.error) throw new Error(cyclesData.error)
      if (activeData?.error) throw new Error(activeData.error)

      setTontine(tontineData)
      setCycles(cyclesData || [])
      setActiveCycle(activeData || null)

      const { data: authData } = await supabase.auth.getSession()
      setAdminId(authData?.session?.user?.id || null)

      if (activeData?.id) {
        const contribRes = await fetch(`/api/contributions/cycle/${activeData.id}`, {
          headers: authHeaders,
        })
        const contribData = await contribRes.json()
        if (contribData?.error) throw new Error(contribData.error)
        setContributions(contribData || [])
      } else {
        setContributions([])
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de charger les cycles',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getNextBeneficiary = () => {
    if (!tontine?.members?.length) return null
    return tontine.members.find((m) => !m.hasReceived) || null
  }

  const getEndDate = (startDate, frequency) => {
    const endDate = new Date(startDate)
    if (frequency === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1)
      return endDate
    }
    if (frequency === 'weekly') {
      endDate.setDate(endDate.getDate() + 7)
      return endDate
    }
    endDate.setDate(endDate.getDate() + 14)
    return endDate
  }

  const handleCreateCycle = async () => {
    if (!tontine?.id) {
      toast({
        title: 'Données non chargées',
        description: 'Patientez le chargement de la tontine ou actualisez la page.',
        variant: 'destructive',
      })
      return
    }
    if (hasActiveCycle) {
      toast({
        title: 'Action impossible',
        description: 'Un cycle est déjà actif pour cette tontine.',
        variant: 'destructive',
      })
      return
    }

    if (!memberCount) {
      toast({
        title: 'Aucun membre',
        description: 'Ajoutez au moins un membre dans l’onglet « Membres » avant de créer un cycle.',
        variant: 'destructive',
      })
      return
    }

    const nextBeneficiary = getNextBeneficiary()
    if (!nextBeneficiary) {
      toast({
        title: 'Attention',
        description:
          'Aucun bénéficiaire éligible (tous les membres sont marqués comme ayant déjà reçu). Contactez le support ou réinitialisez le statut en base si besoin.',
        variant: 'destructive',
      })
      return
    }

    try {
      setCreating(true)
      const startDate = new Date()
      const endDate = getEndDate(startDate, tontine.frequency)

      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const postHeaders = { 'Content-Type': 'application/json' }
      if (token) postHeaders.Authorization = `Bearer ${token}`

      const res = await fetch('/api/cycles', {
        method: 'POST',
        headers: postHeaders,
        body: JSON.stringify({
          tontineId: tontine.id,
          beneficiaryId: nextBeneficiary.userId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      })

      const data = await res.json()
      if (data?.error) throw new Error(data.error)

      toast({
        title: 'Cycle créé',
        description: `Nouveau cycle pour ${nextBeneficiary.user?.fullName || 'le bénéficiaire'}.`,
      })

      await loadData()
      if (onRefreshMeta) await onRefreshMeta()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Création du cycle impossible',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  const frequencyLabel = (value) =>
    value === 'monthly' ? 'Mensuelle' : value === 'weekly' ? 'Hebdomadaire' : 'Bi-hebdomadaire'

  const pendingValidationContribs = useMemo(
    () => contributions.filter((c) => c.status === 'pending_validation'),
    [contributions]
  )

  const handleValidatePayment = async (contributionId, action) => {
    if (!adminId) {
      toast({
        title: 'Erreur',
        description: 'Session administrateur introuvable.',
        variant: 'destructive',
      })
      return
    }
    try {
      setValidatingId(contributionId)
      const endpoint = action === 'validate' ? 'validate' : 'reject'
      const res = await fetch(`/api/contributions/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contributionId,
          adminId,
          notes: action === 'validate' ? 'Validé par admin' : 'Rejeté par admin',
        }),
      })
      const data = await res.json()
      if (data?.error) throw new Error(data.error)

      toast({
        title: action === 'validate' ? 'Paiement validé' : 'Paiement rejeté',
        description: 'Le statut de la cotisation a été mis à jour.',
      })
      await loadData()
      if (onRefreshMeta) await onRefreshMeta()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Mise à jour impossible',
        variant: 'destructive',
      })
    } finally {
      setValidatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-solidarpay-text">Cycles</h2>
          <p className="text-solidarpay-text/70">
            Gérez les cycles de cotisation{tontine?.frequency ? ` (${frequencyLabel(tontine.frequency)})` : ''}
          </p>
        </div>
        <Button
          type="button"
          className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
          onClick={handleCreateCycle}
          disabled={loading || creating || !canCreateCycle}
        >
          <Plus className="w-4 h-4 mr-2" />
          {creating ? 'Création...' : 'Nouveau cycle'}
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          {loading ? (
            <>
              <Calendar className="w-16 h-16 text-solidarpay-text/30 mb-4" />
              <h3 className="text-lg font-semibold text-solidarpay-text mb-2">Chargement...</h3>
            </>
          ) : cycles.length === 0 ? (
            <>
              <Calendar className="w-16 h-16 text-solidarpay-text/30 mb-4" />
              <h3 className="text-lg font-semibold text-solidarpay-text mb-2">Aucun cycle</h3>
              <p className="text-sm text-solidarpay-text/70 mb-4">Créez votre premier cycle pour commencer</p>
              {!canCreateCycle && !hasActiveCycle && memberCount === 0 ? (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4 max-w-md text-center">
                  Ajoutez d’abord des membres dans l’onglet « Membres » : un cycle nécessite au moins un participant.
                </p>
              ) : null}
              <Button
                type="button"
                className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
                onClick={handleCreateCycle}
                disabled={creating || !canCreateCycle}
              >
                <Plus className="w-4 h-4 mr-2" />
                {creating ? 'Création...' : 'Créer un cycle'}
              </Button>
            </>
          ) : (
            <div className="w-full max-w-3xl space-y-3">
              {cycles.map((cycle) => (
                <div
                  key={cycle.id}
                  className="border rounded-lg p-4 flex items-center justify-between gap-4 bg-white"
                >
                  <div>
                    <p className="font-semibold text-solidarpay-text">Cycle #{cycle.cycleNumber}</p>
                    <p className="text-sm text-solidarpay-text/70">
                      Bénéficiaire: {cycle.beneficiary?.fullName || '—'}
                    </p>
                    <p className="text-xs text-solidarpay-text/60">
                      {new Date(cycle.startDate).toLocaleDateString('fr-FR')} -{' '}
                      {new Date(cycle.endDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Badge variant={cycle.status === 'active' ? 'default' : 'secondary'}>
                    {cycle.status === 'active'
                      ? 'Actif'
                      : cycle.status === 'completed'
                        ? 'Terminé'
                        : 'Annulé'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {hasActiveCycle && (
        <Card>
          <CardHeader>
            <CardTitle>Validation des paiements</CardTitle>
            <CardDescription>
              {pendingValidationContribs.length > 0
                ? `${pendingValidationContribs.length} cotisation(s) en attente de validation pour le cycle actif.`
                : 'Aucune cotisation en attente de validation pour le cycle actif.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingValidationContribs.length === 0 ? (
              <p className="text-sm text-solidarpay-text/70">Les notifications de validation apparaîtront ici.</p>
            ) : (
              <div className="space-y-3">
                {pendingValidationContribs.map((contrib) => (
                  <div
                    key={contrib.id}
                    className="border rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <p className="font-medium">{contrib.user?.fullName || contrib.user?.email || 'Membre'}</p>
                      <p className="text-sm text-solidarpay-text/70">
                        Montant déclaré: {Number(contrib.amount || 0).toFixed(2)} {tontine?.currency || 'CAD'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                        disabled={validatingId !== null}
                        onClick={() => handleValidatePayment(contrib.id, 'reject')}
                      >
                        {validatingId === contrib.id ? '...' : 'Rejeter'}
                      </Button>
                      <Button
                        size="sm"
                        disabled={validatingId !== null}
                        onClick={() => handleValidatePayment(contrib.id, 'validate')}
                      >
                        {validatingId === contrib.id ? '...' : 'Valider'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

