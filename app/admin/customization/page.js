'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Palette, Save } from 'lucide-react'

export default function CustomizationPage() {
  const [customizations, setCustomizations] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCustomizations()
  }, [])

  const loadCustomizations = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_customization')
        .select('*')

      if (error) throw error

      const custom = {}
      data.forEach(item => {
        custom[item.key] = typeof item.value === 'object' ? JSON.stringify(item.value) : item.value
      })
      setCustomizations(custom)
    } catch (error) {
      console.error('Error loading customizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates = Object.entries(customizations).map(([key, value]) => ({
        key,
        value: typeof value === 'string' && (value.startsWith('{') || value.startsWith('[')) 
          ? JSON.parse(value) 
          : value
      }))

      for (const update of updates) {
        const { error } = await supabase
          .from('platform_customization')
          .upsert({
            key: update.key,
            value: update.value
          }, { onConflict: 'key' })

        if (error) throw error
      }

      alert('Personnalisation sauvegardée avec succès!')
    } catch (error) {
      console.error('Error saving customizations:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const updateValue = (key, value) => {
    setCustomizations(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-solidarpay-text">Personnalisation</h1>
          <p className="text-solidarpay-text/70 mt-1">Personnalisez l'apparence et les paramètres de la plateforme</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Couleurs
            </CardTitle>
            <CardDescription>Personnalisez les couleurs de la plateforme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Couleur principale</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={customizations.primary_color?.replace(/"/g, '') || '#0891B2'}
                  onChange={(e) => updateValue('primary_color', `"${e.target.value}"`)}
                  className="w-20 h-10"
                />
                <Input
                  value={customizations.primary_color?.replace(/"/g, '') || '#0891B2'}
                  onChange={(e) => updateValue('primary_color', `"${e.target.value}"`)}
                  placeholder="#0891B2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_color">Couleur secondaire</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={customizations.secondary_color?.replace(/"/g, '') || '#0E7490'}
                  onChange={(e) => updateValue('secondary_color', `"${e.target.value}"`)}
                  className="w-20 h-10"
                />
                <Input
                  value={customizations.secondary_color?.replace(/"/g, '') || '#0E7490'}
                  onChange={(e) => updateValue('secondary_color', `"${e.target.value}"`)}
                  placeholder="#0E7490"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>Uploader un logo pour la plateforme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo_url">URL du logo</Label>
              <Input
                id="logo_url"
                type="url"
                value={customizations.logo_url?.replace(/"/g, '') || ''}
                onChange={(e) => updateValue('logo_url', `"${e.target.value}"`)}
                placeholder="https://example.com/logo.png"
              />
            </div>
            {customizations.logo_url && (
              <div className="border rounded-lg p-4 flex items-center justify-center">
                <img 
                  src={customizations.logo_url.replace(/"/g, '')} 
                  alt="Logo preview" 
                  className="max-h-24"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

