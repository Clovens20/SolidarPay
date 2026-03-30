'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchEnabledPaymentCountries } from '@/lib/fetch-enabled-countries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, MoreVertical, UserMinus, User, Landmark } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import AddMemberModal from './AddMemberModal'
import { getCurrencyInfo } from '@/lib/currency-utils'
import {
  receiverFieldModeForCountry,
  serializeChileReceiver,
  isDirectPerMemberStorage,
  parseReceiverStorage,
} from '@/lib/tontine-receiver'

/** Évite les doublons (tontineId, userId) si les UUID ne sont pas typés pareil côté client. */
function normalizeUserId(id) {
  return String(id || '')
    .trim()
    .toLowerCase()
}

const ROTATION_SHIFT_OFFSET = 100000

export default function MembersTab({
  tontineId,
  tontineName,
  tontineStatus,
  paymentMode,
  currency,
  kohoReceiverEmail,
  adminId,
  maxMembers: maxMembersProp,
}) {
  const [selectedCountry, setSelectedCountry] = useState('all') // 'all' pour permettre tontines inter-pays
  const [searchTerm, setSearchTerm] = useState('')
  const [candidateUsers, setCandidateUsers] = useState([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const skipAutoCountryRef = useRef(false)
  const [members, setMembers] = useState([])
  const [countries, setCountries] = useState([])
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [loading, setLoading] = useState(false)
  const [adminProfileReady, setAdminProfileReady] = useState(false)
  const [addMemberModal, setAddMemberModal] = useState(null)
  const [removeMemberId, setRemoveMemberId] = useState(null)
  const [removeMemberInfo, setRemoveMemberInfo] = useState(null)
  const [hasActiveCycles, setHasActiveCycles] = useState(false)
  const [adminCountry, setAdminCountry] = useState(null)
  const [receiverEditMember, setReceiverEditMember] = useState(null)
  const [receiverForm, setReceiverForm] = useState({
    clRut: '',
    clBank: '',
    clAccountType: '',
    clAccountNumber: '',
    emailOrId: '',
  })
  const [savingReceiver, setSavingReceiver] = useState(false)
  const [joinRequests, setJoinRequests] = useState([])
  const [joinRequestActionId, setJoinRequestActionId] = useState(null)
  const [joinRequestToAccept, setJoinRequestToAccept] = useState(null)
  const [joinRotationPosition, setJoinRotationPosition] = useState(1)
  const [addMemberRotationPosition, setAddMemberRotationPosition] = useState(1)
  const [memberActionLoading, setMemberActionLoading] = useState(false)
  const { toast } = useToast()

  const maxMembers =
    maxMembersProp != null && Number(maxMembersProp) >= 1 ? Number(maxMembersProp) : null

  const showDirectPerMember =
    paymentMode === 'direct' && isDirectPerMemberStorage(kohoReceiverEmail)
  const receiverMode = receiverFieldModeForCountry(adminCountry)
  const currencyCode = currency || 'CAD'
  const currencyInfo = getCurrencyInfo(currencyCode)

  useEffect(() => {
    loadCountries()
    loadMembers()
    checkActiveCycles()
    loadJoinRequests()
  }, [tontineId])

  useEffect(() => {
    if (!adminId) {
      setAdminCountry(null)
      setAdminProfileReady(true)
      return
    }
    setAdminProfileReady(false)
    let cancelled = false
    ;(async () => {
      const { data } = await supabase.from('users').select('country').eq('id', adminId).maybeSingle()
      if (cancelled) return
      const c = data?.country || null
      setAdminCountry(c)
      if (c && !skipAutoCountryRef.current) {
        setSelectedCountry(c)
      }
      setAdminProfileReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [adminId])

  const existingMemberIds = useMemo(
    () => new Set(members.map((m) => normalizeUserId(m.userId))),
    [members]
  )

  const filteredCandidates = useMemo(() => {
    const t = searchTerm.trim().toLowerCase()
    let list = candidateUsers
    if (t) {
      list = list.filter(
        (u) =>
          (u.fullName && u.fullName.toLowerCase().includes(t)) ||
          (u.email && u.email.toLowerCase().includes(t))
      )
    }
    return list.map((u) => ({
      ...u,
      isAlreadyMember: existingMemberIds.has(normalizeUserId(u.id)),
    }))
  }, [candidateUsers, searchTerm, existingMemberIds])

  const loadCandidates = useCallback(async () => {
    if (!tontineId || !adminProfileReady) return
    setLoadingCandidates(true)
    try {
      let q = supabase
        .from('users')
        .select('id, email, fullName, phone, country, role')
        .eq('role', 'member')

      if (adminId) {
        q = q.neq('id', adminId)
      }

      if (selectedCountry && selectedCountry !== 'all') {
        q = q.eq('country', selectedCountry)
      }

      const { data: users, error } = await q.order('fullName', { ascending: true }).limit(400)

      if (error) throw error

      setCandidateUsers(users || [])
    } catch (error) {
      console.error('loadCandidates:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de charger la liste des membres',
        variant: 'destructive',
      })
      setCandidateUsers([])
    } finally {
      setLoadingCandidates(false)
    }
  }, [tontineId, selectedCountry, adminId, adminProfileReady, toast])

  useEffect(() => {
    void loadCandidates()
  }, [loadCandidates])

  const checkActiveCycles = async () => {
    try {
      const { data, error } = await supabase
        .from('cycles')
        .select('id')
        .eq('tontineId', tontineId)
        .eq('status', 'active')
        .limit(1)

      if (error) throw error
      setHasActiveCycles((data && data.length > 0) || false)
    } catch (error) {
      console.error('Error checking active cycles:', error)
      setHasActiveCycles(false)
    }
  }

  const loadCountries = async () => {
    try {
      setLoadingCountries(true)
      const data = await fetchEnabledPaymentCountries()
      setCountries(data || [])
      
      if (!data || data.length === 0) {
        console.warn('No countries found in database')
        toast({
          title: 'Aucun pays disponible',
          description: 'Aucun pays n\'a été configuré. Contactez le super admin.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error loading countries:', error)
      toast({
        title: 'Erreur',
        description: 'Erreur lors du chargement des pays: ' + error.message,
        variant: 'destructive'
      })
      setCountries([])
    } finally {
      setLoadingCountries(false)
    }
  }

  const loadMembers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tontine_members')
        .select(`
          *,
          user:userId (
            id,
            email,
            fullName,
            phone,
            country
          )
        `)
        .eq('tontineId', tontineId)
        .order('rotationOrder', { ascending: true })

      if (error) throw error

      setMembers(data || [])
    } catch (error) {
      console.error('Error loading members:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les membres',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadJoinRequests = async () => {
    try {
      const { data: reqs, error } = await supabase
        .from('tontine_join_requests')
        .select('id, message, createdAt, userId')
        .eq('tontineId', tontineId)
        .eq('status', 'pending')
        .order('createdAt', { ascending: true })

      if (error) throw error
      const uids = [...new Set((reqs || []).map((r) => r.userId))]
      let byId = {}
      if (uids.length) {
        const { data: users } = await supabase
          .from('users')
          .select('id, fullName, email')
          .in('id', uids)
        byId = Object.fromEntries((users || []).map((u) => [u.id, u]))
      }
      setJoinRequests(
        (reqs || []).map((r) => ({
          ...r,
          requester: byId[r.userId],
        }))
      )
    } catch (e) {
      console.error('Error loading join requests:', e)
      setJoinRequests([])
    }
  }

  /** Insère un membre à un rang (1 = première réception), sans violer l’unicité sur rotationOrder. */
  const insertMemberAtRotationPosition = async (userId, desiredPosition) => {
    const uidNorm = normalizeUserId(userId)

    const { data: dupRow, error: dupErr } = await supabase
      .from('tontine_members')
      .select('id')
      .eq('tontineId', tontineId)
      .eq('userId', userId)
      .maybeSingle()
    if (dupErr) throw dupErr
    if (dupRow) {
      throw new Error('Ce membre fait déjà partie de la tontine.')
    }

    if (maxMembers != null) {
      const { count, error: cErr } = await supabase
        .from('tontine_members')
        .select('*', { count: 'exact', head: true })
        .eq('tontineId', tontineId)
      if (cErr) throw cErr
      if ((count || 0) >= maxMembers) {
        throw new Error(
          `La tontine est complète : ${maxMembers} membre(s) maximum. Augmentez la limite dans la vue d’ensemble.`
        )
      }
    }

    const { data: rows, error: fetchErr } = await supabase
      .from('tontine_members')
      .select('id, userId, rotationOrder')
      .eq('tontineId', tontineId)
      .order('rotationOrder', { ascending: true })

    if (fetchErr) throw fetchErr
    const sorted = [...(rows || [])].sort((a, b) => a.rotationOrder - b.rotationOrder)
    if (sorted.some((r) => normalizeUserId(r.userId) === uidNorm)) {
      throw new Error('Ce membre fait déjà partie de la tontine.')
    }

    const n = sorted.length
    const pos = Math.min(Math.max(1, Number(desiredPosition) || n + 1), n + 1)

    for (const row of sorted) {
      if (row.rotationOrder >= pos) {
        const { error: upErr } = await supabase
          .from('tontine_members')
          .update({ rotationOrder: row.rotationOrder + ROTATION_SHIFT_OFFSET })
          .eq('id', row.id)
        if (upErr) {
          if (upErr.code === '23505') {
            throw new Error('Conflit sur l’ordre de rotation. Actualisez la page et réessayez.')
          }
          throw upErr
        }
      }
    }

    const { error: insErr } = await supabase.from('tontine_members').insert({
      tontineId,
      userId,
      rotationOrder: pos,
    })
    if (insErr) {
      if (insErr.code === '23505') {
        const msg = String(insErr.message || '')
        if (msg.includes('userId') || msg.includes('user_id')) {
          throw new Error('Ce membre fait déjà partie de la tontine.')
        }
        if (msg.includes('rotationOrder') || msg.includes('rotation_order')) {
          throw new Error('Ce rang est déjà pris. Actualisez et choisissez un autre rang.')
        }
      }
      throw insErr
    }

    const { data: afterRows, error: afterErr } = await supabase
      .from('tontine_members')
      .select('id, rotationOrder')
      .eq('tontineId', tontineId)
    if (afterErr) throw afterErr
    for (const row of afterRows || []) {
      if (row.rotationOrder >= pos + ROTATION_SHIFT_OFFSET) {
        const newOrder = row.rotationOrder - ROTATION_SHIFT_OFFSET + 1
        const { error: normErr } = await supabase
          .from('tontine_members')
          .update({ rotationOrder: newOrder })
          .eq('id', row.id)
        if (normErr) throw normErr
      }
    }
  }

  const confirmAcceptJoinRequest = async () => {
    const req = joinRequestToAccept
    if (!req) return
    if (maxMembers != null && members.length >= maxMembers) {
      toast({
        title: 'Tontine complète',
        description: `Limite de ${maxMembers} membre(s) atteinte. Augmentez la capacité dans la vue d’ensemble.`,
        variant: 'destructive',
      })
      return
    }
    setJoinRequestActionId(req.id)
    setMemberActionLoading(true)
    try {
      await insertMemberAtRotationPosition(req.userId, joinRotationPosition)

      const { error: updErr } = await supabase
        .from('tontine_join_requests')
        .update({ status: 'accepted', respondedAt: new Date().toISOString() })
        .eq('id', req.id)
      if (updErr) throw updErr

      toast({
        title: 'Demande acceptée',
        description: 'Le membre a été ajouté à la tontine avec le rang de rotation choisi.',
      })
      setJoinRequestToAccept(null)
      loadJoinRequests()
      loadMembers()
    } catch (e) {
      console.error(e)
      toast({
        title: 'Erreur',
        description: e.message || 'Impossible d’accepter la demande',
        variant: 'destructive',
      })
    } finally {
      setJoinRequestActionId(null)
      setMemberActionLoading(false)
    }
  }

  const rejectJoinRequest = async (req) => {
    setJoinRequestActionId(req.id)
    try {
      const { error } = await supabase
        .from('tontine_join_requests')
        .update({ status: 'rejected', respondedAt: new Date().toISOString() })
        .eq('id', req.id)
      if (error) throw error
      toast({ title: 'Demande refusée' })
      loadJoinRequests()
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e.message || 'Impossible de refuser la demande',
        variant: 'destructive',
      })
    } finally {
      setJoinRequestActionId(null)
    }
  }

  const handleAddMember = (user) => {
    if (maxMembers != null && members.length >= maxMembers) {
      toast({
        title: 'Tontine complète',
        description: `Vous avez atteint la limite de ${maxMembers} membre(s). Modifiez la capacité dans la vue d’ensemble.`,
        variant: 'destructive',
      })
      return
    }
    if (existingMemberIds.has(normalizeUserId(user.id))) {
      toast({
        title: 'Déjà membre',
        description: 'Cette personne fait déjà partie de la tontine.',
        variant: 'destructive',
      })
      return
    }
    setAddMemberRotationPosition(members.length + 1)
    setAddMemberModal(user)
  }

  const confirmAddMember = async () => {
    if (!addMemberModal || memberActionLoading) return

    if (maxMembers != null && members.length >= maxMembers) {
      toast({
        title: 'Tontine complète',
        description: `Limite de ${maxMembers} membre(s) atteinte.`,
        variant: 'destructive',
      })
      setAddMemberModal(null)
      return
    }
    if (existingMemberIds.has(normalizeUserId(addMemberModal.id))) {
      toast({
        title: 'Déjà membre',
        description: 'Cette personne fait déjà partie de la tontine.',
        variant: 'destructive',
      })
      setAddMemberModal(null)
      return
    }

    setMemberActionLoading(true)
    try {
      await insertMemberAtRotationPosition(addMemberModal.id, addMemberRotationPosition)

      toast({
        title: 'Membre ajouté',
        description: `${addMemberModal.fullName} a été ajouté à la tontine (tour n°${addMemberRotationPosition}).`,
      })

      setAddMemberModal(null)
      await loadMembers()
      void loadCandidates()
    } catch (error) {
      console.error('Error adding member:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ajouter le membre',
        variant: 'destructive'
      })
    } finally {
      setMemberActionLoading(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!removeMemberId || !removeMemberInfo) return

    // Vérifier si la tontine a des cycles actifs
    if (hasActiveCycles) {
      toast({
        title: 'Action impossible',
        description: 'Vous ne pouvez pas retirer un membre pendant qu\'un cycle est actif. Attendez la fin du cycle ou annulez-le d\'abord.',
        variant: 'destructive'
      })
      setRemoveMemberId(null)
      setRemoveMemberInfo(null)
      return
    }

    // Permettre la suppression si :
    // 1. La tontine est terminée (completed)
    // 2. La tontine est suspendue (suspended)
    // 3. La tontine n'a pas de cycles actifs (peut être avant le recommencement)
    const canRemove = tontineStatus === 'completed' || 
                     tontineStatus === 'suspended' || 
                     !hasActiveCycles

    if (!canRemove) {
      toast({
        title: 'Action impossible',
        description: 'Vous ne pouvez retirer un membre que si la tontine est terminée, suspendue, ou n\'a pas de cycles actifs (avant le recommencement).',
        variant: 'destructive'
      })
      setRemoveMemberId(null)
      setRemoveMemberInfo(null)
      return
    }

    try {
      // Delete the member from tontine
      const { error: deleteError } = await supabase
        .from('tontine_members')
        .delete()
        .eq('id', removeMemberId)

      if (deleteError) throw deleteError

      // Reorganize rotation order for remaining members
      // Get all remaining members ordered by rotation order
      const { data: remainingMembers, error: fetchError } = await supabase
        .from('tontine_members')
        .select('id, rotationOrder')
        .eq('tontineId', tontineId)
        .order('rotationOrder', { ascending: true })

      if (fetchError) throw fetchError

      // Update rotation order sequentially (1, 2, 3, ...)
      if (remainingMembers && remainingMembers.length > 0) {
        const updates = remainingMembers.map((member, index) => ({
          id: member.id,
          rotationOrder: index + 1
        }))

        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('tontine_members')
            .update({ rotationOrder: update.rotationOrder })
            .eq('id', update.id)

          if (updateError) {
            console.warn('Error updating rotation order:', updateError)
            // Continue with other updates even if one fails
          }
        }
      }

      const memberName = removeMemberInfo.user?.fullName || 'le membre'
      toast({
        title: 'Membre retiré',
        description: `${memberName} a été retiré de la tontine avec succès. L'ordre de rotation a été réorganisé.`
      })

      setRemoveMemberId(null)
      setRemoveMemberInfo(null)
      loadMembers()
    } catch (error) {
      console.error('Error removing member:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de retirer le membre. Veuillez réessayer.',
        variant: 'destructive'
      })
    }
  }

  const getCountryFlag = (countryCode) => {
    const flags = {
      'CA': '🇨🇦', 'US': '🇺🇸', 'FR': '🇫🇷', 'BE': '🇧🇪', 'CH': '🇨🇭',
      'MX': '🇲🇽', 'CL': '🇨🇱', 'HT': '🇭🇹', 'SN': '🇸🇳', 'CM': '🇨🇲'
    }
    return flags[countryCode] || '🌍'
  }

  const openReceiverDialog = (member) => {
    setReceiverEditMember(member)
    const raw = member.receiverPaymentStorage || ''
    const p = parseReceiverStorage(raw)
    if (p.kind === 'cl_transferencia') {
      setReceiverForm({
        clRut: p.rut || '',
        clBank: p.bank || '',
        clAccountType: p.accountType || '',
        clAccountNumber: p.accountNumber || '',
        emailOrId: '',
      })
    } else if (p.kind === 'email') {
      setReceiverForm({
        clRut: '',
        clBank: '',
        clAccountType: '',
        clAccountNumber: '',
        emailOrId: p.email || '',
      })
    } else {
      setReceiverForm({
        clRut: '',
        clBank: '',
        clAccountType: '',
        clAccountNumber: '',
        emailOrId: p.kind === 'raw' ? String(raw) : '',
      })
    }
  }

  const saveReceiverPayment = async () => {
    if (!receiverEditMember) return
    setSavingReceiver(true)
    try {
      let storage = ''
      if (receiverMode === 'cl_transferencia') {
        const rut = receiverForm.clRut.trim()
        const bank = receiverForm.clBank.trim()
        const accountNumber = receiverForm.clAccountNumber.trim()
        const accountType = receiverForm.clAccountType.trim()
        if (!rut || !bank || !accountNumber) {
          throw new Error('RUT, banque et numéro de compte sont requis')
        }
        storage = serializeChileReceiver({ rut, bank, accountType, accountNumber })
      } else {
        storage = receiverForm.emailOrId.trim()
        if (!storage) {
          throw new Error(
            receiverMode === 'koho_interac'
              ? 'L’email KOHO est requis'
              : 'Les coordonnées de réception sont requises'
          )
        }
      }
      const { error } = await supabase
        .from('tontine_members')
        .update({ receiverPaymentStorage: storage })
        .eq('id', receiverEditMember.id)
      if (error) throw error
      toast({
        title: 'Coordonnées enregistrées',
        description: `Réception pour ${receiverEditMember.user?.fullName || 'le membre'}`,
      })
      setReceiverEditMember(null)
      loadMembers()
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e.message || 'Enregistrement impossible',
        variant: 'destructive',
      })
    } finally {
      setSavingReceiver(false)
    }
  }

  const receiverStatusBadge = (member) => {
    const p = parseReceiverStorage(member.receiverPaymentStorage)
    if (p.kind !== 'empty') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
          Défini
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-200">
        À compléter
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {joinRequests.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Demandes pour rejoindre la tontine
            </CardTitle>
            <CardDescription>
              Acceptez une demande pour ajouter le membre : vous choisirez son rang dans la rotation (qui reçoit en
              premier, etc.).
              {maxMembers != null
                ? ` Limite : ${maxMembers} membre(s) (${members.length} actuellement).`
                : null}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {joinRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border bg-white"
              >
                <div>
                  <p className="font-medium">
                    {req.requester?.fullName || 'Utilisateur'}
                    <span className="text-sm font-normal text-solidarpay-text/70 ml-2">
                      {req.requester?.email}
                    </span>
                  </p>
                  <p className="text-xs text-solidarpay-text/60 mt-1">
                    Demandé le {new Date(req.createdAt).toLocaleString('fr-FR')}
                  </p>
                  {req.message ? (
                    <p className="text-sm text-solidarpay-text/80 mt-2 italic">&laquo; {req.message} &raquo;</p>
                  ) : null}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/40 hover:bg-destructive/10"
                    disabled={joinRequestActionId !== null}
                    onClick={() => rejectJoinRequest(req)}
                  >
                    {joinRequestActionId === req.id ? '…' : 'Refuser'}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
                    disabled={
                      joinRequestActionId !== null ||
                      (maxMembers != null && members.length >= maxMembers)
                    }
                    onClick={() => {
                      setJoinRequestToAccept(req)
                      setJoinRotationPosition(members.length + 1)
                    }}
                  >
                    Accepter
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Ajouter des membres</CardTitle>
          <CardDescription>
            Par défaut, la liste affiche les comptes « membre » du <strong>même pays que vous</strong> (modifiable ci-dessous).
            Utilisez le champ de recherche pour filtrer par nom ou e-mail. Vous pouvez aussi élargir à tous les pays.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Country Selection avec boutons séparés */}
          <div className="space-y-2">
            <Label>Filtrer par pays (optionnel)</Label>
            <div className="space-y-3">
              {/* Boutons par pays */}
              <div className="flex flex-wrap gap-2">
                {loadingCountries ? (
                  <div className="text-sm text-solidarpay-text/50 italic flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-solidarpay-primary"></div>
                    Chargement des pays...
                  </div>
                ) : countries.length > 0 ? (
                  countries.map((country) => (
                    <Button
                      key={country.code || country.id}
                      variant={selectedCountry === country.code ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        skipAutoCountryRef.current = true
                        setSelectedCountry(country.code)
                      }}
                      className={
                        selectedCountry === country.code
                          ? "bg-solidarpay-primary hover:bg-solidarpay-secondary"
                          : ""
                      }
                    >
                      {getCountryFlag(country.code)} {country.name}
                    </Button>
                  ))
                ) : (
                  <div className="text-sm text-solidarpay-text/50 italic">
                    Aucun pays disponible. Contactez le super admin.
                  </div>
                )}
              </div>
              {/* Bouton "Tous les pays" à la fin */}
              <div className="flex justify-end">
                <Button
                  variant={selectedCountry === 'all' ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    skipAutoCountryRef.current = true
                    setSelectedCountry('all')
                  }}
                  className={
                    selectedCountry === 'all'
                      ? "bg-solidarpay-primary hover:bg-solidarpay-secondary"
                      : ""
                  }
                >
                  🌍 Tous les pays
                </Button>
              </div>
            </div>
            <p className="text-xs text-solidarpay-text/70">
              {selectedCountry === 'all'
                ? 'Liste élargie : tous les pays (jusqu’à 400 comptes). Précisez la recherche pour trouver quelqu’un.'
                : `Pays affiché : ${countries.find((c) => c.code === selectedCountry)?.name || selectedCountry}`}
            </p>
          </div>

          {/* Filtre local + rechargement serveur */}
          <div className="space-y-2">
            <Label htmlFor="search">Filtrer par nom ou e-mail</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-solidarpay-text/50 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Tapez pour réduire la liste affichée…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void loadCandidates()
                    }
                  }}
                  className="pl-10"
                />
              </div>
              <Button
                type="button"
                onClick={() => void loadCandidates()}
                disabled={loadingCandidates || !adminProfileReady}
                className="bg-solidarpay-primary hover:bg-solidarpay-secondary shrink-0"
              >
                {loadingCandidates ? 'Chargement…' : 'Actualiser'}
              </Button>
            </div>
            <p className="text-xs text-solidarpay-text/60">
              Le filtre s’applique instantanément sur la liste chargée. « Actualiser » relit les données sur le serveur.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Membres disponibles (pays sélectionné) */}
      {adminProfileReady && (
        <Card>
          <CardHeader>
            <CardTitle>Membres disponibles</CardTitle>
            <CardDescription>
              {loadingCandidates
                ? 'Chargement…'
                : `${filteredCandidates.length} affiché(s) sur ${candidateUsers.length} dans ce pays / ce filtre.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCandidates && candidateUsers.length === 0 ? (
              <div className="text-center py-10 text-solidarpay-text/60">Chargement de la liste…</div>
            ) : !loadingCandidates && candidateUsers.length === 0 ? (
              <div className="text-center py-10 text-solidarpay-text/70">
                Aucun compte « membre » pour ce pays. Changez de pays ou vérifiez les inscriptions.
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="text-center py-10 text-solidarpay-text/70">
                Aucun résultat pour « {searchTerm.trim()} ». Effacez le filtre ou changez de pays.
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCandidates.map((user) => {
                const canAdd = !user.isAlreadyMember

                return (
                  <Card key={user.id} className="relative">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center space-y-3">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full bg-solidarpay-primary flex items-center justify-center text-white text-xl font-semibold">
                          {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>

                        {/* Name */}
                        <div>
                          <h3 className="font-semibold text-lg">{user.fullName}</h3>
                          <p className="text-sm text-solidarpay-text/70">{user.email}</p>
                          {user.phone && (
                            <p className="text-xs text-solidarpay-text/70">{user.phone}</p>
                          )}
                        </div>

                        {/* Country */}
                        {user.country && (
                          <div className="flex items-center gap-1 text-sm">
                            <span>{getCountryFlag(user.country)}</span>
                            <span className="text-solidarpay-text/70">{user.country}</span>
                          </div>
                        )}

                        {/* Actions */}
                        {user.isAlreadyMember ? (
                          <Badge variant="secondary">Déjà membre</Badge>
                        ) : canAdd ? (
                          <Button
                            size="sm"
                            onClick={() => handleAddMember(user)}
                            className="w-full bg-solidarpay-primary hover:bg-solidarpay-secondary"
                          >
                            Ajouter à ma tontine
                          </Button>
                        ) : (
                          <div className="text-xs text-solidarpay-text/70 text-center">
                            Indisponible
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            )}
          </CardContent>
        </Card>
      )}

      {showDirectPerMember && (
        <Card className="border-cyan-200 bg-cyan-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="w-5 h-5" />
              Coordonnées par membre (paiement direct)
            </CardTitle>
            <CardDescription>
              Chaque participant doit avoir ses propres coordonnées (banque / email) : ce sont celles affichées aux
              autres membres lorsqu’il ou elle est <strong>bénéficiaire du cycle</strong>. Devise de la tontine :{' '}
              {currencyInfo.code}.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Current Members */}
      <Card>
        <CardHeader>
          <CardTitle>Membres de la tontine</CardTitle>
          <CardDescription>
            {maxMembers != null
              ? `${members.length} / ${maxMembers} membre(s)`
              : `${members.length} membre(s)`}
            {maxMembers != null && members.length >= maxMembers ? ' — capacité maximale atteinte' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solidarpay-primary mx-auto"></div>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-solidarpay-text/70">
              Aucun membre dans cette tontine
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membre</TableHead>
                  <TableHead>Tour</TableHead>
                  <TableHead>Email</TableHead>
                  {showDirectPerMember ? <TableHead>Réception cotisation</TableHead> : null}
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Date d'ajout</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-solidarpay-primary flex items-center justify-center text-white text-sm font-semibold">
                            {member.user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <span className="font-medium">{member.user?.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono tabular-nums">
                            {member.rotationOrder}
                          </Badge>
                          {member.rotationOrder === 1 ? (
                            <span className="text-xs text-solidarpay-text/70">1re réception</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{member.user?.email}</TableCell>
                      {showDirectPerMember ? (
                        <TableCell>{receiverStatusBadge(member)}</TableCell>
                      ) : null}
                      <TableCell>{member.user?.phone || '-'}</TableCell>
                      <TableCell>
                        {new Date(member.joinedAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {showDirectPerMember && (
                              <DropdownMenuItem onClick={() => openReceiverDialog(member)}>
                                <Landmark className="w-4 h-4 mr-2" />
                                Coordonnées de réception (cycle)
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                // Vérifier si on peut retirer le membre
                                const canRemove = tontineStatus === 'completed' || 
                                                 tontineStatus === 'suspended' || 
                                                 !hasActiveCycles

                                if (!canRemove) {
                                  toast({
                                    title: 'Action impossible',
                                    description: 'Vous ne pouvez retirer un membre que si la tontine est terminée, suspendue, ou n\'a pas de cycles actifs (avant le recommencement).',
                                    variant: 'destructive'
                                  })
                                  return
                                }

                                if (hasActiveCycles) {
                                  toast({
                                    title: 'Action impossible',
                                    description: 'Vous ne pouvez pas retirer un membre pendant qu\'un cycle est actif. Attendez la fin du cycle.',
                                    variant: 'destructive'
                                  })
                                  return
                                }
                                setRemoveMemberId(member.id)
                                setRemoveMemberInfo(member)
                              }}
                              className={hasActiveCycles ? "text-gray-400 cursor-not-allowed" : "text-red-600"}
                              disabled={hasActiveCycles}
                            >
                              <UserMinus className="w-4 h-4 mr-2" />
                              {hasActiveCycles 
                                ? 'Retirer (cycle actif)' 
                                : tontineStatus === 'completed' 
                                  ? 'Retirer (tontine terminée)' 
                                  : 'Retirer de la tontine'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Member Modal */}
      <AddMemberModal
        user={addMemberModal}
        tontineName={tontineName}
        rotationMax={Math.max(1, members.length + 1)}
        rotationPosition={addMemberRotationPosition}
        onRotationPositionChange={setAddMemberRotationPosition}
        onConfirm={confirmAddMember}
        onCancel={() => !memberActionLoading && setAddMemberModal(null)}
        isSubmitting={memberActionLoading}
        maxMembers={maxMembers}
        currentMemberCount={members.length}
      />

      <Dialog
        open={!!joinRequestToAccept}
        onOpenChange={(open) => {
          if (!open) setJoinRequestToAccept(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Accepter la demande</DialogTitle>
            <DialogDescription>
              Définissez le rang de <strong>{joinRequestToAccept?.requester?.fullName || 'le membre'}</strong> dans la
              rotation (réception des cotisations).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="join-rotation">Position dans la rotation</Label>
            <Select
              value={String(joinRotationPosition)}
              onValueChange={(v) => setJoinRotationPosition(parseInt(v, 10))}
            >
              <SelectTrigger id="join-rotation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: members.length + 1 }, (_, i) => i + 1).map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {p === 1
                      ? `Rang ${p} — première réception`
                      : p === members.length + 1
                        ? `Rang ${p} — en fin de liste`
                        : `Rang ${p}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinRequestToAccept(null)}>
              Annuler
            </Button>
            <Button
              className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
              disabled={joinRequestActionId !== null || memberActionLoading}
              onClick={() => confirmAcceptJoinRequest()}
            >
              {joinRequestActionId || memberActionLoading ? '…' : 'Confirmer l’ajout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Coordonnées réception — paiement direct */}
      <Dialog open={!!receiverEditMember} onOpenChange={(o) => !o && setReceiverEditMember(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Coordonnées pour recevoir les cotisations</DialogTitle>
            <DialogDescription>
              Lorsque ce membre est bénéficiaire, les autres utiliseront ces informations pour payer.{' '}
              <strong>{receiverEditMember?.user?.fullName}</strong>
            </DialogDescription>
          </DialogHeader>
          {receiverMode === 'cl_transferencia' && (
            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label htmlFor="recv-rut">RUT *</Label>
                <Input
                  id="recv-rut"
                  value={receiverForm.clRut}
                  onChange={(e) => setReceiverForm({ ...receiverForm, clRut: e.target.value })}
                  placeholder="12.345.678-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recv-bank">Banque *</Label>
                <Input
                  id="recv-bank"
                  value={receiverForm.clBank}
                  onChange={(e) => setReceiverForm({ ...receiverForm, clBank: e.target.value })}
                  placeholder="BancoEstado, …"
                />
              </div>
              <div className="space-y-2">
                <Label>Type de compte</Label>
                <Select
                  value={receiverForm.clAccountType || '_none'}
                  onValueChange={(v) =>
                    setReceiverForm({ ...receiverForm, clAccountType: v === '_none' ? '' : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">—</SelectItem>
                    <SelectItem value="Cuenta vista">Cuenta vista</SelectItem>
                    <SelectItem value="Cuenta corriente">Cuenta corriente</SelectItem>
                    <SelectItem value="Cuenta RUT">Cuenta RUT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recv-acc">Numéro de compte *</Label>
                <Input
                  id="recv-acc"
                  value={receiverForm.clAccountNumber}
                  onChange={(e) => setReceiverForm({ ...receiverForm, clAccountNumber: e.target.value })}
                  placeholder="Numéro de cuenta"
                />
              </div>
            </div>
          )}
          {receiverMode === 'koho_interac' && (
            <div className="space-y-2 py-2">
              <Label htmlFor="recv-email-k">Email KOHO (réception) *</Label>
              <Input
                id="recv-email-k"
                type="email"
                value={receiverForm.emailOrId}
                onChange={(e) => setReceiverForm({ ...receiverForm, emailOrId: e.target.value })}
                placeholder="paiement@koho.ca"
              />
            </div>
          )}
          {receiverMode === 'email_generic' && (
            <div className="space-y-2 py-2">
              <Label htmlFor="recv-gen">Email ou identifiant *</Label>
              <Input
                id="recv-gen"
                type="text"
                value={receiverForm.emailOrId}
                onChange={(e) => setReceiverForm({ ...receiverForm, emailOrId: e.target.value })}
                placeholder="contact@…"
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReceiverEditMember(null)}>
              Annuler
            </Button>
            <Button type="button" onClick={saveReceiverPayment} disabled={savingReceiver}>
              {savingReceiver ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <Dialog 
        open={!!removeMemberId} 
        onOpenChange={() => {
          setRemoveMemberId(null)
          setRemoveMemberInfo(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer le membre</DialogTitle>
            <DialogDescription>
              {removeMemberInfo?.user?.fullName ? (
                <>
                  Êtes-vous sûr de vouloir retirer <strong>{removeMemberInfo.user.fullName}</strong> de la tontine <strong>{tontineName}</strong> ?
                  <br /><br />
                  {hasActiveCycles ? (
                    <>
                      <strong className="text-red-600">⚠️ Attention :</strong> Cette tontine a des cycles actifs. 
                      Vous ne pouvez retirer un membre que si la tontine est terminée ou n'a pas de cycles actifs.
                    </>
                  ) : (
                    <>
                      Cette action est <strong>irréversible</strong>. Le membre perdra l'accès à cette tontine et ne pourra plus participer aux cycles.
                      <br /><br />
                      L'ordre de rotation des membres restants sera automatiquement réorganisé.
                    </>
                  )}
                </>
              ) : (
                'Êtes-vous sûr de vouloir retirer ce membre de la tontine ? Cette action est irréversible.'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRemoveMemberId(null)
                setRemoveMemberInfo(null)
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRemoveMember}
              disabled={hasActiveCycles}
            >
              <UserMinus className="w-4 h-4 mr-2" />
              {hasActiveCycles ? 'Cycle actif - Impossible' : 'Confirmer la suppression'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

