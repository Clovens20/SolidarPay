'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Save, User, Globe, CreditCard } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import PaymentMethodsTab from '@/components/profile/PaymentMethodsTab'

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState(null)
  const [countries, setCountries] = useState([])
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    kohoEmail: '',
  })

  useEffect(() => {
    loadCountries()
    loadProfile()
  }, [])

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
        description: 'Impossible de charger la liste des pays.',
        variant: 'destructive',
      })
    } finally {
      setLoadingCountries(false)
    }
  }

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error
      setUser(data)
      setFormData({
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        country: data.country || '',
        kohoEmail: data.kohoEmail || '',
      })
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCountryFlag = (countryCode) => {
    const flags = {
      CA: '🇨🇦',
      US: '🇺🇸',
      FR: '🇫🇷',
      BE: '🇧🇪',
      CH: '🇨🇭',
      MX: '🇲🇽',
      CL: '🇨🇱',
      HT: '🇭🇹',
      SN: '🇸🇳',
      CM: '🇨🇲',
    }
    return flags[countryCode] || '🌍'
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      if (!formData.country) {
        toast({
          title: 'Pays requis',
          description: 'Sélectionnez votre pays de résidence.',
          variant: 'destructive',
        })
        setSaving(false)
        return
      }

      const { data: countryRow, error: countryErr } = await supabase
        .from('payment_countries')
        .select('code, enabled')
        .eq('code', formData.country)
        .single()

      if (countryErr || !countryRow?.enabled) {
        toast({
          title: 'Pays invalide',
          description: 'Ce pays n’est pas disponible. Choisissez-en un autre.',
          variant: 'destructive',
        })
        setSaving(false)
        return
      }

      const kohoTrimmed = formData.kohoEmail?.trim() || null

      const { error } = await supabase
        .from('users')
        .update({
          fullName: formData.fullName,
          phone: formData.phone || null,
          country: formData.country,
          kohoEmail: kohoTrimmed,
        })
        .eq('id', session.user.id)

      if (error) throw error

      const savedUserRaw = localStorage.getItem('solidarpay_user')
      if (savedUserRaw) {
        try {
          const prev = JSON.parse(savedUserRaw)
          localStorage.setItem(
            'solidarpay_user',
            JSON.stringify({
              ...prev,
              fullName: formData.fullName,
              phone: formData.phone || null,
              country: formData.country,
              kohoEmail: kohoTrimmed,
            })
          )
        } catch {
          /* ignore */
        }
      }

      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été sauvegardées.',
      })

      loadProfile()
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le profil.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solidarpay-primary mx-auto"></div>
          <p className="mt-4 text-solidarpay-text">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <button
        type="button"
        onClick={() => router.push('/admin-tontine')}
        className="text-sm text-solidarpay-text/70 hover:text-solidarpay-text flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <div>
        <h1 className="text-3xl font-bold text-solidarpay-text">Mon profil</h1>
        <p className="text-solidarpay-text/70 mt-1">
          Corrigez votre pays, vos coordonnées et vos moyens de réception des paiements si besoin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informations personnelles
          </CardTitle>
          <CardDescription>Nom, pays, téléphone et email KOHO / Interac</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (connexion)</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-solidarpay-text/70">
              L’email de connexion ne peut pas être modifié ici.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Pays de résidence *
            </Label>
            <Select
              value={formData.country}
              onValueChange={(value) => setFormData({ ...formData, country: value })}
              disabled={loadingCountries}
            >
              <SelectTrigger id="country">
                <SelectValue placeholder="Sélectionnez votre pays" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {getCountryFlag(c.code)} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kohoEmail">Email KOHO / Interac e-Transfer</Label>
            <Input
              id="kohoEmail"
              type="email"
              placeholder="ex. votre.email@koho.ca"
              value={formData.kohoEmail}
              onChange={(e) => setFormData({ ...formData, kohoEmail: e.target.value })}
            />
            <p className="text-xs text-solidarpay-text/70">
              Utilisé lorsque des membres vous envoient une cotisation par Interac (Canada). Laissez vide si non
              applicable.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </CardContent>
      </Card>

      {user?.id && (
        <>
          <Separator className="my-8" />
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-solidarpay-text">
              <CreditCard className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Méthodes de paiement détaillées</h2>
            </div>
            <p className="text-sm text-solidarpay-text/70">
              RIB, compte RUT / transferencia, PayPal, etc. — même gestion que pour les membres.
            </p>
            <PaymentMethodsTab user={user} />
          </div>
        </>
      )}
    </div>
  )
}
