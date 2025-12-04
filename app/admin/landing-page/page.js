'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { Save, Eye, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { systemLogger } from '@/lib/system-logger'

const SECTIONS = [
  { id: 'hero', name: 'Hero Section', icon: '🎯' },
  { id: 'what_is', name: 'Qu\'est-ce que SolidarPay ?', icon: '💡' },
  { id: 'features', name: 'Pourquoi SolidarPay ?', icon: '⭐' },
  { id: 'how_it_works', name: 'Comment ça marche ?', icon: '🔄' },
  { id: 'target_audience', name: 'Pour qui est SolidarPay ?', icon: '👥' },
  { id: 'testimonials', name: 'Témoignages', icon: '💬' },
  { id: 'cta', name: 'Call to Action', icon: '🚀' }
]

export default function LandingPageEditor() {
  const { toast } = useToast()
  const [sections, setSections] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedSections, setExpandedSections] = useState(new Set(['hero']))
  const [previewUrl, setPreviewUrl] = useState(null)

  const loadSections = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_content')
        .select('*')
        .order('display_order')

      if (error) throw error

      const sectionsMap = {}
      data?.forEach(section => {
        sectionsMap[section.section_name] = section
      })
      setSections(sectionsMap)
    } catch (error) {
      console.error('Error loading sections:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les sections',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadSections()
  }, [loadSections])

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const updateSection = (sectionId, field, value) => {
    setSections(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: value
      }
    }))
  }

  const saveSection = async (sectionId) => {
    const section = sections[sectionId]
    if (!section) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('landing_page_content')
        .upsert({
          section_name: sectionId,
          title: section.title || null,
          subtitle: section.subtitle || null,
          description: section.description || null,
          content: section.content || null,
          image_url: section.image_url || null,
          enabled: section.enabled !== undefined ? section.enabled : true,
          display_order: section.display_order || 0,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'section_name'
        })

      if (error) throw error

      await systemLogger.log('landing_page_updated', {
        section: sectionId,
        action: 'Section mise à jour'
      })

      toast({
        title: 'Sauvegardé !',
        description: `La section "${SECTIONS.find(s => s.id === sectionId)?.name}" a été mise à jour.`
      })

      await loadSections()
    } catch (error) {
      console.error('Error saving section:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de sauvegarder la section',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const openPreview = () => {
    const url = window.location.origin
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-solidarpay-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-solidarpay-bg p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-solidarpay-text">Gestion de la Page d'Accueil</h1>
            <p className="text-solidarpay-text/70 mt-2">
              Modifiez toutes les sections de votre page d'accueil en temps réel
            </p>
          </div>
          <Button onClick={openPreview} variant="outline" className="gap-2">
            <Eye className="w-4 h-4" />
            Aperçu
          </Button>
        </div>

        <div className="space-y-4">
          {SECTIONS.map((section) => {
            const sectionData = sections[section.id] || {
              section_name: section.id,
              enabled: true,
              display_order: SECTIONS.indexOf(section) + 1
            }
            const isExpanded = expandedSections.has(section.id)

            return (
              <Card key={section.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-solidarpay-bg/50 transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{section.icon}</span>
                      <CardTitle>{section.name}</CardTitle>
                      <Switch
                        checked={sectionData.enabled}
                        onCheckedChange={(checked) => {
                          updateSection(section.id, 'enabled', checked)
                          saveSection(section.id)
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSection(section.id)
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Titre principal</Label>
                        <Input
                          value={sectionData.title || ''}
                          onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                          placeholder="Titre de la section"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sous-titre</Label>
                        <Input
                          value={sectionData.subtitle || ''}
                          onChange={(e) => updateSection(section.id, 'subtitle', e.target.value)}
                          placeholder="Sous-titre (optionnel)"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={sectionData.description || ''}
                        onChange={(e) => updateSection(section.id, 'description', e.target.value)}
                        placeholder="Description de la section"
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>URL de l'image (optionnel)</Label>
                      <Input
                        value={sectionData.image_url || ''}
                        onChange={(e) => updateSection(section.id, 'image_url', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-solidarpay-text/70">
                        Ordre d'affichage: {sectionData.display_order || 0}
                      </div>
                      <Button
                        onClick={() => saveSection(section.id)}
                        disabled={saving}
                        className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sauvegarde...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Sauvegarder
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </div>
      <Toaster />
    </div>
  )
}

