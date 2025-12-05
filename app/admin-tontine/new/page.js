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
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save } from 'lucide-react'
import { getCurrencyByCountry, getCurrencyInfo, formatCurrency } from '@/lib/currency-utils'

export default function NewTontinePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [adminCountry, setAdminCountry] = useState(null)
  const [currency, setCurrency] = useState('CAD')
  const [loadingAdmin, setLoadingAdmin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    contributionAmount: '',
    frequency: 'monthly',
    kohoReceiverEmail: '',
    paymentMode: 'direct' // 'direct' ou 'via_admin'
  })

  useEffect(() => {
    loadAdminInfo()
  }, [])

  const loadAdminInfo = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Charger les informations de l'admin
      const { data: adminData, error } = await supabase
        .from('users')
        .select('country')
        .eq('id', session.user.id)
        .single()

      if (error) throw error

      if (adminData?.country) {
        setAdminCountry(adminData.country)
        
        // Si l'admin a un pays dans payment_countries, récupérer la devise depuis là
        const { data: countryData } = await supabase
          .from('payment_countries')
          .select('currency')
          .eq('code', adminData.country)
          .single()

        if (countryData?.currency) {
          setCurrency(countryData.currency)
        } else {
          // Sinon, utiliser le mapping par défaut
          const defaultCurrency = getCurrencyByCountry(adminData.country)
          setCurrency(defaultCurrency)
        }
      }
    } catch (error) {
      console.error('Error loading admin info:', error)
    } finally {
      setLoadingAdmin(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('tontines')
        .insert([{
          name: formData.name,
          contributionAmount: parseFloat(formData.contributionAmount),
          frequency: formData.frequency,
          adminId: session.user.id,
          kohoReceiverEmail: formData.kohoReceiverEmail,
          paymentMode: formData.paymentMode,
          currency: currency, // Devise automatiquement configurée selon le pays de l'admin
          status: 'active'
        }])
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Tontine créée!',
        description: 'Votre tontine a été créée avec succès'
      })

      router.push(`/admin-tontine/tontine/${data.id}`)
    } catch (error) {
      console.error('Error creating tontine:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la tontine',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <button
        onClick={() => router.push('/admin-tontine')}
        className="text-sm text-solidarpay-text/70 hover:text-solidarpay-text flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à mes tontines
      </button>

      <div>
        <h1 className="text-3xl font-bold text-solidarpay-text">Créer une nouvelle tontine</h1>
        <p className="text-solidarpay-text/70 mt-1">Configurez votre nouvelle tontine</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de la tontine</CardTitle>
          <CardDescription>Remplissez les informations pour créer votre tontine</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la tontine *</Label>
              <Input
                id="name"
                placeholder="Ex: Tontine Famille Dupont"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Montant de cotisation * 
                  {!loadingAdmin && currency && (
                    <span className="ml-2 text-sm font-normal text-solidarpay-text/70">
                      ({getCurrencyInfo(currency).code})
                    </span>
                  )}
                </Label>
                <div className="relative">
                  {!loadingAdmin && currency && (
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-solidarpay-text/70">
                      {getCurrencyInfo(currency).symbol}
                    </span>
                  )}
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="100.00"
                    value={formData.contributionAmount}
                    onChange={(e) => setFormData({ ...formData, contributionAmount: e.target.value })}
                    className={!loadingAdmin && currency ? "pl-8" : ""}
                    required
                  />
                </div>
                {!loadingAdmin && adminCountry && (
                  <p className="text-xs text-solidarpay-text/70">
                    Devise automatique selon votre pays ({adminCountry}): {getCurrencyInfo(currency).name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Fréquence *</Label>
                <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensuelle</SelectItem>
                    <SelectItem value="biweekly">Bi-hebdomadaire</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMode">Mode de paiement *</Label>
              <Select 
                value={formData.paymentMode} 
                onValueChange={(value) => setFormData({ ...formData, paymentMode: value })}
              >
                <SelectTrigger id="paymentMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">
                    Paiement direct - Les membres paient directement le bénéficiaire
                  </SelectItem>
                  <SelectItem value="via_admin">
                    Paiement via admin - Les membres paient l'admin, qui paie ensuite le bénéficiaire
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-solidarpay-text/70">
                {formData.paymentMode === 'direct' 
                  ? 'Les membres paieront directement la personne qui recevra la tontine'
                  : 'Les membres vous paieront, et vous pourrez payer le bénéficiaire une fois que tous ont payé'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email KOHO (récepteur) *</Label>
              <Input
                id="email"
                type="email"
                placeholder="paiement@koho.ca"
                value={formData.kohoReceiverEmail}
                onChange={(e) => setFormData({ ...formData, kohoReceiverEmail: e.target.value })}
                required
              />
              <p className="text-xs text-solidarpay-text/70">
                {formData.paymentMode === 'direct' 
                  ? 'Email KOHO du bénéficiaire qui recevra les paiements'
                  : 'Votre email KOHO pour recevoir les paiements des membres'}
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin-tontine')}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Création...' : 'Créer la tontine'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

