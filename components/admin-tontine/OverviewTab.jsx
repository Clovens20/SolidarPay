'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/currency-utils'
import ReceiverDetails from '@/components/tontine/ReceiverDetails'
import { Users, DollarSign, Calendar, TrendingUp, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function OverviewTab({ tontine, onTontineUpdated }) {
  const { toast } = useToast()
  const [stats, setStats] = useState({
    memberCount: 0,
    totalCollected: 0,
    activeCycles: 0,
    completedCycles: 0
  })
  const [loading, setLoading] = useState(true)
  const [maxMembersDraft, setMaxMembersDraft] = useState('')
  const [savingMaxMembers, setSavingMaxMembers] = useState(false)

  useEffect(() => {
    loadStats()
  }, [tontine.id])

  useEffect(() => {
    setMaxMembersDraft(
      tontine.maxMembers != null && Number(tontine.maxMembers) >= 1
        ? String(tontine.maxMembers)
        : ''
    )
  }, [tontine.id, tontine.maxMembers])

  const copyInviteCode = useCallback(async () => {
    const code = tontine.inviteCode
    if (!code) return

    const notifyOk = () =>
      toast({
        title: 'Copié',
        description: 'Code d’invitation copié dans le presse-papiers.',
      })

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(code)
        notifyOk()
        return
      }
      throw new Error('clipboard-api')
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = code
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(ta)
        if (ok) notifyOk()
        else {
          toast({
            title: 'Copie manuelle',
            description: `Copiez ce code : ${code}`,
            variant: 'destructive',
          })
        }
      } catch {
        toast({
          title: 'Copie impossible',
          description: `Sélectionnez le code à la souris ou copiez : ${code}`,
          variant: 'destructive',
        })
      }
    }
  }, [tontine.inviteCode, toast])

  const loadStats = async () => {
    try {
      // Member count
      const { count: memberCount } = await supabase
        .from('tontine_members')
        .select('*', { count: 'exact', head: true })
        .eq('tontineId', tontine.id)

      // Active cycles
      const { data: activeCycles } = await supabase
        .from('cycles')
        .select('totalCollected')
        .eq('tontineId', tontine.id)
        .eq('status', 'active')

      // Completed cycles
      const { count: completedCycles } = await supabase
        .from('cycles')
        .select('*', { count: 'exact', head: true })
        .eq('tontineId', tontine.id)
        .eq('status', 'completed')

      const totalCollected = (activeCycles || []).reduce((sum, cycle) => 
        sum + parseFloat(cycle.totalCollected || 0), 0
      )

      setStats({
        memberCount: memberCount || 0,
        totalCollected,
        activeCycles: activeCycles?.length || 0,
        completedCycles: completedCycles || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveMaxMembers = async () => {
    const raw = maxMembersDraft.trim()
    const value =
      raw === ''
        ? null
        : Math.floor(Number(raw))
    if (raw !== '' && (!Number.isFinite(value) || value < 1)) {
      toast({
        title: 'Valeur invalide',
        description: 'Entrez un entier ≥ 1 ou laissez vide pour aucune limite fixée.',
        variant: 'destructive',
      })
      return
    }
    if (value != null && value < stats.memberCount) {
      toast({
        title: 'Limite trop basse',
        description: `Vous avez déjà ${stats.memberCount} membre(s). La limite doit être au moins égale à ce nombre.`,
        variant: 'destructive',
      })
      return
    }
    setSavingMaxMembers(true)
    try {
      const { error } = await supabase
        .from('tontines')
        .update({ maxMembers: value, updatedAt: new Date().toISOString() })
        .eq('id', tontine.id)
      if (error) throw error
      toast({
        title: 'Capacité mise à jour',
        description:
          value == null
            ? 'Aucune limite fixée : vous pourrez ajouter des membres sans plafond défini.'
            : `Maximum ${value} membre(s).`,
      })
      onTontineUpdated?.()
      loadStats()
    } catch (e) {
      console.error(e)
      const hint =
        e.message?.includes('maxMembers') || e.code === 'PGRST204'
          ? ' Exécutez le script SQL tontines-max-members.sql dans Supabase si la colonne est absente.'
          : ''
      toast({
        title: 'Erreur',
        description: (e.message || 'Enregistrement impossible') + hint,
        variant: 'destructive',
      })
    } finally {
      setSavingMaxMembers(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membres</CardTitle>
            <Users className="w-4 h-4 text-solidarpay-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.memberCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cotisation</CardTitle>
            <DollarSign className="w-4 h-4 text-solidarpay-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(tontine.contributionAmount, tontine.currency || 'CAD')}
            </div>
            <p className="text-xs text-muted-foreground">
              {tontine.frequency === 'monthly' ? 'Par mois' : 
               tontine.frequency === 'biweekly' ? 'Bi-hebdomadaire' : 
               'Par semaine'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total collecté</CardTitle>
            <TrendingUp className="w-4 h-4 text-solidarpay-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalCollected, tontine.currency || 'CAD')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cycles</CardTitle>
            <Calendar className="w-4 h-4 text-solidarpay-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCycles}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedCycles} terminé(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tontine Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de la tontine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-solidarpay-text/70">Nom</p>
              <p className="font-medium">{tontine.name}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-solidarpay-text/70">Code d’invitation (membres)</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <code className="text-sm font-mono bg-solidarpay-bg px-2 py-1 rounded border">
                  {tontine.inviteCode || '—'}
                </code>
                {tontine.inviteCode ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => void copyInviteCode()}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copier
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-solidarpay-text/60 mt-1">
                Les membres peuvent saisir ce code (ou l’identifiant de la tontine) pour demander à rejoindre — vous
                validez dans l’onglet Membres.
              </p>
            </div>
            <div>
              <p className="text-sm text-solidarpay-text/70">Statut</p>
              <Badge variant={tontine.status === 'active' ? 'default' : 'secondary'}>
                {tontine.status === 'active' ? 'Active' : tontine.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-solidarpay-text/70">Fréquence</p>
              <p className="font-medium">
                {tontine.frequency === 'monthly' ? 'Mensuelle' : 
                 tontine.frequency === 'biweekly' ? 'Bi-hebdomadaire' : 
                 'Hebdomadaire'}
              </p>
            </div>
            <div className="sm:col-span-2 rounded-lg border border-solidarpay-primary/20 bg-solidarpay-bg/50 p-4 space-y-3">
              <div>
                <Label htmlFor="max-members">Nombre maximum de membres</Label>
                <p className="text-xs text-solidarpay-text/60 mt-1">
                  Définissez combien de personnes peuvent rejoindre la tontine. Laissez vide pour ne pas fixer de
                  plafond. Dans l’onglet Membres, chaque ajout permet de choisir le rang (tour) dans la rotation.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <Input
                  id="max-members"
                  type="number"
                  min={Math.max(1, stats.memberCount)}
                  step={1}
                  placeholder="Illimité"
                  value={maxMembersDraft}
                  onChange={(e) => setMaxMembersDraft(e.target.value)}
                  className="sm:max-w-[200px]"
                />
                <Button
                  type="button"
                  onClick={() => void saveMaxMembers()}
                  disabled={savingMaxMembers}
                  className="bg-solidarpay-primary hover:bg-solidarpay-secondary w-full sm:w-auto"
                >
                  {savingMaxMembers ? 'Enregistrement…' : 'Enregistrer la capacité'}
                </Button>
              </div>
              <p className="text-xs text-solidarpay-text/60">
                Membres actuels : {stats.memberCount}
                {tontine.maxMembers != null && Number(tontine.maxMembers) >= 1
                  ? ` — limite en base : ${tontine.maxMembers}`
                  : ' — pas de limite en base'}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-solidarpay-text/70">Coordonnées de réception</p>
              <ReceiverDetails raw={tontine.kohoReceiverEmail} />
            </div>
            <div>
              <p className="text-sm text-solidarpay-text/70">Créée le</p>
              <p className="font-medium">
                {new Date(tontine.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

