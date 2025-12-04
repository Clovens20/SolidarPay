'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  ShieldCheck, 
  FileText, 
  Upload, 
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import UploadKYC from '@/components/kyc/UploadKYC'
import KYCStatus from '@/components/kyc/KYCStatus'
import { useToast } from '@/hooks/use-toast'

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [kycData, setKycData] = useState(null)
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (user?.id) {
      loadKYCData()
    }
  }, [user])

  const loadUser = async () => {
    try {
      // Vérifier l'authentification via localStorage (compatible avec app/page.js)
      const savedSession = localStorage.getItem('solidarpay_session')
      const savedUser = localStorage.getItem('solidarpay_user')
      
      if (!savedSession || !savedUser) {
        router.push('/?redirect=profile')
        return
      }

      const userData = JSON.parse(savedUser)
      
      // Vérifier que la session est toujours valide avec Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        // Session invalide, rediriger vers login
        localStorage.removeItem('solidarpay_session')
        localStorage.removeItem('solidarpay_user')
        router.push('/')
        return
      }

      // Charger les données utilisateur depuis la base
      const { data: userFromDB, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (userError) throw userError

      setUser(userFromDB || userData)
    } catch (error) {
      console.error('Error loading user:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos informations',
        variant: 'destructive',
      })
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const loadKYCData = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })

      if (error && error.code !== 'PGRST116') throw error
      setKycData(data || [])
    } catch (error) {
      console.error('Error loading KYC data:', error)
    }
  }

  const handleKYCComplete = () => {
    setShowUpload(false)
    loadKYCData()
    toast({
      title: 'Document soumis',
      description: 'Votre document est en cours de vérification',
    })
  }

  const handleUploadClick = () => {
    // Vérifier les tentatives
    if (kycData && kycData.length >= 5) {
      toast({
        title: 'Limite atteinte',
        description: 'Vous avez atteint la limite de 5 soumissions. Contactez le support.',
        variant: 'destructive',
      })
      return
    }
    setShowUpload(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-solidarpay-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solidarpay-primary mx-auto"></div>
          <p className="mt-4 text-solidarpay-text/70">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const latestKYC = kycData?.[0]
  const hasApprovedKYC = latestKYC?.status === 'approved' || latestKYC?.status === 'verifie'

  return (
    <div className="min-h-screen bg-solidarpay-bg">
      {/* Header simple */}
      <div className="bg-white border-b border-solidarpay-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="text-solidarpay-text hover:text-solidarpay-primary"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-solidarpay-text">Mon Profil</h1>
                <p className="text-sm text-solidarpay-text/70">Gérez vos informations et vérification d'identité</p>
              </div>
            </div>
            {hasApprovedKYC && (
              <Badge className="bg-green-600 text-white">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Compte vérifié
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Mon Profil
            </TabsTrigger>
            <TabsTrigger value="kyc">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Vérification d'identité
            </TabsTrigger>
          </TabsList>

          {/* Tab Profil */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>
                  Vos informations de compte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-solidarpay-text/70">
                      <Mail className="w-4 h-4" />
                      Email
                    </div>
                    <p className="text-solidarpay-text font-medium">{user.email}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-solidarpay-text/70">
                      <User className="w-4 h-4" />
                      Nom complet
                    </div>
                    <p className="text-solidarpay-text font-medium">{user.fullName || 'Non renseigné'}</p>
                  </div>

                  {user.phone && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-solidarpay-text/70">
                        <Phone className="w-4 h-4" />
                        Téléphone
                      </div>
                      <p className="text-solidarpay-text font-medium">{user.phone}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-solidarpay-text/70">
                      <Calendar className="w-4 h-4" />
                      Date d'inscription
                    </div>
                    <p className="text-solidarpay-text font-medium">
                      {user.createdAt 
                        ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                        : 'Non disponible'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-solidarpay-text/70">
                      <User className="w-4 h-4" />
                      Rôle
                    </div>
                    <Badge variant="outline">
                      {user.role === 'member' ? 'Membre' : 
                       user.role === 'admin' ? 'Admin Tontine' : 
                       user.role === 'super_admin' ? 'Super Admin' : user.role}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab KYC */}
          <TabsContent value="kyc" className="space-y-6">
            {/* Statut KYC actuel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Statut de vérification
                </CardTitle>
                <CardDescription>
                  Vérifiez votre identité pour accéder à toutes les fonctionnalités
                </CardDescription>
              </CardHeader>
              <CardContent>
                <KYCStatus 
                  userId={user.id} 
                  onUpload={handleUploadClick}
                />
              </CardContent>
            </Card>

            {/* Upload ou Historique */}
            {showUpload && !hasApprovedKYC ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Télécharger un document
                  </CardTitle>
                  <CardDescription>
                    Soumettez votre pièce d'identité pour vérification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UploadKYC 
                    user={user} 
                    onComplete={handleKYCComplete}
                  />
                </CardContent>
              </Card>
            ) : !hasApprovedKYC && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-solidarpay-bg flex items-center justify-center">
                      <FileText className="w-8 h-8 text-solidarpay-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-solidarpay-text mb-2">
                        Vérifiez votre identité
                      </h3>
                      <p className="text-sm text-solidarpay-text/70 mb-4">
                        Pour participer pleinement à SolidarPay, vous devez vérifier votre identité.
                      </p>
                      <Button
                        onClick={handleUploadClick}
                        className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Télécharger mon document
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Historique des soumissions */}
            {kycData && kycData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Historique des soumissions
                  </CardTitle>
                  <CardDescription>
                    Vos documents KYC précédents ({kycData.length}/5 tentatives)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {kycData.map((doc, index) => (
                      <div
                        key={doc.id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-solidarpay-text">
                                Soumission #{kycData.length - index}
                              </span>
                              <Badge
                                variant={
                                  doc.status === 'approved' || doc.status === 'verifie'
                                    ? 'default'
                                    : doc.status === 'rejected' || doc.status === 'rejete'
                                    ? 'destructive'
                                    : doc.status === 'pending' || doc.status === 'en_attente'
                                    ? 'secondary'
                                    : 'outline'
                                }
                              >
                                {doc.status === 'approved' || doc.status === 'verifie' ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Approuvé
                                  </>
                                ) : doc.status === 'rejected' || doc.status === 'rejete' ? (
                                  <>
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Rejeté
                                  </>
                                ) : doc.status === 'pending' || doc.status === 'en_attente' ? (
                                  <>
                                    <Clock className="w-3 h-3 mr-1" />
                                    En attente
                                  </>
                                ) : (
                                  'En cours'
                                )}
                              </Badge>
                              {doc.autoScore !== null && doc.autoScore !== undefined && (
                                <Badge variant="outline">
                                  Score: {doc.autoScore}%
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-solidarpay-text/70">
                              Date: {new Date(doc.createdAt || doc.submittedAt).toLocaleString('fr-FR')}
                            </p>
                            {doc.rejectionReason && (
                              <p className="text-sm text-red-600 mt-2">
                                Raison: {doc.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

