'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
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
import { Search, CheckCircle, Clock, XCircle, MoreVertical, Eye, UserMinus, User, FileText, Landmark } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import AddMemberModal from './AddMemberModal'
import KYCDocumentModal from './KYCDocumentModal'
import { getCurrencyInfo } from '@/lib/currency-utils'
import {
  receiverFieldModeForCountry,
  serializeChileReceiver,
  isDirectPerMemberStorage,
  parseReceiverStorage,
} from '@/lib/tontine-receiver'

export default function MembersTab({
  tontineId,
  tontineName,
  tontineStatus,
  paymentMode,
  currency,
  kohoReceiverEmail,
  adminId,
}) {
  const [selectedCountry, setSelectedCountry] = useState('all') // 'all' pour permettre tontines inter-pays
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [members, setMembers] = useState([])
  const [countries, setCountries] = useState([])
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [addMemberModal, setAddMemberModal] = useState(null)
  const [kycModal, setKycModal] = useState(null)
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
  const { toast } = useToast()

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
    if (!adminId) return
    ;(async () => {
      const { data } = await supabase.from('users').select('country').eq('id', adminId).maybeSingle()
      setAdminCountry(data?.country || null)
    })()
  }, [adminId])

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
      const { data, error } = await supabase
        .from('payment_countries')
        .select('code, name, enabled')
        .eq('enabled', true)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error loading countries:', error)
        toast({
          title: 'Attention',
          description: 'Impossible de charger les pays. Vérifiez que la table payment_countries existe.',
          variant: 'destructive'
        })
        setCountries([])
        return
      }
      
      console.log('Countries loaded:', data) // Debug
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
        .order('joinedAt', { ascending: false })

      if (error) throw error

      // Load KYC status for each member
      const membersWithKYC = await Promise.all(
        (data || []).map(async (member) => {
          const { data: kyc } = await supabase
            .from('kyc_documents')
            .select('*')
            .eq('userId', member.user.id)
            .order('createdAt', { ascending: false })
            .limit(1)
            .single()

          return {
            ...member,
            kyc: kyc || null
          }
        })
      )

      setMembers(membersWithKYC)
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

  const acceptJoinRequest = async (req) => {
    setJoinRequestActionId(req.id)
    try {
      const { data: existingMembers } = await supabase
        .from('tontine_members')
        .select('rotationOrder')
        .eq('tontineId', tontineId)
        .order('rotationOrder', { ascending: false })
        .limit(1)

      const nextOrder =
        existingMembers && existingMembers.length > 0 ? existingMembers[0].rotationOrder + 1 : 1

      const { error: insErr } = await supabase.from('tontine_members').insert({
        tontineId,
        userId: req.userId,
        rotationOrder: nextOrder,
      })
      if (insErr) throw insErr

      const { error: updErr } = await supabase
        .from('tontine_join_requests')
        .update({ status: 'accepted', respondedAt: new Date().toISOString() })
        .eq('id', req.id)
      if (updErr) throw updErr

      toast({
        title: 'Demande acceptée',
        description: 'Le membre a été ajouté à la tontine.',
      })
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

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: 'Recherche requise',
        description: 'Veuillez entrer un nom ou email',
        variant: 'destructive'
      })
      return
    }

    try {
      setSearching(true)
      
      // Search users by name or email
      let query = supabase
        .from('users')
        .select('*')
        .or(`fullName.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .eq('role', 'member')

      // Filter by country if selected (optionnel pour permettre tontines inter-pays)
      if (selectedCountry && selectedCountry !== 'all') {
        query = query.eq('country', selectedCountry)
      }

      const { data, error } = await query.limit(20)

      if (error) throw error

      // Check if users are already members
      const { data: existingMembers } = await supabase
        .from('tontine_members')
        .select('userId')
        .eq('tontineId', tontineId)

      const existingMemberIds = (existingMembers || []).map(m => m.userId)

      // Load KYC status for each result
      const resultsWithKYC = await Promise.all(
        (data || []).map(async (user) => {
          const { data: kyc } = await supabase
            .from('kyc_documents')
            .select('*')
            .eq('userId', user.id)
            .order('createdAt', { ascending: false })
            .limit(1)
            .single()

          return {
            ...user,
            kyc: kyc || null,
            isAlreadyMember: existingMemberIds.includes(user.id)
          }
        })
      )

      setSearchResults(resultsWithKYC)
    } catch (error) {
      console.error('Error searching:', error)
      toast({
        title: 'Erreur de recherche',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setSearching(false)
    }
  }

  const handleAddMember = (user) => {
    setAddMemberModal(user)
  }

  const confirmAddMember = async () => {
    if (!addMemberModal) return

    try {
      // Get current max rotation order
      const { data: existingMembers } = await supabase
        .from('tontine_members')
        .select('rotationOrder')
        .eq('tontineId', tontineId)
        .order('rotationOrder', { ascending: false })
        .limit(1)

      const nextOrder = existingMembers && existingMembers.length > 0
        ? existingMembers[0].rotationOrder + 1
        : 1

      const { error } = await supabase
        .from('tontine_members')
        .insert({
          tontineId,
          userId: addMemberModal.id,
          rotationOrder: nextOrder
        })

      if (error) throw error

      toast({
        title: 'Membre ajouté',
        description: `${addMemberModal.fullName} a été ajouté à la tontine`
      })

      setAddMemberModal(null)
      setSearchResults([])
      loadMembers()
    } catch (error) {
      console.error('Error adding member:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le membre',
        variant: 'destructive'
      })
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

  const getKYCStatus = (kyc) => {
    if (!kyc) {
      return { status: 'none', label: 'Non vérifié', color: 'destructive', icon: XCircle }
    }
    
    switch (kyc.status) {
      case 'approved':
        return { status: 'approved', label: 'Vérifié', color: 'default', icon: CheckCircle, className: 'bg-green-100 text-green-800' }
      case 'pending':
        return { status: 'pending', label: 'En attente', color: 'default', icon: Clock, className: 'bg-orange-100 text-orange-800' }
      case 'rejected':
        return { status: 'rejected', label: 'Rejeté', color: 'destructive', icon: XCircle }
      default:
        return { status: 'none', label: 'Non vérifié', color: 'destructive', icon: XCircle }
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
              Ces personnes ont demandé à participer. Acceptez pour les ajouter avec le prochain ordre de rotation,
              ou refusez si la tontine est déjà complète.
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
                    disabled={joinRequestActionId !== null}
                    onClick={() => acceptJoinRequest(req)}
                  >
                    {joinRequestActionId === req.id ? '…' : 'Accepter'}
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
          <CardTitle>Rechercher des membres</CardTitle>
          <CardDescription>
            Recherchez des membres inscrits pour les ajouter à votre tontine. Vous pouvez créer des tontines inter-pays avec des membres de différents pays.
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
                      onClick={() => setSelectedCountry(country.code)}
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
                  variant={selectedCountry === 'all' || !selectedCountry ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCountry('all')}
                  className={
                    selectedCountry === 'all' || !selectedCountry
                      ? "bg-solidarpay-primary hover:bg-solidarpay-secondary"
                      : ""
                  }
                >
                  🌍 Tous les pays
                </Button>
              </div>
            </div>
            <p className="text-xs text-solidarpay-text/70">
              {selectedCountry === 'all' || !selectedCountry
                ? 'Vous pouvez créer une tontine avec des membres de différents pays'
                : `Filtrage actif : ${countries.find(c => c.code === selectedCountry)?.name || selectedCountry}`}
            </p>
          </div>

          {/* Step 2: Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Rechercher des membres</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-solidarpay-text/50 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Nom complet ou email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={!searchTerm.trim() || searching}
                className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
              >
                {searching ? 'Recherche...' : 'Rechercher'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats de recherche</CardTitle>
            <CardDescription>{searchResults.length} membre(s) trouvé(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((user) => {
                const kycInfo = getKYCStatus(user.kyc)
                const KYCIcon = kycInfo.icon
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

                        {/* KYC Status */}
                        <Badge className={kycInfo.className || ''} variant={kycInfo.color}>
                          <KYCIcon className="w-3 h-3 mr-1" />
                          {kycInfo.label}
                        </Badge>

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
          <CardDescription>{members.length} membre(s) dans cette tontine</CardDescription>
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
                  <TableHead>Email</TableHead>
                  {showDirectPerMember ? <TableHead>Réception cotisation</TableHead> : null}
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Statut KYC</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Date d'ajout</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const kycInfo = getKYCStatus(member.kyc)
                  const KYCIcon = kycInfo.icon

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
                      <TableCell>{member.user?.email}</TableCell>
                      {showDirectPerMember ? (
                        <TableCell>{receiverStatusBadge(member)}</TableCell>
                      ) : null}
                      <TableCell>{member.user?.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge className={kycInfo.className || ''} variant={kycInfo.color}>
                          <KYCIcon className="w-3 h-3 mr-1" />
                          {kycInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.kyc && member.kyc.status === 'approved' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setKycModal(member)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Voir
                          </Button>
                        ) : (
                          <span className="text-sm text-solidarpay-text/50">-</span>
                        )}
                      </TableCell>
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
                            <DropdownMenuItem onClick={() => setKycModal(member)}>
                              <FileText className="w-4 h-4 mr-2" />
                              Voir le document KYC
                            </DropdownMenuItem>
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
        onConfirm={confirmAddMember}
        onCancel={() => setAddMemberModal(null)}
      />

      {/* KYC Document Modal */}
      {kycModal && (
        <KYCDocumentModal
          member={kycModal}
          tontineName={tontineName}
          onClose={() => setKycModal(null)}
        />
      )}

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

