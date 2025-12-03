'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

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
        phone: data.phone || ''
      })
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { error } = await supabase
        .from('users')
        .update({
          fullName: formData.fullName,
          phone: formData.phone
        })
        .eq('id', session.user.id)

      if (error) throw error

      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été sauvegardées'
      })

      loadProfile()
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le profil',
        variant: 'destructive'
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
        onClick={() => router.push('/admin-tontine')}
        className="text-sm text-solidarpay-text/70 hover:text-solidarpay-text flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <div>
        <h1 className="text-3xl font-bold text-solidarpay-text">Mon profil</h1>
        <p className="text-solidarpay-text/70 mt-1">Gérez vos informations personnelles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informations personnelles
          </CardTitle>
          <CardDescription>Modifiez vos informations de profil</CardDescription>
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-solidarpay-text/70">
              L'email ne peut pas être modifié
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

