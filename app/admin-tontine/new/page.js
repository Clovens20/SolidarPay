'use client'

import { useState } from 'react'
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

export default function NewTontinePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    contributionAmount: '',
    frequency: 'monthly',
    kohoReceiverEmail: ''
  })

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
                <Label htmlFor="amount">Montant de cotisation *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={formData.contributionAmount}
                  onChange={(e) => setFormData({ ...formData, contributionAmount: e.target.value })}
                  required
                />
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
                Email KOHO qui recevra les paiements Interac
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

