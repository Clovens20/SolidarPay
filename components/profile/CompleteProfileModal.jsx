'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Globe, CreditCard, AlertCircle, CheckCircle } from 'lucide-react'
import {
  PAYMENT_METHOD_LABELS,
  paymentMethodUsesEmail,
  paymentMethodUsesAccountOrRut,
} from '@/lib/payment-methods'

const getCountryFlag = (code) => {
  const flags = {
    'CA': '🇨🇦', 'US': '🇺🇸', 'FR': '🇫🇷', 'BE': '🇧🇪', 'CH': '🇨🇭',
    'MX': '🇲🇽', 'CL': '🇨🇱', 'HT': '🇭🇹', 'SN': '🇸🇳', 'CM': '🇨🇲'
  }
  return flags[code] || '🌍'
}

export default function CompleteProfileModal({ user, open, onComplete }) {
  const { toast } = useToast()
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form states
  const [selectedCountry, setSelectedCountry] = useState('')
  const [availableMethods, setAvailableMethods] = useState([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    accountNumber: '',
    bankName: '',
    otherDetails: ''
  })

  useEffect(() => {
    if (open) {
      loadCountries()
      // Pré-remplir avec le pays de l'utilisateur s'il existe
      if (user?.country) {
        setSelectedCountry(user.country)
      }
    }
  }, [open, user])

  const loadCountries = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('payment_countries')
        .select('code, name, paymentMethods')
        .eq('enabled', true)
        .order('name', { ascending: true })

      if (error) throw error
      setCountries(data || [])
      
      // Si l'utilisateur a déjà un pays, charger ses méthodes
      if (user?.country) {
        const country = data?.find(c => c.code === user.country)
        if (country && country.paymentMethods) {
          setAvailableMethods(Array.isArray(country.paymentMethods) ? country.paymentMethods : [])
        }
      }
    } catch (error) {
      console.error('Error loading countries:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les pays',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCountryChange = (countryCode) => {
    setSelectedCountry(countryCode)
    const country = countries.find(c => c.code === countryCode)
    if (country && country.paymentMethods) {
      setAvailableMethods(Array.isArray(country.paymentMethods) ? country.paymentMethods : [])
    } else {
      setAvailableMethods([])
    }
    // Reset payment method selection
    setSelectedPaymentMethod('')
    setFormData({
      email: '',
      phone: '',
      accountNumber: '',
      bankName: '',
      otherDetails: ''
    })
  }

  const handleSave = async () => {
    if (!selectedCountry) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner votre pays',
        variant: 'destructive',
      })
      return
    }

    if (!selectedPaymentMethod) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une méthode de paiement',
        variant: 'destructive',
      })
      return
    }

    // Valider les champs requis selon la méthode
    if (paymentMethodUsesEmail(selectedPaymentMethod) && !formData.email) {
      toast({
        title: 'Erreur',
        description: 'Veuillez renseigner votre email pour cette méthode de paiement',
        variant: 'destructive',
      })
      return
    }

    if (paymentMethodUsesAccountOrRut(selectedPaymentMethod) && !formData.accountNumber) {
      toast({
        title: 'Erreur',
        description: 'Veuillez renseigner le RUT / compte ou le numéro demandé',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)

      // 1. Mettre à jour le pays de l'utilisateur
      const { error: userError } = await supabase
        .from('users')
        .update({ country: selectedCountry })
        .eq('id', user.id)

      if (userError) throw userError

      // 2. Créer ou mettre à jour la méthode de paiement
      const paymentDetails = {}
      if (formData.email) paymentDetails.email = formData.email
      if (formData.phone) paymentDetails.phone = formData.phone
      if (formData.accountNumber) paymentDetails.accountNumber = formData.accountNumber
      if (formData.bankName) paymentDetails.bankName = formData.bankName
      if (formData.otherDetails) paymentDetails.otherDetails = formData.otherDetails

      // Vérifier si une méthode existe déjà
      const { data: existingMethods } = await supabase
        .from('user_payment_methods')
        .select('id')
        .eq('userId', user.id)
        .eq('country', selectedCountry)
        .eq('paymentMethod', selectedPaymentMethod)
        .eq('isActive', true)
        .limit(1)

      if (existingMethods && existingMethods.length > 0) {
        // Mettre à jour
        const { error: updateError } = await supabase
          .from('user_payment_methods')
          .update({
            paymentDetails,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', existingMethods[0].id)

        if (updateError) throw updateError
      } else {
        // Créer
        const { error: insertError } = await supabase
          .from('user_payment_methods')
          .insert({
            userId: user.id,
            country: selectedCountry,
            paymentMethod: selectedPaymentMethod,
            paymentDetails,
            isDefault: true,
          })

        if (insertError) throw insertError
      }

      toast({
        title: 'Succès',
        description: 'Votre profil a été complété avec succès',
      })

      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de sauvegarder votre profil',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Compléter votre profil
          </DialogTitle>
          <DialogDescription>
            Pour utiliser pleinement SolidarPay, veuillez compléter votre profil en ajoutant votre pays de résidence et une méthode de paiement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sélection du pays */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Pays de résidence *
            </Label>
            {loading ? (
              <div className="text-sm text-muted-foreground">Chargement des pays...</div>
            ) : (
              <Select value={selectedCountry} onValueChange={handleCountryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre pays">
                    {selectedCountry && (
                      <span className="flex items-center gap-2">
                        <span>{getCountryFlag(selectedCountry)}</span>
                        <span>{countries.find(c => c.code === selectedCountry)?.name}</span>
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <span className="flex items-center gap-2">
                        <span>{getCountryFlag(country.code)}</span>
                        <span>{country.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Sélection de la méthode de paiement */}
          {selectedCountry && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Méthode de paiement *
              </Label>
              <Select
                value={selectedPaymentMethod}
                onValueChange={setSelectedPaymentMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une méthode de paiement" />
                </SelectTrigger>
                <SelectContent>
                  {availableMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {PAYMENT_METHOD_LABELS[method] || method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Champs spécifiques selon la méthode */}
          {selectedPaymentMethod && (
            <div className="space-y-4 border-t pt-4">
              {paymentMethodUsesEmail(selectedPaymentMethod) && (
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              )}

              {paymentMethodUsesAccountOrRut(selectedPaymentMethod) && (
                <>
                  <div className="space-y-2">
                    <Label>
                      {selectedPaymentMethod === 'cuenta_rut_transferencia'
                        ? 'RUT / Cuenta bancaria *'
                        : 'Numéro de compte / Téléphone *'}
                    </Label>
                    <Input
                      type="text"
                      placeholder={
                        selectedPaymentMethod === 'cuenta_rut_transferencia'
                          ? 'RUT o número de cuenta para transferencia'
                          : 'Numéro de compte ou téléphone'
                      }
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {selectedPaymentMethod === 'cuenta_rut_transferencia'
                        ? 'Banque (optionnel)'
                        : 'Nom de la banque'}
                    </Label>
                    <Input
                      type="text"
                      placeholder={
                        selectedPaymentMethod === 'cuenta_rut_transferencia'
                          ? 'Ej. Banco de Chile, BancoEstado…'
                          : 'Nom de la banque (optionnel)'
                      }
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    />
                  </div>
                </>
              )}

              {selectedPaymentMethod === 'credit_card' && (
                <div className="space-y-2">
                  <Label>Détails supplémentaires</Label>
                  <Input
                    type="text"
                    placeholder="Détails de votre carte (optionnel)"
                    value={formData.otherDetails}
                    onChange={(e) => setFormData({ ...formData, otherDetails: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={!selectedCountry || !selectedPaymentMethod || saving}
            className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

