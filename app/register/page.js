'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { UserPlus, ArrowLeft, CheckCircle, Users, UserCheck, Globe } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    country: '',
    role: 'member' // Par défaut membre
  })
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingCountries, setLoadingCountries] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Charger les pays disponibles
    loadCountries()
    
    // Vérifier si l'utilisateur est déjà connecté
    const savedSession = localStorage.getItem('solidarpay_session')
    const savedUser = localStorage.getItem('solidarpay_user')
    
    if (savedSession && savedUser) {
      const userData = JSON.parse(savedUser)
      
      // Rediriger selon le rôle
      if (userData.role === 'super_admin') {
        router.push('/admin/login')
        return
      }
      
      if (userData.role === 'admin') {
        router.push('/admin-tontine')
        return
      }
      
      router.push('/')
    }
  }, [router])

  const loadCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_countries')
        .select('code, name')
        .eq('enabled', true)
        .order('name', { ascending: true })

      if (error) throw error
      setCountries(data || [])
    } catch (error) {
      console.error('Error loading countries:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les pays. Veuillez réessayer.',
        variant: 'destructive',
      })
    } finally {
      setLoadingCountries(false)
    }
  }

  const getCountryFlag = (countryCode) => {
    const flags = {
      'CA': '🇨🇦', 'US': '🇺🇸', 'FR': '🇫🇷', 'BE': '🇧🇪', 'CH': '🇨🇭',
      'MX': '🇲🇽', 'CL': '🇨🇱', 'HT': '🇭🇹', 'SN': '🇸🇳', 'CM': '🇨🇲'
    }
    return flags[countryCode] || '🌍'
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validation basique
      if (formData.password.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères')
      }

      if (!formData.country) {
        throw new Error('Veuillez sélectionner votre pays')
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phone: formData.phone || null,
          country: formData.country,
          role: formData.role || 'member',
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Sauvegarder la session
      localStorage.setItem('solidarpay_session', JSON.stringify(data.session))
      localStorage.setItem('solidarpay_user', JSON.stringify(data.user))

      toast({
        title: 'Inscription réussie!',
        description: `Bienvenue ${data.user.fullName}! Vérifiez votre email pour confirmer votre compte.`,
      })

      // Rediriger selon le rôle
      if (data.user.role === 'admin') {
        router.push('/admin-tontine')
        return
      }

      // Rediriger les membres vers la page principale
      router.push('/')
    } catch (error) {
      toast({
        title: 'Erreur d\'inscription',
        description: error.message || 'Une erreur est survenue lors de l\'inscription',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-solidarpay-bg via-white to-solidarpay-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-solidarpay-text/70 hover:text-solidarpay-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <Card className="shadow-2xl border-solidarpay-border">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <img 
                src="/logo.png.jpg" 
                alt="SolidarPay" 
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextElementSibling.style.display = 'flex'
                }}
              />
              <div className="w-16 h-16 bg-gradient-to-br from-solidarpay-primary to-solidarpay-secondary rounded-lg flex items-center justify-center hidden">
                <span className="text-white font-bold text-2xl">S</span>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-solidarpay-text">
              Créer un compte
            </CardTitle>
            <CardDescription className="text-base">
              Rejoignez SolidarPay et modernisez votre tontine familiale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet *</Label>
                <Input
                  id="fullName"
                  placeholder="Jean Dupont"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="border-solidarpay-border focus:border-solidarpay-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="border-solidarpay-border focus:border-solidarpay-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone (optionnel)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={formData.phone}
                  onChange={handleChange}
                  className="border-solidarpay-border focus:border-solidarpay-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Pays de résidence *
                </Label>
                {loadingCountries ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-solidarpay-primary"></div>
                    <span className="ml-2 text-sm text-solidarpay-text/70">Chargement des pays...</span>
                  </div>
                ) : (
                  <Select 
                    value={formData.country} 
                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                    required
                  >
                    <SelectTrigger className="border-solidarpay-border focus:border-solidarpay-primary">
                      <SelectValue placeholder="Sélectionnez votre pays" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.length === 0 ? (
                        <div className="p-4 text-center text-sm text-solidarpay-text/70">
                          Aucun pays disponible
                        </div>
                      ) : (
                        countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            <span className="flex items-center gap-2">
                              <span>{getCountryFlag(country.code)}</span>
                              <span>{country.name}</span>
                            </span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-solidarpay-text/50">
                  Cette information nous aide à personnaliser votre expérience
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Type de compte *</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger className="border-solidarpay-border focus:border-solidarpay-primary">
                    <SelectValue placeholder="Choisissez votre type de compte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">
                      Membre - Participer aux tontines
                    </SelectItem>
                    <SelectItem value="admin">
                      Admin Tontine - Créer et gérer mes tontines
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-solidarpay-text/50">
                  {formData.role === 'member' 
                    ? 'Vous pourrez participer aux tontines créées par les administrateurs'
                    : 'Vous pourrez créer et gérer vos propres tontines, et ajouter des membres'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="border-solidarpay-border focus:border-solidarpay-primary"
                />
                <p className="text-xs text-solidarpay-text/50">
                  Minimum 6 caractères
                </p>
              </div>

              <div className="bg-solidarpay-bg p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium text-solidarpay-text">Avantages de s'inscrire :</p>
                <ul className="text-xs text-solidarpay-text/70 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Gestion simplifiée de vos tontines
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Suivi en temps réel des contributions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Sécurité maximale avec vérification KYC
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Completement gratuit
                  </li>
                </ul>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-solidarpay-primary hover:bg-solidarpay-secondary text-white" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Inscription...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Créer mon compte
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-solidarpay-text/70">
                Déjà un compte ?{' '}
                <Link 
                  href="/login" 
                  className="text-solidarpay-primary hover:text-solidarpay-secondary font-medium transition-colors"
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}

