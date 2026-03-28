'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, ArrowLeft, Mail, Phone, Calendar, CreditCard } from 'lucide-react'
import PaymentMethodsTab from '@/components/profile/PaymentMethodsTab'
import { useToast } from '@/hooks/use-toast'

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const savedSession = localStorage.getItem('solidarpay_session')
      const savedUser = localStorage.getItem('solidarpay_user')

      if (!savedSession || !savedUser) {
        router.push('/?redirect=profile')
        return
      }

      const userData = JSON.parse(savedUser)

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        localStorage.removeItem('solidarpay_session')
        localStorage.removeItem('solidarpay_user')
        router.push('/')
        return
      }

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

  return (
    <div className="min-h-screen bg-solidarpay-bg">
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
                <h1 className="text-2xl font-bold text-solidarpay-text">Mon profil</h1>
                <p className="text-sm text-solidarpay-text/70">Vos informations et moyens de paiement</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Mon profil
            </TabsTrigger>
            <TabsTrigger value="payment">
              <CreditCard className="w-4 h-4 mr-2" />
              Méthodes de paiement
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>Vos informations de compte</CardDescription>
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
                      Date d&apos;inscription
                    </div>
                    <p className="text-solidarpay-text font-medium">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
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
                      {user.role === 'member'
                        ? 'Membre'
                        : user.role === 'admin'
                          ? 'Admin Tontine'
                          : user.role === 'super_admin'
                            ? 'Super Admin'
                            : user.role}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            {user && <PaymentMethodsTab user={user} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
