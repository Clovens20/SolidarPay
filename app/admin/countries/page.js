'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Globe, Plus, Edit, Save, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { logSystemEvent } from '@/lib/system-logger'

const PAYMENT_METHODS = ['interac', 'credit_card', 'bank_transfer', 'paypal', 'mobile_money', 'zelle', 'cash_app']

export default function CountriesPage() {
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    enabled: true,
    paymentMethods: []
  })
  const [newCountryForm, setNewCountryForm] = useState({
    name: '',
    code: '',
    enabled: true,
    paymentMethods: []
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadCountries()
  }, [])

  const loadCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_countries')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setCountries(data || [])
    } catch (error) {
      console.error('Error loading countries:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCountry = async (countryId, enabled) => {
    try {
      const { error } = await supabase
        .from('payment_countries')
        .update({ enabled: !enabled })
        .eq('id', countryId)

      if (error) throw error
      
      await logSystemEvent('system_country', `Pays ${!enabled ? 'activé' : 'désactivé'}`, {
        countryId,
        enabled: !enabled
      })
      
      loadCountries()
      toast({
        title: 'Succès',
        description: `Pays ${!enabled ? 'activé' : 'désactivé'} avec succès`,
      })
    } catch (error) {
      console.error('Error toggling country:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut du pays',
        variant: 'destructive'
      })
    }
  }

  const openEditModal = (country) => {
    setEditing(country.id)
    setEditForm({
      name: country.name || '',
      code: country.code || '',
      enabled: country.enabled !== false,
      paymentMethods: Array.isArray(country.paymentMethods) ? country.paymentMethods : []
    })
  }

  const closeEditModal = () => {
    setEditing(null)
    setEditForm({
      name: '',
      code: '',
      enabled: true,
      paymentMethods: []
    })
  }

  const openAddModal = () => {
    setShowAddModal(true)
    setNewCountryForm({
      name: '',
      code: '',
      enabled: true,
      paymentMethods: []
    })
  }

  const closeAddModal = () => {
    setShowAddModal(false)
    setNewCountryForm({
      name: '',
      code: '',
      enabled: true,
      paymentMethods: []
    })
  }

  const toggleNewPaymentMethod = (method) => {
    setNewCountryForm(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter(m => m !== method)
        : [...prev.paymentMethods, method]
    }))
  }

  const addCountry = async () => {
    try {
      if (!newCountryForm.name || !newCountryForm.code) {
        toast({
          title: 'Erreur',
          description: 'Veuillez remplir le nom et le code du pays',
          variant: 'destructive'
        })
        return
      }

      if (newCountryForm.code.length !== 2) {
        toast({
          title: 'Erreur',
          description: 'Le code pays doit contenir exactement 2 caractères (ex: CA, US, FR)',
          variant: 'destructive'
        })
        return
      }

      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('payment_countries')
        .insert({
          code: newCountryForm.code.toUpperCase(),
          name: newCountryForm.name,
          enabled: newCountryForm.enabled,
          paymentMethods: newCountryForm.paymentMethods,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })

      if (error) {
        if (error.code === '23505') { // Duplicate key
          toast({
            title: 'Erreur',
            description: 'Ce code pays existe déjà. Veuillez utiliser un autre code.',
            variant: 'destructive'
          })
        } else {
          throw error
        }
        return
      }

      await logSystemEvent('system_country', `Pays ${newCountryForm.name} ajouté`, {
        code: newCountryForm.code.toUpperCase(),
        name: newCountryForm.name
      }, null, user?.id)

      toast({
        title: 'Succès',
        description: `Pays ${newCountryForm.name} ajouté avec succès`,
      })
      
      closeAddModal()
      loadCountries()
    } catch (error) {
      console.error('Error adding country:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le pays',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const togglePaymentMethod = (method) => {
    setEditForm(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter(m => m !== method)
        : [...prev.paymentMethods, method]
    }))
  }

  const saveCountry = async () => {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('payment_countries')
        .update({
          name: editForm.name,
          enabled: editForm.enabled,
          paymentMethods: editForm.paymentMethods,
          updatedAt: new Date().toISOString()
        })
        .eq('id', editing)

      if (error) throw error

      await logSystemEvent('system_country', `Pays ${editForm.name} modifié`, {
        countryId: editing,
        changes: editForm
      }, null, user?.id)

      toast({
        title: 'Succès',
        description: 'Pays modifié avec succès',
      })
      
      closeEditModal()
      loadCountries()
    } catch (error) {
      console.error('Error saving country:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les modifications',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-solidarpay-text">Pays & Méthodes</h1>
          <p className="text-solidarpay-text/70 mt-1">Gérez les pays et méthodes de paiement disponibles</p>
        </div>
        <Button onClick={openAddModal} className="bg-solidarpay-primary hover:bg-solidarpay-secondary">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un pays
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pays disponibles</CardTitle>
          <CardDescription>
            Configurez les pays et méthodes de paiement pour chaque pays
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solidarpay-primary mx-auto"></div>
              <p className="mt-4 text-solidarpay-text/70">Chargement...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pays</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Méthodes de paiement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countries.map((country) => (
                  <TableRow key={country.id}>
                    <TableCell className="font-medium">{country.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{country.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(country.paymentMethods) && country.paymentMethods.map((method, idx) => (
                          <Badge key={idx} variant="secondary">{method}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={country.enabled ? 'default' : 'secondary'}>
                        {country.enabled ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={country.enabled}
                          onCheckedChange={() => toggleCountry(country.id, country.enabled)}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditModal(country)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal d'édition */}
      <Dialog open={!!editing} onOpenChange={closeEditModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le pays</DialogTitle>
            <DialogDescription>
              Modifiez les informations et méthodes de paiement pour ce pays
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Nom du pays</Label>
              <Input
                id="edit_name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Ex: France"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_code">Code pays</Label>
              <Input
                id="edit_code"
                value={editForm.code}
                onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                placeholder="Ex: FR"
                maxLength={2}
                disabled
              />
              <p className="text-xs text-solidarpay-text/50">Le code pays ne peut pas être modifié</p>
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editForm.enabled}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, enabled: checked })}
                />
                <span className="text-sm text-solidarpay-text/70">
                  {editForm.enabled ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Méthodes de paiement disponibles</Label>
              <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg">
                {PAYMENT_METHODS.map((method) => (
                  <div key={method} className="flex items-center space-x-2">
                    <Checkbox
                      id={`method_${method}`}
                      checked={editForm.paymentMethods.includes(method)}
                      onCheckedChange={() => togglePaymentMethod(method)}
                    />
                    <Label
                      htmlFor={`method_${method}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {method === 'interac' && 'Interac'}
                      {method === 'credit_card' && 'Carte de crédit'}
                      {method === 'bank_transfer' && 'Virement bancaire'}
                      {method === 'paypal' && 'PayPal'}
                      {method === 'mobile_money' && 'Mobile Money'}
                      {method === 'zelle' && 'Zelle'}
                      {method === 'cash_app' && 'Cash App'}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEditModal} disabled={saving}>
              Annuler
            </Button>
            <Button 
              onClick={saveCountry} 
              disabled={saving || !editForm.name}
              className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'ajout */}
      <Dialog open={showAddModal} onOpenChange={closeAddModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau pays</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau pays avec ses méthodes de paiement disponibles
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add_name">Nom du pays *</Label>
              <Input
                id="add_name"
                value={newCountryForm.name}
                onChange={(e) => setNewCountryForm({ ...newCountryForm, name: e.target.value })}
                placeholder="Ex: France, Canada, États-Unis"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add_code">Code pays ISO (2 lettres) *</Label>
              <Input
                id="add_code"
                value={newCountryForm.code}
                onChange={(e) => setNewCountryForm({ ...newCountryForm, code: e.target.value.toUpperCase().slice(0, 2) })}
                placeholder="Ex: FR, CA, US"
                maxLength={2}
                className="uppercase"
              />
              <p className="text-xs text-solidarpay-text/50">
                Code ISO 3166-1 alpha-2 (2 lettres majuscules)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={newCountryForm.enabled}
                  onCheckedChange={(checked) => setNewCountryForm({ ...newCountryForm, enabled: checked })}
                />
                <span className="text-sm text-solidarpay-text/70">
                  {newCountryForm.enabled ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Méthodes de paiement disponibles</Label>
              <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg">
                {PAYMENT_METHODS.map((method) => (
                  <div key={method} className="flex items-center space-x-2">
                    <Checkbox
                      id={`new_method_${method}`}
                      checked={newCountryForm.paymentMethods.includes(method)}
                      onCheckedChange={() => toggleNewPaymentMethod(method)}
                    />
                    <Label
                      htmlFor={`new_method_${method}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {method === 'interac' && 'Interac'}
                      {method === 'credit_card' && 'Carte de crédit'}
                      {method === 'bank_transfer' && 'Virement bancaire'}
                      {method === 'paypal' && 'PayPal'}
                      {method === 'mobile_money' && 'Mobile Money'}
                      {method === 'zelle' && 'Zelle'}
                      {method === 'cash_app' && 'Cash App'}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAddModal} disabled={saving}>
              Annuler
            </Button>
            <Button 
              onClick={addCountry} 
              disabled={saving || !newCountryForm.name || !newCountryForm.code}
              className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Ajout...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

