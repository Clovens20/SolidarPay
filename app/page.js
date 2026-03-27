'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { formatCurrency, getCurrencyInfo, getCurrencyByCountry } from '@/lib/currency-utils'
import {
  receiverFieldModeForCountry,
  serializeChileReceiver,
  contributionAmountStep,
  contributionAmountPlaceholder,
  parseReceiverStorage,
  buildMemberPaymentCopyText,
  getReceiverRawForPayment,
  directPerMemberMarkerJson,
} from '@/lib/tontine-receiver'
import {
  normalizeTontineName,
  isTontineNameTaken,
  TONTINE_NAME_TAKEN_MSG,
} from '@/lib/tontine-name'
import { resolveTontineByInviteInput } from '@/lib/tontine-invite-code'
import ReceiverDetails from '@/components/tontine/ReceiverDetails'

const LandingPage = dynamic(() => import('@/components/landing/LandingPage'), {
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto" />
        <p className="mt-4 text-gray-600">Chargement…</p>
      </div>
    </div>
  ),
})

const CompleteProfileModal = dynamic(() =>
  import('@/components/profile/CompleteProfileModal').then((m) => m.default)
)

const TontineMessages = dynamic(() =>
  import('@/components/member/TontineMessages').then((m) => m.default)
)
import { 
  Users, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Mail, 
  Phone, 
  Copy, 
  ExternalLink,
  Settings,
  LogOut,
  Plus,
  AlertCircle,
  TrendingUp,
  History,
  User,
  UserPlus,
  MapPin,
} from 'lucide-react'

