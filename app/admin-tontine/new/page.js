'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  normalizeTontineName,
  isTontineNameTaken,
  TONTINE_NAME_TAKEN_MSG,
} from '@/lib/tontine-name'
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
import { getCurrencyByCountry, getCurrencyInfo } from '@/lib/currency-utils'
import {
  receiverFieldModeForCountry,
  serializeChileReceiver,
  contributionAmountStep,
  contributionAmountPlaceholder,
  directPerMemberMarkerJson,
} from '@/lib/tontine-receiver'
import { ensureUniqueInviteCode } from '@/lib/tontine-invite-code'

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
    clRut: '',
    clBank: '',
    clAccountType: '',
    clAccountNumber: '',
    paymentMode: 'direct',
  })

  const receiverMode = receiverFieldModeForCountry(adminCountry)

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

      const trimmedName = normalizeTontineName(formData.name)
      if (!trimmedName) {
        throw new Error('Le nom de la tontine est requis')
      }

      if (await isTontineNameTaken(supabase, trimmedName)) {
        throw new Error(TONTINE_NAME_TAKEN_MSG)
      }

      let kohoReceiverEmail = ''
      if (formData.paymentMode === 'direct') {
        // Une coordonnée par bénéficiaire : saisie dans l’onglet Membres après création
        kohoReceiverEmail = directPerMemberMarkerJson()
      } else if (receiverMode === 'cl_transferencia') {
        const rut = formData.clRut.trim()
        const bank = formData.clBank.trim()
        const accountNumber = formData.clAccountNumber.trim()
        const accountType = formData.clAccountType.trim()
        if (!rut || !bank || !accountNumber) {
          throw new Error('RUT, banque et numéro de compte sont requis pour le Chili')
        }
        kohoReceiverEmail = serializeChileReceiver({
          rut,
          bank,
          accountType,
          accountNumber,
        })
      } else {
        kohoReceiverEmail = formData.kohoReceiverEmail.trim()
        if (!kohoReceiverEmail) {
          throw new Error(
            receiverMode === 'koho_interac'
              ? 'L’email KOHO est requis'
              : 'Les coordonnées de réception des paiements sont requises'
          )
        }
      }

      const inviteCode = await ensureUniqueInviteCode(supabase)

      const { data, error } = await supabase
        .from('tontines')
        .insert([{
          name: trimmedName,
          contributionAmount: parseFloat(formData.contributionAmount),
          frequency: formData.frequency,
          adminId: session.user.id,
          kohoReceiverEmail,
          paymentMode: formData.paymentMode,
          currency: currency,
          status: 'active',
          inviteCode,
        }])
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new Error(TONTINE_NAME_TAKEN_MSG)
        }
        throw error
      }

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
                    step={contributionAmountStep(currency)}
                    min={contributionAmountStep(currency) === '1' ? '1' : undefined}
                    placeholder={contributionAmountPlaceholder(currency)}
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
                  ? 'Les membres paieront directement la personne qui reçoit le cycle. Vous renseignerez les coordonnées bancaires (ou email) de chaque membre dans l’onglet Membres.'
                  : 'Les membres vous paieront, et vous pourrez payer le bénéficiaire une fois que tous ont payé'}
              </p>
            </div>

            {formData.paymentMode === 'direct' && (
              <div className="rounded-lg border border-cyan-200 bg-cyan-50/80 p-4 text-sm text-solidarpay-text">
                <p className="font-medium">Paiement direct</p>
                <p className="mt-1 text-xs text-solidarpay-text/80">
                  Après création, ouvrez la tontine → <strong>Membres</strong> et saisissez pour chaque participant les coordonnées sur lesquelles il recevra les cotisations lorsqu’il sera bénéficiaire (RUT, banque, compte pour le Chili, ou email KOHO selon le pays de l’admin).
                </p>
              </div>
            )}

            {formData.paymentMode === 'via_admin' && receiverMode === 'cl_transferencia' && (
              <div className="space-y-4 rounded-lg border border-solidarpay-border bg-slate-50/80 p-4">
                <p className="text-sm font-medium text-solidarpay-text">
                  Coordonnées transferencia / cuenta RUT (Chili)
                </p>
                <p className="text-xs text-solidarpay-text/70">
                  Ces informations seront affichées aux membres pour effectuer leur virement bancaire.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="clRut">RUT du bénéficiaire *</Label>
                  <Input
                    id="clRut"
                    placeholder="12.345.678-9"
                    value={formData.clRut}
                    onChange={(e) => setFormData({ ...formData, clRut: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clBank">Banque *</Label>
                  <Input
                    id="clBank"
                    placeholder="BancoEstado, Banco de Chile, etc."
                    value={formData.clBank}
                    onChange={(e) => setFormData({ ...formData, clBank: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clAccountType">Type de compte</Label>
                  <Select
                    value={formData.clAccountType || '_none'}
                    onValueChange={(v) =>
                      setFormData({ ...formData, clAccountType: v === '_none' ? '' : v })
                    }
                  >
                    <SelectTrigger id="clAccountType">
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
                  <Label htmlFor="clAccountNumber">Numéro de compte *</Label>
                  <Input
                    id="clAccountNumber"
                    placeholder="Numéro de cuenta"
                    value={formData.clAccountNumber}
                    onChange={(e) => setFormData({ ...formData, clAccountNumber: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            {formData.paymentMode === 'via_admin' && receiverMode === 'koho_interac' && (
              <div className="space-y-2">
                <Label htmlFor="email">Email KOHO (réception) *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="paiement@koho.ca"
                  value={formData.kohoReceiverEmail}
                  onChange={(e) => setFormData({ ...formData, kohoReceiverEmail: e.target.value })}
                  required
                />
                <p className="text-xs text-solidarpay-text/70">
                  Votre email KOHO pour recevoir les cotisations des membres
                </p>
              </div>
            )}

            {formData.paymentMode === 'via_admin' && receiverMode === 'email_generic' && (
              <div className="space-y-2">
                <Label htmlFor="email">Email ou identifiant de réception des paiements *</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="contact@exemple.fr ou identifiant fourni par votre banque"
                  value={formData.kohoReceiverEmail}
                  onChange={(e) => setFormData({ ...formData, kohoReceiverEmail: e.target.value })}
                  required
                />
                <p className="text-xs text-solidarpay-text/70">
                  Indiquez l’adresse ou l’identifiant que les membres utiliseront pour vous verser la cotisation (virement, PayPal, etc.).
                </p>
              </div>
            )}

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

