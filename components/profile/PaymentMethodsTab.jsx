'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { CreditCard, Plus, Trash2, CheckCircle, Globe } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  PAYMENT_METHOD_LABELS,
  paymentMethodUsesEmail,
  paymentMethodUsesAccountOrRut,
} from '@/lib/payment-methods'

export default function PaymentMethodsTab({ user }) {
  const { toast } = useToast()
  const [paymentMethods, setPaymentMethods] = useState([])
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState('')
  const [availableMethods, setAvailableMethods] = useState([])
  const [formData, setFormData] = useState({
    paymentMethod: '',
    email: '',
    phone: '',
    accountNumber: '',
    bankName: '',
    otherDetails: ''
  })

  useEffect(() => {
    if (user) {
      loadPaymentMethods()
      loadCountries()
    }
  }, [user])

  const loadPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('user_payment_methods')
        .select('*')
        .eq('userId', user.id)
        .eq('isActive', true)
        .order('createdAt', { ascending: false })

      if (error) throw error
      setPaymentMethods(data || [])
    } catch (error) {
      console.error('Error loading payment methods:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos méthodes de paiement',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_countries')
        .select('code, name, paymentMethods')
        .eq('enabled', true)
        .order('name', { ascending: true })

      if (error) throw error
      setCountries(data || [])
    } catch (error) {
      console.error('Error loading countries:', error)
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
    // Reset form
    setFormData({
      paymentMethod: '',
      email: '',
      phone: '',
      accountNumber: '',
      bankName: '',
      otherDetails: ''
    })
  }

  const handleAddPaymentMethod = async () => {
    if (!selectedCountry || !formData.paymentMethod) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un pays et une méthode de paiement',
        variant: 'destructive',
      })
      return
    }

    try {
      // Préparer les détails de paiement
      const paymentDetails = {}
      if (formData.email) paymentDetails.email = formData.email
      if (formData.phone) paymentDetails.phone = formData.phone
      if (formData.accountNumber) paymentDetails.accountNumber = formData.accountNumber
      if (formData.bankName) paymentDetails.bankName = formData.bankName
      if (formData.otherDetails) paymentDetails.otherDetails = formData.otherDetails

      // Vérifier si une méthode existe déjà pour ce pays et cette méthode
      const existing = paymentMethods.find(
        pm => pm.country === selectedCountry && pm.paymentMethod === formData.paymentMethod
      )

      if (existing) {
        // Mettre à jour la méthode existante
        const { error } = await supabase
          .from('user_payment_methods')
          .update({
            paymentDetails,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (error) throw error

        toast({
          title: 'Succès',
          description: 'Méthode de paiement mise à jour',
        })
      } else {
        // Créer une nouvelle méthode
        const { error } = await supabase
          .from('user_payment_methods')
          .insert({
            userId: user.id,
            country: selectedCountry,
            paymentMethod: formData.paymentMethod,
            paymentDetails,
            isDefault: paymentMethods.length === 0, // Première méthode = par défaut
          })

        if (error) throw error

        toast({
          title: 'Succès',
          description: 'Méthode de paiement ajoutée',
        })
      }

      setShowAddDialog(false)
      loadPaymentMethods()
      // Reset form
      setSelectedCountry('')
      setFormData({
        paymentMethod: '',
        email: '',
        phone: '',
        accountNumber: '',
        bankName: '',
        otherDetails: ''
      })
    } catch (error) {
      console.error('Error adding payment method:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ajouter la méthode de paiement',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette méthode de paiement ?')) return

    try {
      const { error } = await supabase
        .from('user_payment_methods')
        .update({ isActive: false })
        .eq('id', id)

      if (error) throw error

      toast({
        title: 'Succès',
        description: 'Méthode de paiement supprimée',
      })

      loadPaymentMethods()
    } catch (error) {
      console.error('Error deleting payment method:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la méthode de paiement',
        variant: 'destructive',
      })
    }
  }

  const getCountryName = (code) => {
    const country = countries.find(c => c.code === code)
    return country ? country.name : code
  }

  const getCountryFlag = (code) => {
    const flags = {
      'CA': '🇨🇦', 'US': '🇺🇸', 'FR': '🇫🇷', 'BE': '🇧🇪', 'CH': '🇨🇭',
      'MX': '🇲🇽', 'CL': '🇨🇱', 'HT': '🇭🇹', 'SN': '🇸🇳', 'CM': '🇨🇲'
    }
    return flags[code] || '🌍'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solidarpay-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mes méthodes de paiement</CardTitle>
              <CardDescription>
                Configurez vos méthodes de paiement selon votre pays pour faciliter les transactions
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une méthode
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-solidarpay-text/30 mx-auto mb-4" />
              <p className="text-solidarpay-text/70">
                Aucune méthode de paiement configurée
              </p>
              <p className="text-sm text-solidarpay-text/50 mt-2">
                Ajoutez une méthode de paiement pour faciliter vos transactions
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <Card key={method.id} className="border-solidarpay-border">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getCountryFlag(method.country)}</span>
                          <span className="font-semibold">{getCountryName(method.country)}</span>
                          {method.isDefault && (
                            <Badge variant="default" className="ml-2">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Par défaut
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-solidarpay-text/70" />
                          <span className="text-sm font-medium">
                            {PAYMENT_METHOD_LABELS[method.paymentMethod] || method.paymentMethod}
                          </span>
                        </div>
                        {method.paymentDetails && Object.keys(method.paymentDetails).length > 0 && (
                          <div className="mt-2 space-y-1 text-sm text-solidarpay-text/70">
                            {method.paymentDetails.email && (
                              <p>Email: {method.paymentDetails.email}</p>
                            )}
                            {method.paymentDetails.phone && (
                              <p>Téléphone: {method.paymentDetails.phone}</p>
                            )}
                            {method.paymentDetails.accountNumber && (
                              <p>N° de compte: {method.paymentDetails.accountNumber}</p>
                            )}
                            {method.paymentDetails.bankName && (
                              <p>Banque: {method.paymentDetails.bankName}</p>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(method.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour ajouter une méthode */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une méthode de paiement</DialogTitle>
            <DialogDescription>
              Sélectionnez votre pays et configurez votre méthode de paiement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                <Globe className="w-4 h-4 inline mr-2" />
                Pays *
              </Label>
              <Select value={selectedCountry} onValueChange={handleCountryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez votre pays" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {getCountryFlag(country.code)} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCountry && (
              <>
                <div className="space-y-2">
                  <Label>Méthode de paiement *</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une méthode" />
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

                {/* Champs spécifiques selon la méthode */}
                {paymentMethodUsesEmail(formData.paymentMethod) && (
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

                {paymentMethodUsesAccountOrRut(formData.paymentMethod) && (
                  <>
                    <div className="space-y-2">
                      <Label>
                        {formData.paymentMethod === 'cuenta_rut_transferencia'
                          ? 'RUT / Cuenta bancaria *'
                          : 'Numéro de compte / Téléphone *'}
                      </Label>
                      <Input
                        type="text"
                        placeholder={
                          formData.paymentMethod === 'cuenta_rut_transferencia'
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
                        {formData.paymentMethod === 'cuenta_rut_transferencia'
                          ? 'Banco (optional)'
                          : 'Nom de la banque'}
                      </Label>
                      <Input
                        type="text"
                        placeholder={
                          formData.paymentMethod === 'cuenta_rut_transferencia'
                            ? 'Ej. Banco de Chile, BancoEstado…'
                            : 'Nom de la banque'
                        }
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {formData.paymentMethod === 'credit_card' && (
                  <div className="space-y-2">
                    <Label>Détails supplémentaires</Label>
                    <Input
                      type="text"
                      placeholder="Détails de votre carte"
                      value={formData.otherDetails}
                      onChange={(e) => setFormData({ ...formData, otherDetails: e.target.value })}
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAddPaymentMethod}
              disabled={!selectedCountry || !formData.paymentMethod}
              className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