export default function App() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const { toast } = useToast()

  // App states
  const [tontines, setTontines] = useState([])
  const [selectedTontine, setSelectedTontine] = useState(null)
  const [activeCycle, setActiveCycle] = useState(null)
  const [contributions, setContributions] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [cycles, setCycles] = useState([])

  // Admin states
  const [newTontineName, setNewTontineName] = useState('')
  const [newTontineAmount, setNewTontineAmount] = useState('')
  const [newTontineFrequency, setNewTontineFrequency] = useState('monthly')
  const [newTontineKohoEmail, setNewTontineKohoEmail] = useState('')
  const [newTontinePaymentMode, setNewTontinePaymentMode] = useState('direct')
  const [newTontineClRut, setNewTontineClRut] = useState('')
  const [newTontineClBank, setNewTontineClBank] = useState('')
  const [newTontineClAccountType, setNewTontineClAccountType] = useState('')
  const [newTontineClAccountNumber, setNewTontineClAccountNumber] = useState('')
  const [adminCreateCurrency, setAdminCreateCurrency] = useState('CAD')
  const [selectedMembers, setSelectedMembers] = useState([])
  const [logoUrl, setLogoUrl] = useState(null)
  const [showCompleteProfile, setShowCompleteProfile] = useState(false)

  const [joinInviteInput, setJoinInviteInput] = useState('')
  const [joinMessage, setJoinMessage] = useState('')
  const [joinSubmitting, setJoinSubmitting] = useState(false)
  const [myJoinRequests, setMyJoinRequests] = useState([])
  const [countryTontines, setCountryTontines] = useState([])
  const [countryDiscoverLabel, setCountryDiscoverLabel] = useState('')
  const [joinRowLoadingId, setJoinRowLoadingId] = useState(null)

  useEffect(() => {
    checkAuth()
    loadLogo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    if (!user || user.role !== 'admin' || !user.country) {
      setAdminCreateCurrency('CAD')
      return
    }
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('payment_countries')
        .select('currency')
        .eq('code', user.country)
        .maybeSingle()
      if (!cancelled) {
        setAdminCreateCurrency(data?.currency || getCurrencyByCountry(user.country))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, user?.role, user?.country])

  const checkProfileCompletion = async () => {
    if (!user?.id) return

    try {
      // Vérifier si l'utilisateur a un pays
      const needsCountry = !user.country

      // Vérifier si l'utilisateur a au moins une méthode de paiement active
      const { data: paymentMethods, error } = await supabase
        .from('user_payment_methods')
        .select('id')
        .eq('userId', user.id)
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
        localStorage.setItem('solidarpay_user', JSON.stringify(userData))
      }
    }
    
    // Recharger les méthodes de paiement
    await checkProfileCompletion()
    setShowCompleteProfile(false)
  }

  const checkAuth = async () => {
    const savedSession = localStorage.getItem('solidarpay_session')
    const savedUser = localStorage.getItem('solidarpay_user')
    
    // Si pas de session, afficher la landing page
    if (!savedSession || !savedUser) {
      setLoading(false)
      return
    }
    
    try {
      // Vérifier que la session Supabase est toujours valide
      const { data: { session: validSession }, error } = await supabase.auth.getSession()
      
      // Si pas de session valide ou erreur, nettoyer et afficher landing page
      if (error || !validSession) {
        localStorage.removeItem('solidarpay_session')
        localStorage.removeItem('solidarpay_user')
        return
      }
      
      const userData = JSON.parse(savedUser)
      
      // Rediriger les super admins vers /admin/login seulement si session valide
      if (userData.role === 'super_admin') {
        router.push('/admin/login')
        return
      }
      
      // Rediriger les admins tontine vers l'interface complète /admin-tontine
      if (userData.role === 'admin') {
        router.push('/admin-tontine')
        return
      }
      
      setSession(JSON.parse(savedSession))
      setUser(userData)
    } catch (error) {
      // Si erreur de parsing ou autre, nettoyer et afficher landing page
      localStorage.removeItem('solidarpay_session')
      localStorage.removeItem('solidarpay_user')
    } finally {
      // Obligatoire après chaque return dans try : sinon écran « Chargement... » infini
      // si la navigation client (router.push) ne démonte pas la page tout de suite.
      setLoading(false)
    }
  }

  const loadData = async () => {
    try {
      if (!user) return

      setCountryTontines([])
      setCountryDiscoverLabel('')

      let tontinesData = []

      // Si l'utilisateur est admin, charger ses tontines (où il est admin)
      if (user.role === 'admin') {
        const { data: adminTontines, error: adminError } = await supabase
          .from('tontines')
          .select(`
            *,
            admin:adminId (id, fullName, email)
          `)
          .eq('adminId', user.id)
          .order('createdAt', { ascending: false })

        if (adminError) throw adminError
        tontinesData = adminTontines || []
      }
      // Si l'utilisateur est membre, charger uniquement les tontines où il est membre
      else if (user.role === 'member') {
        // Récupérer les IDs des tontines où l'utilisateur est membre
        const { data: memberTontines, error: memberError } = await supabase
          .from('tontine_members')
          .select('tontineId')
          .eq('userId', user.id)

        if (memberError) throw memberError

        const tontineIds = (memberTontines || []).map(m => m.tontineId)

        // Si l'utilisateur est membre d'au moins une tontine, les charger
        if (tontineIds.length > 0) {
          const { data: tontines, error: tontinesError } = await supabase
            .from('tontines')
            .select(`
              *,
              admin:adminId (id, fullName, email)
            `)
            .in('id', tontineIds)
            .order('createdAt', { ascending: false })

          if (tontinesError) throw tontinesError
          tontinesData = tontines || []
        } else {
          // L'utilisateur n'est membre d'aucune tontine
          tontinesData = []
        }

        const { data: joinReqRows, error: joinReqErr } = await supabase
          .from('tontine_join_requests')
          .select('id, status, createdAt, tontineId, message')
          .eq('userId', user.id)
          .order('createdAt', { ascending: false })
          .limit(30)

        if (!joinReqErr && joinReqRows?.length) {
          const allReqTontineIds = [...new Set(joinReqRows.map((r) => r.tontineId))]
          let nameById = {}
          if (allReqTontineIds.length) {
            const { data: tontNameRows } = await supabase
              .from('tontines')
              .select('id, name')
              .in('id', allReqTontineIds)
            nameById = Object.fromEntries((tontNameRows || []).map((t) => [t.id, t.name]))
          }
          setMyJoinRequests(
            joinReqRows.map((r) => ({
              ...r,
              tontineName: nameById[r.tontineId] || null,
            }))
          )
        } else {
          setMyJoinRequests([])
        }

        let discover = []
        let discLabel = ''
        if (user.country) {
          const { data: pcRow } = await supabase
            .from('payment_countries')
            .select('name')
            .eq('code', user.country)
            .maybeSingle()
          discLabel = pcRow?.name || user.country

          const { data: adminsSameCountry } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'admin')
            .eq('country', user.country)

          const adminIds = (adminsSameCountry || []).map((a) => a.id)
          if (adminIds.length) {
            const { data: disc, error: discoverErr } = await supabase
              .from('tontines')
              .select(`
                id,
                name,
                status,
                contributionAmount,
                currency,
                frequency,
                adminId,
                admin:adminId (id, fullName, email, country),
                members:tontine_members(count)
              `)
              .eq('status', 'active')
              .in('adminId', adminIds)

            if (!discoverErr && disc) {
              discover = disc
                .filter((t) => t.admin?.country === user.country)
                .sort((a, b) =>
                  (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' })
                )
            }
          }
        }
        setCountryTontines(discover)
        setCountryDiscoverLabel(discLabel)
      }

      setTontines(tontinesData)

      // Load all users (for admin)
      if (user?.role === 'admin') {
        const usersRes = await fetch('/api/users')
        const usersData = await usersRes.json()
        setAllUsers(usersData)
      }

      // Select first tontine by default
      if (tontinesData.length > 0) {
        selectTontine(tontinesData[0].id)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive',
      })
    }
  }

  const sendJoinRequestForTontine = async (tontine, messageText) => {
    if (!user?.id || user.role !== 'member') return { ok: false }
    if (tontine.status !== 'active') {
      toast({
        title: 'Tontine non disponible',
        description: 'Cette tontine n’accepte pas de nouveaux membres pour le moment.',
        variant: 'destructive',
      })
      return { ok: false }
    }
    const { data: existing } = await supabase
      .from('tontine_members')
      .select('id')
      .eq('tontineId', tontine.id)
      .eq('userId', user.id)
      .maybeSingle()
    if (existing) {
      toast({
        title: 'Déjà membre',
        description: `Vous faites déjà partie de « ${tontine.name} ».`,
      })
      return { ok: false }
    }
    const { error } = await supabase.from('tontine_join_requests').insert({
      tontineId: tontine.id,
      userId: user.id,
      message: messageText || null,
    })
    if (error) {
      if (error.code === '23505') {
        toast({
          title: 'Demande déjà en cours',
          description: 'Vous avez déjà une demande en attente pour cette tontine.',
          variant: 'destructive',
        })
        return { ok: false }
      }
      throw error
    }
    toast({
      title: 'Demande envoyée',
      description: `L’administrateur de « ${tontine.name} » pourra accepter votre demande dans l’onglet Membres.`,
    })
    return { ok: true }
  }

  const submitJoinRequest = async (e) => {
    e?.preventDefault?.()
    if (!user?.id || user.role !== 'member') return
    setJoinSubmitting(true)
    try {
      const resolved = await resolveTontineByInviteInput(supabase, joinInviteInput)
      if (resolved.error) {
        toast({
          title: 'Impossible de continuer',
          description: resolved.error,
          variant: 'destructive',
        })
        return
      }
      const result = await sendJoinRequestForTontine(
        resolved.tontine,
        joinMessage.trim() ? joinMessage.trim() : null
      )
      if (result.ok) {
        setJoinInviteInput('')
        setJoinMessage('')
        loadData()
      }
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err.message || 'Envoi impossible',
        variant: 'destructive',
      })
    } finally {
      setJoinSubmitting(false)
    }
  }

  const handleJoinRequestFromList = async (row) => {
    if (!user?.id || user.role !== 'member') return
    setJoinRowLoadingId(row.id)
    try {
      const result = await sendJoinRequestForTontine(
        row,
        joinMessage.trim() ? joinMessage.trim() : null
      )
      if (result.ok) loadData()
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err.message || 'Envoi impossible',
        variant: 'destructive',
      })
    } finally {
      setJoinRowLoadingId(null)
    }
  }

  const selectTontine = async (tontineId) => {
    try {
      if (!user || !tontineId) return

      // Pour les membres, vérifier qu'ils ont accès à cette tontine
      if (user.role === 'member') {
        const { data: membership, error: membershipError } = await supabase
          .from('tontine_members')
          .select('id')
          .eq('tontineId', tontineId)
          .eq('userId', user.id)
          .single()

        if (membershipError || !membership) {
          toast({
            title: 'Accès refusé',
            description: 'Vous n\'avez pas accès à cette tontine.',
            variant: 'destructive',
          })
          return
        }
      }
      // Pour les admins, vérifier qu'ils sont admin de cette tontine
      else if (user.role === 'admin') {
        const { data: tontine, error: tontineError } = await supabase
          .from('tontines')
          .select('adminId')
          .eq('id', tontineId)
          .single()

        if (tontineError || !tontine || tontine.adminId !== user.id) {
          toast({
            title: 'Accès refusé',
            description: 'Vous n\'êtes pas administrateur de cette tontine.',
            variant: 'destructive',
          })
          return
        }
      }

      const [tontineRes, cycleActiveRes, cyclesRes] = await Promise.all([
        fetch(`/api/tontines/${tontineId}`),
        fetch(`/api/cycles/active/${tontineId}`),
        fetch(`/api/cycles/tontine/${tontineId}`),
      ])
      const [tontineData, cycleData, cyclesData] = await Promise.all([
        tontineRes.json(),
        cycleActiveRes.json(),
        cyclesRes.json(),
      ])

      setSelectedTontine(tontineData)
      setActiveCycle(cycleData)
      setCycles(cyclesData)

      if (cycleData?.id) {
        const contribRes = await fetch(`/api/contributions/cycle/${cycleData.id}`)
        setContributions(await contribRes.json())
      } else {
        setContributions([])
      }
    } catch (error) {
      console.error('Error loading tontine:', error)
    }
  }

  const loadLogo = async () => {
    try {
      // D'abord, essayer de charger depuis la base de données
      const { data, error } = await supabase
        .from('platform_customization')
        .select('value')
        .eq('key', 'logo_url')
        .maybeSingle()

      if (!error && data?.value) {
        // La valeur peut être un JSONB string ou un objet
        const logoValue = typeof data.value === 'string' 
          ? data.value.replace(/"/g, '') 
          : data.value
        if (logoValue && logoValue !== 'null' && logoValue.trim() !== '') {
          setLogoUrl(logoValue)
          return
        }
      }
      
      // Si pas de logo dans la base, utiliser le logo local par défaut
      // Le logo est dans public/logo.png.jpg
      setLogoUrl('/logo.png.jpg')
    } catch (error) {
      console.error('Error loading logo:', error)
      // En cas d'erreur, utiliser le logo local par défaut
      setLogoUrl('/logo.png.jpg')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('solidarpay_session')
    localStorage.removeItem('solidarpay_user')
    setSession(null)
    setUser(null)
    toast({ title: 'Déconnexion réussie' })
  }

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copié!',
      description: `${label} copié dans le presse-papier`,
    })
  }

  const openInteracEmail = () => {
    if (!activeCycle || !selectedTontine) return

    const raw = getReceiverRawForPayment(
      selectedTontine,
      activeCycle.beneficiary?.id,
      selectedTontine.members
    )
    const parsed = parseReceiverStorage(raw)
    if (parsed.kind !== 'email') {
      toast({
        title: 'Interac non disponible',
        description:
          'Pour cette tontine, utilisez les coordonnées bancaires affichées ou le bouton « Copier ».',
      })
      return
    }

    const beneficiary = activeCycle.beneficiary
    const amount = selectedTontine.contributionAmount
    const currency = selectedTontine.currency || 'CAD'
    const kohoEmail = parsed.email

    const subject = encodeURIComponent(`Cotisation SolidarPay - ${selectedTontine.name}`)
    const body = encodeURIComponent(
      `Bonjour,\n\nJe souhaite envoyer ma cotisation de ${formatCurrency(amount, currency)} via Interac e-Transfer.\n\nBénéficiaire: ${beneficiary?.fullName}\nEmail KOHO: ${kohoEmail}\n\nMerci!`
    )

    window.open(`mailto:${kohoEmail}?subject=${subject}&body=${body}`, '_blank')
  }

  const handleDeclarePayment = async () => {
    if (!user || !activeCycle) return

    try {
      const myContribution = contributions.find(c => c.userId === user.id)
      if (!myContribution) {
        toast({
          title: 'Erreur',
          description: 'Contribution introuvable',
          variant: 'destructive',
        })
        return
      }

      const res = await fetch('/api/contributions/declare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contributionId: myContribution.id }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      toast({
        title: 'Paiement déclaré!',
        description: 'En attente de validation par l\'administrateur',
      })

      // Refresh contributions
      selectTontine(selectedTontine.id)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleValidatePayment = async (contributionId, action) => {
    try {
      const endpoint = action === 'validate' ? 'validate' : 'reject'
      const res = await fetch(`/api/contributions/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contributionId, 
          adminId: user.id,
          notes: action === 'validate' ? 'Validé par admin' : 'Rejeté par admin'
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      toast({
        title: action === 'validate' ? 'Paiement validé' : 'Paiement rejeté',
        description: 'Le statut a été mis à jour',
      })

      // Refresh contributions
      selectTontine(selectedTontine.id)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleCreateTontine = async (e) => {
    e.preventDefault()

    const receiverMode = receiverFieldModeForCountry(user?.country)
    const trimmedName = normalizeTontineName(newTontineName)
    if (!trimmedName) {
      toast({
        title: 'Erreur',
        description: 'Le nom de la tontine est requis',
        variant: 'destructive',
      })
      return
    }

    try {
      if (await isTontineNameTaken(supabase, trimmedName)) {
        throw new Error(TONTINE_NAME_TAKEN_MSG)
      }

      let kohoReceiverEmail = ''
      if (newTontinePaymentMode === 'direct') {
        kohoReceiverEmail = directPerMemberMarkerJson()
      } else if (receiverMode === 'cl_transferencia') {
        const rut = newTontineClRut.trim()
        const bank = newTontineClBank.trim()
        const accountNumber = newTontineClAccountNumber.trim()
        const accountType = newTontineClAccountType.trim()
        if (!rut || !bank || !accountNumber) {
          throw new Error('RUT, banque et numéro de compte sont requis pour le Chili')
        }
        kohoReceiverEmail = serializeChileReceiver({ rut, bank, accountType, accountNumber })
      } else {
        kohoReceiverEmail = newTontineKohoEmail.trim()
        if (!kohoReceiverEmail) {
          throw new Error(
            receiverMode === 'koho_interac'
              ? 'L’email KOHO est requis'
              : 'Les coordonnées de réception des paiements sont requises'
          )
        }
      }

      const res = await fetch('/api/tontines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          contributionAmount: parseFloat(newTontineAmount),
          frequency: newTontineFrequency,
          adminId: user.id,
          kohoReceiverEmail,
          memberIds: selectedMembers,
          currency: adminCreateCurrency,
          paymentMode: newTontinePaymentMode,
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      toast({
        title: 'Tontine créée!',
        description: 'La tontine a été créée avec succès',
      })

      setNewTontineName('')
      setNewTontineAmount('')
      setNewTontineKohoEmail('')
      setNewTontinePaymentMode('direct')
      setNewTontineClRut('')
      setNewTontineClBank('')
      setNewTontineClAccountType('')
      setNewTontineClAccountNumber('')
      setSelectedMembers([])

      loadData()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleCreateCycle = async () => {
    if (!selectedTontine) return

    try {
      // Find next beneficiary
      const nextBeneficiary = selectedTontine.members.find(m => !m.hasReceived)
      if (!nextBeneficiary) {
        toast({
          title: 'Attention',
          description: 'Tous les membres ont déjà reçu. Voulez-vous recommencer le cycle?',
          variant: 'default',
        })
        return
      }

      const startDate = new Date()
      const endDate = new Date()
      if (selectedTontine.frequency === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1)
      } else {
        endDate.setDate(endDate.getDate() + 14)
      }

      const res = await fetch('/api/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tontineId: selectedTontine.id,
          beneficiaryId: nextBeneficiary.userId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      toast({
        title: 'Cycle créé!',
        description: `Nouveau cycle pour ${nextBeneficiary.user.fullName}`,
      })

      // Reload tontine
      selectTontine(selectedTontine.id)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const sendReminders = async () => {
    if (!activeCycle) return

    try {
      const res = await fetch('/api/notifications/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycleId: activeCycle.id }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      toast({
        title: 'Rappels envoyés!',
        description: `${data.sent} email(s) envoyé(s)`,
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const tontineFrequencyLabel = (f) =>
    f === 'monthly' ? 'Mensuelle' : f === 'biweekly' ? 'Bi-hebdomadaire' : 'Hebdomadaire'

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  // Landing page for non-authenticated users
  if (!user) {
    return <LandingPage />
  }

  const myContribution = contributions.find(c => c.userId === user.id)
  const validatedCount = contributions.filter(c => c.status === 'validated').length
  const pendingValidationCount = contributions.filter(c => c.status === 'pending_validation').length
  const totalMembers = selectedTontine?.members?.length || 0

  // Main App
  return (
    <>
      {/* Modal de complétion du profil */}
      {user && (user.role === 'member' || user.role === 'admin') && (
        <CompleteProfileModal
          user={user}
          open={showCompleteProfile}
          onComplete={handleProfileComplete}
        />
      )}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 md:py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 md:gap-4">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="SolidarPay" 
                className="h-8 w-8 md:h-12 md:w-12 object-contain bg-white rounded-full shadow"
                onError={(e) => {
                  // Si le logo personnalisé échoue, utiliser le logo par défaut avec lettre S
                  e.target.style.display = 'none'
                  const defaultLogo = e.target.nextElementSibling
                  if (defaultLogo) defaultLogo.style.display = 'flex'
                }}
              />
            ) : null}
            <div className={`w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center ${logoUrl ? 'hidden' : ''}`}>
              <span className="text-white font-bold text-sm md:text-lg">S</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent truncate sm:truncate-none">
                SolidarPay
              </h1>
              <p className="hidden sm:block text-xs md:text-sm text-slate-600">Tontine digitalisée</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 md:gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs md:text-sm font-medium">{user.fullName}</p>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                {user.role === 'admin' ? 'Administrateur' : 'Membre'}
              </Badge>
            </div>
            {user.role === 'member' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/profile')}
                className="hidden md:flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden lg:inline">Mon Profil</span>
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={handleLogout} className="h-9 w-9 md:h-10 md:w-10">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto min-w-0 px-3 sm:px-4 py-4 md:py-8">
        {user.role === 'admin' ? (
          // ADMIN VIEW
          (() => {
            const adminReceiverMode = receiverFieldModeForCountry(user?.country)
            const adminCurrencyInfo = getCurrencyInfo(adminCreateCurrency)
            return (
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 md:mb-8 text-xs sm:text-sm">
              <TabsTrigger value="dashboard" className="text-xs sm:text-sm">Tableau de bord</TabsTrigger>
              <TabsTrigger value="management" className="text-xs sm:text-sm">Gestion</TabsTrigger>
              <TabsTrigger value="create" className="text-xs sm:text-sm">Nouvelle Tontine</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              {/* Tontine Selector */}
              {tontines.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sélectionner une tontine</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select 
                      value={selectedTontine?.id || undefined} 
                      onValueChange={selectTontine}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une tontine" />
                      </SelectTrigger>
                      <SelectContent>
                        {tontines.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              )}

              {selectedTontine && (
                <>
                  {/* Stats Cards */}
                  <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Membres</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalMembers}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Montant/Cycle</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(selectedTontine.contributionAmount, selectedTontine.currency || 'CAD')}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Fréquence</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {selectedTontine.frequency === 'monthly' ? 'Mensuel' : 'Bi-hebdo'}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Collecté</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(activeCycle?.totalCollected || 0, selectedTontine?.currency || 'CAD')}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          sur {formatCurrency(activeCycle?.totalExpected || 0, selectedTontine?.currency || 'CAD')}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Active Cycle */}
                  {activeCycle ? (
                    <Card className="border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Cycle en cours - #{activeCycle.cycleNumber}
                        </CardTitle>
                        <CardDescription>
                          Du {new Date(activeCycle.startDate).toLocaleDateString('fr-FR')} au {new Date(activeCycle.endDate).toLocaleDateString('fr-FR')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Bénéficiaire</p>
                          <p className="text-xl font-bold text-cyan-600">{activeCycle.beneficiary?.fullName}</p>
                          <p className="text-sm text-muted-foreground">{activeCycle.beneficiary?.email}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 sm:gap-4">
                          <div className="bg-white p-3 sm:p-4 rounded-lg text-center">
                            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-green-600" />
                            <p className="text-lg sm:text-2xl font-bold">{validatedCount}</p>
                            <p className="text-xs text-muted-foreground">Validés</p>
                          </div>
                          <div className="bg-white p-3 sm:p-4 rounded-lg text-center">
                            <Clock className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-yellow-600" />
                            <p className="text-lg sm:text-2xl font-bold">{pendingValidationCount}</p>
                            <p className="text-xs text-muted-foreground">En attente</p>
                          </div>
                          <div className="bg-white p-3 sm:p-4 rounded-lg text-center">
                            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-red-600" />
                            <p className="text-lg sm:text-2xl font-bold">{totalMembers - validatedCount - pendingValidationCount}</p>
                            <p className="text-xs text-muted-foreground">Non payés</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={sendReminders} variant="outline" className="flex-1">
                            <Mail className="h-4 w-4 mr-2" />
                            Envoyer rappels
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Aucun cycle actif</CardTitle>
                        <CardDescription>Créez un nouveau cycle pour commencer</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button onClick={handleCreateCycle} className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Lancer un nouveau cycle
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Contributions List */}
                  {activeCycle && contributions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Cotisations</CardTitle>
                        <CardDescription>Validez les paiements déclarés par les membres</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {contributions.map(contrib => (
                            <div key={contrib.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                  <p className="font-medium">{contrib.user?.fullName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatCurrency(contrib.amount, selectedTontine?.currency || 'CAD')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {contrib.status === 'pending' && (
                                  <Badge variant="outline" className="bg-slate-50">En attente</Badge>
                                )}
                                {contrib.status === 'pending_validation' && (
                                  <>
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">À valider</Badge>
                                    <Button size="sm" variant="default" onClick={() => handleValidatePayment(contrib.id, 'validate')}>
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Valider
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleValidatePayment(contrib.id, 'reject')}>
                                      Rejeter
                                    </Button>
                                  </>
                                )}
                                {contrib.status === 'validated' && (
                                  <Badge className="bg-green-600">Validé ✓</Badge>
                                )}
                                {contrib.status === 'rejected' && (
                                  <Badge variant="destructive">Rejeté</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="management" className="space-y-6">
              {selectedTontine && (
                <>
                  {/* Tontine Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Paramètres de la tontine</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Nom</Label>
                          <p className="text-lg font-medium">{selectedTontine.name}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <Label>Coordonnées de réception</Label>
                          <div className="text-lg">
                            <ReceiverDetails raw={selectedTontine.kohoReceiverEmail} />
                          </div>
                        </div>
                        <div>
                          <Label>Montant</Label>
                          <p className="text-lg font-medium">
                            {formatCurrency(selectedTontine.contributionAmount, selectedTontine.currency || 'CAD')}
                          </p>
                        </div>
                        <div>
                          <Label>Fréquence</Label>
                          <p className="text-lg font-medium">
                            {selectedTontine.frequency === 'monthly' ? 'Mensuel' : 'Bi-hebdomadaire'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Members List */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Membres et ordre de rotation</CardTitle>
                      <CardDescription>{selectedTontine.members?.length} membres</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedTontine.members?.map((member, index) => (
                          <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold">
                                {member.rotationOrder}
                              </div>
                              <div>
                                <p className="font-medium">{member.user?.fullName}</p>
                                <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                              </div>
                            </div>
                            {member.hasReceived && (
                              <Badge className="bg-green-600">A reçu ✓</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cycles History */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Historique des cycles
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {cycles.map(cycle => (
                          <div key={cycle.id} className="p-4 border rounded-lg bg-white">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium">Cycle #{cycle.cycleNumber}</p>
                              <Badge variant={cycle.status === 'completed' ? 'default' : cycle.status === 'active' ? 'secondary' : 'outline'}>
                                {cycle.status === 'completed' ? 'Terminé' : cycle.status === 'active' ? 'En cours' : 'Annulé'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">Bénéficiaire: {cycle.beneficiary?.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(cycle.startDate).toLocaleDateString('fr-FR')} - {new Date(cycle.endDate).toLocaleDateString('fr-FR')}
                            </p>
                            <p className="text-sm font-medium mt-2">
                              Collecté: {formatCurrency(cycle.totalCollected, selectedTontine?.currency || 'CAD')} / {formatCurrency(cycle.totalExpected, selectedTontine?.currency || 'CAD')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="create">
              <Card>
                <CardHeader>
                  <CardTitle>Créer une nouvelle tontine</CardTitle>
                  <CardDescription>Configurez les paramètres de base de votre tontine</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTontine} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tontine-name">Nom de la tontine</Label>
                      <Input
                        id="tontine-name"
                        placeholder="Ex: Tontine Famille Dupont"
                        value={newTontineName}
                        onChange={(e) => setNewTontineName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">
                          Montant de cotisation
                          <span className="ml-2 text-sm font-normal text-muted-foreground">
                            ({adminCurrencyInfo.code})
                          </span>
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {adminCurrencyInfo.symbol}
                          </span>
                          <Input
                            id="amount"
                            type="number"
                            step={contributionAmountStep(adminCreateCurrency)}
                            min={contributionAmountStep(adminCreateCurrency) === '1' ? '1' : undefined}
                            placeholder={contributionAmountPlaceholder(adminCreateCurrency)}
                            value={newTontineAmount}
                            onChange={(e) => setNewTontineAmount(e.target.value)}
                            className="pl-8"
                            required
                          />
                        </div>
                        {user?.country ? (
                          <p className="text-xs text-muted-foreground">
                            Devise selon votre pays ({user.country}) : {adminCurrencyInfo.name}
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="frequency">Fréquence</Label>
                        <Select value={newTontineFrequency} onValueChange={setNewTontineFrequency}>
                          <SelectTrigger id="frequency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Mensuel</SelectItem>
                            <SelectItem value="biweekly">Bi-hebdomadaire</SelectItem>
                            <SelectItem value="weekly">Hebdomadaire</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentModeHome">Mode de paiement</Label>
                      <Select value={newTontinePaymentMode} onValueChange={setNewTontinePaymentMode}>
                        <SelectTrigger id="paymentModeHome">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="direct">
                            Paiement direct — les membres paient le bénéficiaire
                          </SelectItem>
                          <SelectItem value="via_admin">
                            Paiement via admin — les membres vous paient, vous payez le bénéficiaire
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newTontinePaymentMode === 'direct' && (
                      <div className="rounded-lg border border-cyan-200 bg-cyan-50/80 p-4 text-sm">
                        <p className="font-medium">Paiement direct</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Après création, renseignez les coordonnées de chaque membre (onglet Membres de la tontine).
                        </p>
                      </div>
                    )}
                    {newTontinePaymentMode === 'via_admin' && adminReceiverMode === 'cl_transferencia' && (
                      <div className="space-y-4 rounded-lg border bg-slate-50/80 p-4">
                        <p className="text-sm font-medium">Coordonnées transferencia / cuenta RUT (Chili)</p>
                        <p className="text-xs text-muted-foreground">
                          Affichées aux membres pour effectuer le virement bancaire.
                        </p>
                        <div className="space-y-2">
                          <Label htmlFor="cl-rut-home">RUT du bénéficiaire</Label>
                          <Input
                            id="cl-rut-home"
                            placeholder="12.345.678-9"
                            value={newTontineClRut}
                            onChange={(e) => setNewTontineClRut(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cl-bank-home">Banque</Label>
                          <Input
                            id="cl-bank-home"
                            placeholder="BancoEstado, Banco de Chile…"
                            value={newTontineClBank}
                            onChange={(e) => setNewTontineClBank(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cl-type-home">Type de compte</Label>
                          <Select
                            value={newTontineClAccountType || '_none'}
                            onValueChange={(v) => setNewTontineClAccountType(v === '_none' ? '' : v)}
                          >
                            <SelectTrigger id="cl-type-home">
                              <SelectValue placeholder="Sélectionner" />
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
                          <Label htmlFor="cl-acc-home">Numéro de compte</Label>
                          <Input
                            id="cl-acc-home"
                            placeholder="Numéro de cuenta"
                            value={newTontineClAccountNumber}
                            onChange={(e) => setNewTontineClAccountNumber(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    )}
                    {newTontinePaymentMode === 'via_admin' && adminReceiverMode === 'koho_interac' && (
                      <div className="space-y-2">
                        <Label htmlFor="koho-email">Email KOHO (réception)</Label>
                        <Input
                          id="koho-email"
                          type="email"
                          placeholder="paiement@koho.ca"
                          value={newTontineKohoEmail}
                          onChange={(e) => setNewTontineKohoEmail(e.target.value)}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Votre email KOHO pour recevoir les cotisations
                        </p>
                      </div>
                    )}
                    {newTontinePaymentMode === 'via_admin' && adminReceiverMode === 'email_generic' && (
                      <div className="space-y-2">
                        <Label htmlFor="recv-generic-home">Email ou identifiant de réception</Label>
                        <Input
                          id="recv-generic-home"
                          type="text"
                          placeholder="contact@exemple.fr"
                          value={newTontineKohoEmail}
                          onChange={(e) => setNewTontineKohoEmail(e.target.value)}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Identifiant utilisé par les membres pour vous verser la cotisation.
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Ajouter des membres (optionnel)</Label>
                      <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                        {allUsers.filter(u => u.id !== user.id).map(u => (
                          <div key={u.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`user-${u.id}`}
                              checked={selectedMembers.includes(u.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMembers([...selectedMembers, u.id])
                                } else {
                                  setSelectedMembers(selectedMembers.filter(id => id !== u.id))
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor={`user-${u.id}`} className="text-sm cursor-pointer">
                              {u.fullName} ({u.email})
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-blue-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Créer la tontine
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
            )
          })()
        ) : (
          // MEMBER VIEW
          <div className="space-y-6">
            {!user.country ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Tontines dans votre pays
                  </CardTitle>
                  <CardDescription>
                    Indiquez votre pays dans votre profil pour afficher les tontines actives gérées par des admins du
                    même pays.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Tontines en {countryDiscoverLabel || user.country}
                  </CardTitle>
                  <CardDescription>
                    Liste des tontines <strong>actives</strong> dont l’administrateur est enregistré dans le même pays
                    que vous (ex. Chili ↔ Chili). Utilisez « Demander » pour envoyer une demande d’adhésion, ou le code
                    d’invitation ci-dessous si vous préférez.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {countryTontines.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aucune tontine active dans ce pays pour le moment. Vous pouvez rejoindre une tontine avec un code
                      ou un identifiant ci-dessous.
                    </p>
                  ) : (
                    <>
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tontine</TableHead>
                              <TableHead>Administrateur</TableHead>
                              <TableHead className="text-right">Cotisation</TableHead>
                              <TableHead>Fréquence</TableHead>
                              <TableHead className="text-center">Membres</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {countryTontines.map((row) => {
                              const isMember = tontines.some((t) => t.id === row.id)
                              const pending = myJoinRequests.some(
                                (r) => r.tontineId === row.id && r.status === 'pending'
                              )
                              const mcount = row.members?.[0]?.count ?? 0
                              return (
                                <TableRow key={row.id}>
                                  <TableCell className="font-medium">{row.name}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {row.admin?.fullName || '—'}
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    {formatCurrency(row.contributionAmount, row.currency || 'CAD')}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {tontineFrequencyLabel(row.frequency)}
                                  </TableCell>
                                  <TableCell className="text-center">{mcount}</TableCell>
                                  <TableCell className="text-right">
                                    {isMember ? (
                                      <Badge variant="secondary">Membre</Badge>
                                    ) : pending ? (
                                      <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-200">
                                        Demande envoyée
                                      </Badge>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-cyan-600 text-cyan-700 hover:bg-cyan-50"
                                        disabled={joinRowLoadingId !== null || joinSubmitting}
                                        onClick={() => handleJoinRequestFromList(row)}
                                      >
                                        {joinRowLoadingId === row.id ? 'Envoi…' : 'Demander'}
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Le message optionnel du bloc « Rejoindre une tontine » ci-dessous est joint à la demande si vous
                        le remplissez avant de cliquer sur « Demander ».
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Rejoindre une tontine
                </CardTitle>
                <CardDescription>
                  Entrez le <strong>code d’invitation</strong> ou l’<strong>identifiant</strong> (UUID) que vous a
                  transmis l’administrateur de la tontine.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={submitJoinRequest} className="space-y-3 max-w-lg">
                  <div>
                    <Label htmlFor="join-invite">Code ou identifiant</Label>
                    <Input
                      id="join-invite"
                      value={joinInviteInput}
                      onChange={(e) => setJoinInviteInput(e.target.value)}
                      placeholder="Ex. ABCD2XYZ"
                      className="mt-1 font-mono"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <Label htmlFor="join-msg">Message pour l’admin (optionnel)</Label>
                    <Input
                      id="join-msg"
                      value={joinMessage}
                      onChange={(e) => setJoinMessage(e.target.value)}
                      placeholder="Brève présentation…"
                      className="mt-1"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={joinSubmitting || !joinInviteInput.trim()}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600"
                  >
                    {joinSubmitting ? 'Envoi…' : 'Envoyer la demande'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {myJoinRequests.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Mes demandes d’adhésion</CardTitle>
                  <CardDescription>Suivi auprès des administrateurs de tontine</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {myJoinRequests.map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border rounded-lg p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{r.tontineName || 'Tontine'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleString('fr-FR')}
                        </p>
                        {r.message ? (
                          <p className="text-xs text-muted-foreground mt-1 italic">« {r.message} »</p>
                        ) : null}
                      </div>
                      <Badge
                        variant={r.status === 'pending' ? 'outline' : 'secondary'}
                        className={
                          r.status === 'accepted'
                            ? 'bg-green-50 text-green-800 border-green-200'
                            : r.status === 'rejected'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : ''
                        }
                      >
                        {r.status === 'pending'
                          ? 'En attente'
                          : r.status === 'accepted'
                            ? 'Acceptée'
                            : 'Refusée'}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {/* Tontine Selector */}
            {tontines.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Mes tontines</CardTitle>
                  <CardDescription>
                    {tontines.length} {tontines.length === 1 ? 'tontine' : 'tontines'} à votre disposition
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={selectedTontine?.id || undefined} 
                    onValueChange={selectTontine}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une tontine" />
                    </SelectTrigger>
                    <SelectContent>
                      {tontines.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Mes tontines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Aucune tontine
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Vous n&apos;êtes actuellement membre d&apos;aucune tontine.
                    </p>
                    <p className="text-xs text-gray-500">
                      Utilisez le formulaire ci-dessus avec le code ou l’identifiant fourni par l’administrateur, ou
                      demandez-lui de vous ajouter depuis son espace.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Messages de l'administrateur */}
            {selectedTontine && (
              <TontineMessages tontineId={selectedTontine.id} />
            )}

            {selectedTontine && activeCycle && (
              <>
                {/* Cycle Info */}
                <Card className="border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Cycle en cours - #{activeCycle.cycleNumber}
                    </CardTitle>
                    <CardDescription>
                      Du {new Date(activeCycle.startDate).toLocaleDateString('fr-FR')} au {new Date(activeCycle.endDate).toLocaleDateString('fr-FR')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-white p-6 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-2">Bénéficiaire de ce cycle</p>
                      <p className="text-3xl font-bold text-cyan-600 mb-1">{activeCycle.beneficiary?.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        recevra {formatCurrency(activeCycle.totalExpected, selectedTontine?.currency || 'CAD')}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg text-center">
                        <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                        <p className="text-2xl font-bold">{validatedCount}</p>
                        <p className="text-xs text-muted-foreground">Cotisé</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg text-center">
                        <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                        <p className="text-2xl font-bold">{totalMembers - validatedCount}</p>
                        <p className="text-xs text-muted-foreground">En attente</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg text-center">
                        <DollarSign className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                        <p className="text-2xl font-bold">
                          {formatCurrency(activeCycle.totalCollected, selectedTontine?.currency || 'CAD')}
                        </p>
                        <p className="text-xs text-muted-foreground">collectés</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Ma cotisation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-muted-foreground">Montant à envoyer</p>
                        <p className="text-2xl font-bold text-cyan-600">
                          {formatCurrency(selectedTontine.contributionAmount, selectedTontine.currency || 'CAD')}
                        </p>
                      </div>
                      <div className="space-y-2 text-sm">
                        {(() => {
                          const paymentRaw = getReceiverRawForPayment(
                            selectedTontine,
                            activeCycle?.beneficiary?.id,
                            selectedTontine?.members
                          )
                          const recv = parseReceiverStorage(paymentRaw)
                          if (recv.kind === 'cl_transferencia') {
                            return (
                              <div className="space-y-1 mb-2">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Coordonnées bancaires (transferencia)
                                </p>
                                <p className="font-medium">{recv.bank || '—'}</p>
                                <p>RUT : {recv.rut || '—'}</p>
                                {recv.accountType ? <p>Type : {recv.accountType}</p> : null}
                                <p>N° compte : {recv.accountNumber || '—'}</p>
                              </div>
                            )
                          }
                          if (recv.kind === 'email') {
                            return (
                              <div className="flex justify-between gap-2 mb-2">
                                <span className="text-muted-foreground shrink-0">Email de réception :</span>
                                <span className="font-medium break-all text-right">{recv.email}</span>
                              </div>
                            )
                          }
                          if (recv.kind === 'empty') {
                            return (
                              <p className="text-muted-foreground mb-2">
                                Aucune coordonnée renseignée pour le bénéficiaire de ce cycle. L’administrateur doit
                                compléter les coordonnées de ce membre (paiement direct).
                              </p>
                            )
                          }
                          if (recv.kind === 'direct_per_member') {
                            return (
                              <p className="text-muted-foreground mb-2">
                                Mode direct par membre : coordonnées non encore renseignées pour le bénéficiaire actuel.
                              </p>
                            )
                          }
                          return (
                            <div className="mb-2">
                              <p className="text-muted-foreground text-xs mb-1">Coordonnées</p>
                              <p className="font-medium whitespace-pre-line break-words">{recv.display}</p>
                            </div>
                          )
                        })()}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Statut :</span>
                          {myContribution?.status === 'pending' && (
                            <Badge variant="outline" className="bg-yellow-50">En attente de paiement</Badge>
                          )}
                          {myContribution?.status === 'pending_validation' && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">En attente de validation</Badge>
                          )}
                          {myContribution?.status === 'validated' && (
                            <Badge className="bg-green-600">Validé ✓</Badge>
                          )}
                          {myContribution?.status === 'rejected' && (
                            <Badge variant="destructive">Rejeté</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {myContribution?.status === 'pending' && (
                      <>
                        <div className="space-y-3">
                          <p className="text-sm font-medium">
                            {(() => {
                              const rk = parseReceiverStorage(
                                getReceiverRawForPayment(
                                  selectedTontine,
                                  activeCycle?.beneficiary?.id,
                                  selectedTontine?.members
                                )
                              )
                              if (rk.kind === 'cl_transferencia') {
                                return 'Utilisez un virement bancaire avec les coordonnées ci-dessus.'
                              }
                              if (rk.kind === 'email') {
                                return 'Options de paiement (Interac / courriel) :'
                              }
                              return 'Instructions de paiement :'
                            })()}
                          </p>

                          <Button
                            onClick={() => {
                              const beneficiaryMember = selectedTontine.members?.find(
                                (m) =>
                                  String(m.userId || m.user?.id) ===
                                  String(activeCycle?.beneficiary?.id || '')
                              )
                              copyToClipboard(
                                buildMemberPaymentCopyText(
                                  selectedTontine,
                                  activeCycle?.beneficiary?.fullName,
                                  formatCurrency(
                                    selectedTontine.contributionAmount,
                                    selectedTontine.currency || 'CAD'
                                  ),
                                  beneficiaryMember?.receiverPaymentStorage
                                ),
                                'Informations de paiement'
                              )
                            }}
                            variant="outline"
                            className="w-full justify-start"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copier les informations de paiement
                          </Button>

                          {parseReceiverStorage(
                            getReceiverRawForPayment(
                              selectedTontine,
                              activeCycle?.beneficiary?.id,
                              selectedTontine?.members
                            )
                          ).kind === 'email' && (
                            <Button
                              onClick={openInteracEmail}
                              variant="outline"
                              className="w-full justify-start"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Ouvrir l&apos;email Interac pré-rempli
                            </Button>
                          )}
                        </div>

                        <div className="border-t pt-4">
                          <p className="text-sm text-muted-foreground mb-3">
                            {parseReceiverStorage(
                              getReceiverRawForPayment(
                                selectedTontine,
                                activeCycle?.beneficiary?.id,
                                selectedTontine?.members
                              )
                            ).kind === 'cl_transferencia'
                              ? 'Après votre virement, indiquez que vous avez payé ci-dessous :'
                              : 'Après avoir envoyé votre paiement, cliquez sur le bouton ci-dessous :'}
                          </p>
                          <Button 
                            onClick={handleDeclarePayment}
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            J'ai payé
                          </Button>
                        </div>
                      </>
                    )}

                    {myContribution?.status === 'pending_validation' && (
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <p className="font-medium text-blue-900">Paiement déclaré</p>
                        <p className="text-sm text-blue-700 mt-1">
                          En attente de validation par l'administrateur
                        </p>
                      </div>
                    )}

                    {myContribution?.status === 'validated' && (
                      <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <p className="font-medium text-green-900">Paiement validé ✓</p>
                        <p className="text-sm text-green-700 mt-1">
                          Merci pour votre contribution!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Members Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Statut des membres</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {contributions.map(contrib => (
                        <div key={contrib.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                          <span className="font-medium">{contrib.user?.fullName}</span>
                          {contrib.status === 'validated' && (
                            <Badge className="bg-green-600">✓ Cotisé</Badge>
                          )}
                          {contrib.status === 'pending_validation' && (
                            <Badge variant="outline" className="bg-blue-50">En validation</Badge>
                          )}
                          {contrib.status === 'pending' && (
                            <Badge variant="outline">En attente</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {!activeCycle && selectedTontine && (
              <Card>
                <CardHeader>
                  <CardTitle>Aucun cycle actif</CardTitle>
                  <CardDescription>
                    Le prochain cycle sera bientôt lancé par l'administrateur
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Cycles History */}
            {cycles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Historique
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cycles.map(cycle => (
                      <div key={cycle.id} className="p-4 border rounded-lg bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">Cycle #{cycle.cycleNumber}</p>
                          <Badge variant={cycle.status === 'completed' ? 'default' : 'secondary'}>
                            {cycle.status === 'completed' ? 'Terminé' : 'En cours'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Bénéficiaire: {cycle.beneficiary?.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(cycle.startDate).toLocaleDateString('fr-FR')} - {new Date(cycle.endDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      <Toaster />
    </div>
    </>
  )
}