'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { LogIn, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
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
      
      // Membre ou autre - rester sur la page actuelle ou rediriger vers dashboard
      router.push('/')
    }
  }, [router])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Rediriger les super admins vers /admin/login
      if (data.user.role === 'super_admin') {
        toast({
          title: 'Accès réservé',
          description: 'Les super administrateurs doivent se connecter via /admin/login',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      // Sauvegarder la session
      localStorage.setItem('solidarpay_session', JSON.stringify(data.session))
      localStorage.setItem('solidarpay_user', JSON.stringify(data.user))

      // Rediriger les admins tontine vers l'interface complète /admin-tontine
      if (data.user.role === 'admin') {
        router.push('/admin-tontine')
        return
      }

      // Rediriger les membres vers la page principale (dashboard)
      toast({
        title: 'Connexion réussie!',
        description: `Bienvenue ${data.user.fullName}`,
      })
      
      router.push('/')
    } catch (error) {
      toast({
        title: 'Erreur de connexion',
        description: error.message || 'Email ou mot de passe incorrect',
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
              Connexion
            </CardTitle>
            <CardDescription className="text-base">
              Connectez-vous à votre compte SolidarPay
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-solidarpay-border focus:border-solidarpay-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-solidarpay-border focus:border-solidarpay-primary"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-solidarpay-primary hover:bg-solidarpay-secondary text-white" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connexion...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Se connecter
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-solidarpay-text/70">
                Pas encore de compte ?{' '}
                <Link 
                  href="/register" 
                  className="text-solidarpay-primary hover:text-solidarpay-secondary font-medium transition-colors"
                >
                  Créer un compte
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

