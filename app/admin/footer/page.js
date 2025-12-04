'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { Save, Eye, Loader2, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { systemLogger } from '@/lib/system-logger'

const FOOTER_SECTIONS = [
  { id: 'brand', name: 'Marque', icon: '🏷️' },
  { id: 'navigation', name: 'Navigation', icon: '🧭' },
  { id: 'legal', name: 'Légal', icon: '⚖️' },
  { id: 'contact', name: 'Contact', icon: '📧' },
  { id: 'social', name: 'Réseaux sociaux', icon: '📱' }
]

export default function FooterEditor() {
  const { toast } = useToast()
  const [sections, setSections] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedSections, setExpandedSections] = useState(new Set(['brand']))

  const loadSections = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('footer_content')
        .select('*')
        .order('display_order')

      if (error) {
        // Si la table n'existe pas, initialiser avec des sections vides
        if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
          console.warn('Table footer_content n\'existe pas encore. Utilisez le script SQL pour la créer.')
          setSections({})
          return
        }
        throw error
      }

      const sectionsMap = {}
      data?.forEach(section => {
        sectionsMap[section.section_name] = section
      })
      setSections(sectionsMap)
    } catch (error) {
      console.error('Error loading footer sections:', error)
      toast({
        title: 'Erreur',
        description: error.code === 'PGRST205' 
          ? 'La table n\'existe pas encore. Exécutez le script SQL fourni.'
          : 'Impossible de charger les sections du footer',
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

  const updateSectionContent = (sectionId, path, value) => {
    setSections(prev => {
      const section = prev[sectionId] || { section_name: sectionId, content: {} }
      const content = typeof section.content === 'string' 
        ? JSON.parse(section.content || '{}') 
        : (section.content || {})
      
      const keys = path.split('.')
      let current = content
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {}
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value

      return {
        ...prev,
        [sectionId]: {
          ...section,
          content
        }
      }
    })
  }

  const saveSection = async (sectionId) => {
    const section = sections[sectionId]
    if (!section) return

    setSaving(true)
    try {
      const contentToSave = typeof section.content === 'string' 
        ? section.content 
        : JSON.stringify(section.content || {})

      const { error } = await supabase
        .from('footer_content')
        .upsert({
          section_name: sectionId,
          title: section.title || null,
          content: contentToSave,
          enabled: section.enabled !== undefined ? section.enabled : true,
          display_order: section.display_order || 0,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'section_name'
        })

      if (error) throw error

      await systemLogger.log('footer_updated', {
        section: sectionId,
        action: 'Section footer mise à jour'
      })

      toast({
        title: 'Sauvegardé !',
        description: `La section "${FOOTER_SECTIONS.find(s => s.id === sectionId)?.name}" a été mise à jour.`
      })

      await loadSections()
    } catch (error) {
      console.error('Error saving footer section:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de sauvegarder la section',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteSection = async (sectionId) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la section "${FOOTER_SECTIONS.find(s => s.id === sectionId)?.name}" ?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('footer_content')
        .delete()
        .eq('section_name', sectionId)

      if (error) throw error

      await systemLogger.log('footer_section_deleted', {
        section: sectionId
      })

      toast({
        title: 'Supprimé !',
        description: 'La section a été supprimée.'
      })

      await loadSections()
    } catch (error) {
      console.error('Error deleting section:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer la section',
        variant: 'destructive'
      })
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

  const renderSectionEditor = (sectionId) => {
    const section = sections[sectionId] || { section_name: sectionId, content: {} }
    const content = typeof section.content === 'string' 
      ? JSON.parse(section.content || '{}') 
      : (section.content || {})

    switch (sectionId) {
      case 'brand':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Description de la marque</Label>
              <Textarea
                value={content.description || ''}
                onChange={(e) => updateSectionContent(sectionId, 'description', e.target.value)}
                placeholder="Description de SolidarPay"
                rows={3}
              />
            </div>
          </div>
        )

      case 'navigation':
        return (
          <div className="space-y-4">
            <Label>Liens de navigation</Label>
            {(content.links || []).map((link, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Label du lien"
                    value={link.label || ''}
                    onChange={(e) => {
                      const newLinks = [...(content.links || [])]
                      newLinks[index] = { ...newLinks[index], label: e.target.value }
                      updateSectionContent(sectionId, 'links', newLinks)
                    }}
                  />
                  <Input
                    placeholder="URL (ex: /about)"
                    value={link.href || ''}
                    onChange={(e) => {
                      const newLinks = [...(content.links || [])]
                      newLinks[index] = { ...newLinks[index], href: e.target.value }
                      updateSectionContent(sectionId, 'links', newLinks)
                    }}
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const newLinks = (content.links || []).filter((_, i) => i !== index)
                    updateSectionContent(sectionId, 'links', newLinks)
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newLinks = [...(content.links || []), { label: '', href: '' }]
                updateSectionContent(sectionId, 'links', newLinks)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un lien
            </Button>
          </div>
        )

      case 'legal':
        return (
          <div className="space-y-4">
            <Label>Liens légaux</Label>
            {(content.links || []).map((link, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Label du lien"
                    value={link.label || ''}
                    onChange={(e) => {
                      const newLinks = [...(content.links || [])]
                      newLinks[index] = { ...newLinks[index], label: e.target.value }
                      updateSectionContent(sectionId, 'links', newLinks)
                    }}
                  />
                  <Input
                    placeholder="URL (ex: /terms)"
                    value={link.href || ''}
                    onChange={(e) => {
                      const newLinks = [...(content.links || [])]
                      newLinks[index] = { ...newLinks[index], href: e.target.value }
                      updateSectionContent(sectionId, 'links', newLinks)
                    }}
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const newLinks = (content.links || []).filter((_, i) => i !== index)
                    updateSectionContent(sectionId, 'links', newLinks)
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newLinks = [...(content.links || []), { label: '', href: '' }]
                updateSectionContent(sectionId, 'links', newLinks)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un lien
            </Button>
          </div>
        )

      case 'contact':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email de contact</Label>
              <Input
                value={content.email || ''}
                onChange={(e) => updateSectionContent(sectionId, 'email', e.target.value)}
                placeholder="support@solidarpay.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={content.phone || ''}
                onChange={(e) => updateSectionContent(sectionId, 'phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        )

      case 'social':
        return (
          <div className="space-y-4">
            <Label>Réseaux sociaux</Label>
            {(content.links || []).map((link, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Plateforme (facebook, twitter, etc.)"
                    value={link.platform || ''}
                    onChange={(e) => {
                      const newLinks = [...(content.links || [])]
                      newLinks[index] = { ...newLinks[index], platform: e.target.value }
                      updateSectionContent(sectionId, 'links', newLinks)
                    }}
                  />
                  <Input
                    placeholder="URL"
                    value={link.url || ''}
                    onChange={(e) => {
                      const newLinks = [...(content.links || [])]
                      newLinks[index] = { ...newLinks[index], url: e.target.value }
                      updateSectionContent(sectionId, 'links', newLinks)
                    }}
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const newLinks = (content.links || []).filter((_, i) => i !== index)
                    updateSectionContent(sectionId, 'links', newLinks)
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newLinks = [...(content.links || []), { platform: '', url: '' }]
                updateSectionContent(sectionId, 'links', newLinks)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un réseau social
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-solidarpay-bg p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-solidarpay-text">Gestion du Footer</h1>
            <p className="text-solidarpay-text/70 mt-2">
              Modifiez, ajoutez ou supprimez les sections du footer en temps réel
            </p>
          </div>
          <Button onClick={openPreview} variant="outline" className="gap-2">
            <Eye className="w-4 h-4" />
            Aperçu
          </Button>
        </div>

        <div className="space-y-4">
          {FOOTER_SECTIONS.map((section) => {
            const sectionData = sections[section.id] || {
              section_name: section.id,
              enabled: true,
              display_order: FOOTER_SECTIONS.indexOf(section) + 1,
              content: {}
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
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSection(section.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
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
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4 pt-0">
                    {renderSectionEditor(section.id)}

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

