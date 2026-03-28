'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { logSystemSettingsChange } from '@/lib/system-logger'
import { jsonbScalarToString, stringToJsonbValue } from '@/lib/jsonb-platform'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'SolidarPay',
    contactEmail: 'contact@solidarpay.com',
    contactPhone: '',
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // Charger depuis platform_customization ou utiliser les valeurs par défaut
      const { data } = await supabase
        .from('platform_customization')
        .select('*')
        .in('key', ['site_name', 'contact_email', 'contact_phone'])

      if (data) {
        const settingsMap = {}
        data.forEach((item) => {
          if (item.key === 'site_name') settingsMap.siteName = jsonbScalarToString(item.value) || 'SolidarPay'
          if (item.key === 'contact_email') settingsMap.contactEmail = jsonbScalarToString(item.value) || ''
          if (item.key === 'contact_phone') settingsMap.contactPhone = jsonbScalarToString(item.value) || ''
        })
        setSettings((prev) => ({ ...prev, ...settingsMap }))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()

      // Sauvegarder les paramètres dans platform_customization
      const keyDescriptions = {
        site_name: 'Nom du site affiché sur la plateforme',
        contact_email: 'Email de contact affiché aux utilisateurs',
        contact_phone: 'Numéro de téléphone de contact affiché aux utilisateurs',
      }

      const updates = [
        { key: 'site_name', value: settings.siteName, updatedBy: user?.id },
        { key: 'contact_email', value: settings.contactEmail, updatedBy: user?.id },
        { key: 'contact_phone', value: settings.contactPhone?.trim() ?? '', updatedBy: user?.id },
      ]

      for (const update of updates) {
        const description = keyDescriptions[update.key]
        const { error } = await supabase
          .from('platform_customization')
          .upsert(
            {
              key: update.key,
              value: stringToJsonbValue(update.value),
              description,
              updatedBy: update.updatedBy,
              updatedAt: new Date().toISOString(),
            },
            { onConflict: 'key' }
          )

        if (error) throw error
      }

      await logSystemSettingsChange(
        'site_name / contact_email / contact_phone',
        null,
        {
          siteName: settings.siteName,
          contactEmail: settings.contactEmail,
          contactPhone: settings.contactPhone?.trim() ?? '',
        },
        user?.id
      )

      toast({
        title: 'Succès',
        description: 'Paramètres sauvegardés avec succès',
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-solidarpay-text">Paramètres</h1>
        <p className="text-solidarpay-text/70 mt-1">Paramètres de configuration système</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration générale
          </CardTitle>
          <CardDescription>Paramètres globaux de la plateforme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solidarpay-primary mx-auto"></div>
              <p className="mt-4 text-solidarpay-text/70">Chargement...</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="site_name">Nom du site</Label>
                <Input
                  id="site_name"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  placeholder="SolidarPay"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email de contact</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  placeholder="contact@solidarpay.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Numéro de téléphone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={settings.contactPhone}
                  onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

