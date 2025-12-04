'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import LandingPage from '@/components/landing/LandingPage'
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
  ShieldCheck,
  Upload,
  X
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
  const [selectedMembers, setSelectedMembers] = useState([])
  const [logoUrl, setLogoUrl] = useState(null)
  const [kycStatus, setKycStatus] = useState(null)
  const [kycLoading, setKycLoading] = useState(false)
  const [showKYCAlert, setShowKYCAlert] = useState(true)

  useEffect(() => {
    checkAuth()
    loadLogo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (user) {
      loadData()
      if (user.role === 'member') {
        loadKYCStatus()
      }
    }
  }, [user])

  const loadKYCStatus = async () => {
    if (!user?.id) return
    
    try {
      setKycLoading(true)
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading KYC status:', error)
      } else {
        setKycStatus(data)
      }
    } catch (error) {
      console.error('Error loading KYC status:', error)
    } finally {
      setKycLoading(false)
    }
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
        setLoading(false)
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
    }
    
    setLoading(false)
  }

  const loadData = async () => {
    try {
      // Load tontines
      const tontinesRes = await fetch('/api/tontines')
      const tontinesData = await tontinesRes.json()
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

  const selectTontine = async (tontineId) => {
    try {
      // Load tontine details with members
      const tontineRes = await fetch(`/api/tontines/${tontineId}`)
      const tontineData = await tontineRes.json()
      setSelectedTontine(tontineData)

      // Load active cycle
      const cycleRes = await fetch(`/api/cycles/active/${tontineId}`)
      const cycleData = await cycleRes.json()
      setActiveCycle(cycleData)

      // Load contributions if there's an active cycle
      if (cycleData?.id) {
        const contribRes = await fetch(`/api/contributions/cycle/${cycleData.id}`)
        const contribData = await contribRes.json()
        setContributions(contribData)
      }

      // Load all cycles
      const cyclesRes = await fetch(`/api/cycles/tontine/${tontineId}`)
      const cyclesData = await cyclesRes.json()
      setCycles(cyclesData)
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
        .single()

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

    const beneficiary = activeCycle.beneficiary
    const amount = selectedTontine.contributionAmount
    const kohoEmail = selectedTontine.kohoReceiverEmail

    const subject = encodeURIComponent(`Cotisation SolidarPay - ${selectedTontine.name}`)
    const body = encodeURIComponent(
      `Bonjour,\n\nJe souhaite envoyer ma cotisation de ${amount} CAD via Interac e-Transfer.\n\nBénéficiaire: ${beneficiary?.fullName}\nEmail KOHO: ${kohoEmail}\n\nMerci!`
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
    
    try {
      const res = await fetch('/api/tontines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTontineName,
          contributionAmount: parseFloat(newTontineAmount),
          frequency: newTontineFrequency,
          adminId: user.id,
          kohoReceiverEmail: newTontineKohoEmail,
          memberIds: selectedMembers,
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      toast({
        title: 'Tontine créée!',
        description: 'La tontine a été créée avec succès',
      })

      // Reset form
      setNewTontineName('')
      setNewTontineAmount('')
      setNewTontineKohoEmail('')
      setSelectedMembers([])

      // Reload data
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="SolidarPay" 
                className="h-12 w-12 object-contain bg-white rounded-full shadow"
                onError={(e) => {
                  // Si le logo personnalisé échoue, utiliser le logo par défaut avec lettre S
                  e.target.style.display = 'none'
                  const defaultLogo = e.target.nextElementSibling
                  if (defaultLogo) defaultLogo.style.display = 'flex'
                }}
              />
            ) : null}
            <div className={`w-12 h-12 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center ${logoUrl ? 'hidden' : ''}`}>
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                SolidarPay
              </h1>
              <p className="text-sm text-slate-600">Tontine digitalisée</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{user.fullName}</p>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                {user.role === 'admin' ? 'Administrateur' : 'Membre'}
              </Badge>
            </div>
            {user.role === 'member' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/profile')}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Mon Profil
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {user.role === 'admin' ? (
          // ADMIN VIEW
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
              <TabsTrigger value="management">Gestion</TabsTrigger>
              <TabsTrigger value="create">Nouvelle Tontine</TabsTrigger>
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
                  <div className="grid gap-4 md:grid-cols-4">
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
                        <div className="text-2xl font-bold">{selectedTontine.contributionAmount} CAD</div>
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
                        <div className="text-2xl font-bold">{activeCycle?.totalCollected || 0} CAD</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          sur {activeCycle?.totalExpected || 0} CAD
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

                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white p-4 rounded-lg text-center">
                            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                            <p className="text-2xl font-bold">{validatedCount}</p>
                            <p className="text-xs text-muted-foreground">Validés</p>
                          </div>
                          <div className="bg-white p-4 rounded-lg text-center">
                            <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                            <p className="text-2xl font-bold">{pendingValidationCount}</p>
                            <p className="text-xs text-muted-foreground">En attente</p>
                          </div>
                          <div className="bg-white p-4 rounded-lg text-center">
                            <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
                            <p className="text-2xl font-bold">{totalMembers - validatedCount - pendingValidationCount}</p>
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
                                  <p className="text-sm text-muted-foreground">{contrib.amount} CAD</p>
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
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Nom</Label>
                          <p className="text-lg font-medium">{selectedTontine.name}</p>
                        </div>
                        <div>
                          <Label>Email KOHO</Label>
                          <p className="text-lg font-medium">{selectedTontine.kohoReceiverEmail}</p>
                        </div>
                        <div>
                          <Label>Montant</Label>
                          <p className="text-lg font-medium">{selectedTontine.contributionAmount} CAD</p>
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
                              Collecté: {cycle.totalCollected} / {cycle.totalExpected} CAD
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Montant de cotisation (CAD)</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          placeholder="100.00"
                          value={newTontineAmount}
                          onChange={(e) => setNewTontineAmount(e.target.value)}
                          required
                        />
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
                      <Label htmlFor="koho-email">Email KOHO pour Interac</Label>
                      <Input
                        id="koho-email"
                        type="email"
                        placeholder="koho@example.com"
                        value={newTontineKohoEmail}
                        onChange={(e) => setNewTontineKohoEmail(e.target.value)}
                        required
                      />
                    </div>
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
        ) : (
          // MEMBER VIEW
          <div className="space-y-6">
            {/* KYC Alert - Visible si pas encore vérifié */}
            {user.role === 'member' && kycStatus && 
             kycStatus.status !== 'approved' && 
             kycStatus.status !== 'verifie' && 
             showKYCAlert && (
              <Card className="border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-shrink-0 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-orange-900 mb-1">
                          Vérifiez votre identité
                        </h3>
                        <p className="text-sm text-orange-700 mb-4">
                          Pour accéder à toutes les fonctionnalités de SolidarPay et participer aux tontines, vous devez vérifier votre identité en soumettant un document d'identité.
                        </p>
                        <Button
                          onClick={() => router.push('/profile?tab=kyc')}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Soumettre mon document
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowKYCAlert(false)}
                      className="text-orange-700 hover:text-orange-900"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* KYC Alert - Si aucun document soumis */}
            {user.role === 'member' && !kycLoading && !kycStatus && showKYCAlert && (
              <Card className="border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-shrink-0 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-orange-900 mb-1">
                          Vérifiez votre identité
                        </h3>
                        <p className="text-sm text-orange-700 mb-4">
                          Pour accéder à toutes les fonctionnalités de SolidarPay et participer aux tontines, vous devez vérifier votre identité en soumettant un document d'identité.
                        </p>
                        <Button
                          onClick={() => router.push('/profile?tab=kyc')}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Soumettre mon document
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowKYCAlert(false)}
                      className="text-orange-700 hover:text-orange-900"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tontine Selector */}
            {tontines.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Mes tontines</CardTitle>
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
                      <p className="text-sm text-muted-foreground">recevra {activeCycle.totalExpected} CAD</p>
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
                        <p className="text-2xl font-bold">{activeCycle.totalCollected}</p>
                        <p className="text-xs text-muted-foreground">CAD collectés</p>
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
                        <p className="text-2xl font-bold text-cyan-600">{selectedTontine.contributionAmount} CAD</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email KOHO:</span>
                          <span className="font-medium">{selectedTontine.kohoReceiverEmail}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Statut:</span>
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
                          <p className="text-sm font-medium">Options de paiement via KOHO:</p>
                          
                          <Button 
                            onClick={() => copyToClipboard(
                              `Montant: ${selectedTontine.contributionAmount} CAD\nEmail: ${selectedTontine.kohoReceiverEmail}`,
                              'Informations de paiement'
                            )}
                            variant="outline"
                            className="w-full justify-start"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copier les informations de paiement
                          </Button>

                          <Button 
                            onClick={openInteracEmail}
                            variant="outline"
                            className="w-full justify-start"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ouvrir l'email Interac pré-rempli
                          </Button>
                        </div>

                        <div className="border-t pt-4">
                          <p className="text-sm text-muted-foreground mb-3">
                            Après avoir envoyé votre paiement via KOHO, cliquez sur le bouton ci-dessous:
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
  )
}