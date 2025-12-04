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
import { Save, Eye, Loader2, Plus, Trash2, FileText, ExternalLink } from 'lucide-react'
import { systemLogger } from '@/lib/system-logger'

const LEGAL_PAGES = [
  { slug: 'about', name: 'À propos', description: 'Page À propos de SolidarPay' },
  { slug: 'contact', name: 'Contact', description: 'Page de contact' },
  { slug: 'terms', name: 'CGU', description: 'Conditions Générales d\'Utilisation' },
  { slug: 'privacy', name: 'Confidentialité', description: 'Politique de Confidentialité' }
]

export default function LegalPagesEditor() {
  const { toast } = useToast()
  const [pages, setPages] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('about')

  const loadPages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('legal_pages')
        .select('*')
        .eq('enabled', true)

      if (error) throw error

      const pagesMap = {}
      data?.forEach(page => {
        pagesMap[page.page_slug] = page
      })
      setPages(pagesMap)

      // Si aucune page active, définir la première
      if (data && data.length > 0 && !activeTab) {
        setActiveTab(data[0].page_slug)
      }
    } catch (error) {
      console.error('Error loading legal pages:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les pages légales',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast, activeTab])

  useEffect(() => {
    loadPages()
  }, [loadPages])

  const updatePage = (slug, field, value) => {
    setPages(prev => ({
      ...prev,
      [slug]: {
        ...prev[slug] || { page_slug: slug, enabled: true },
        [field]: value
      }
    }))
  }

  const savePage = async (slug) => {
    const page = pages[slug]
    if (!page) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('legal_pages')
        .upsert({
          page_slug: slug,
          title: page.title || LEGAL_PAGES.find(p => p.slug === slug)?.name || 'Page',
          content: page.content || '',
          meta_description: page.meta_description || null,
          enabled: page.enabled !== undefined ? page.enabled : true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'page_slug'
        })

      if (error) throw error

      await systemLogger.log('legal_page_updated', {
        page: slug,
        action: 'Page légale mise à jour'
      })

      toast({
        title: 'Sauvegardé !',
        description: `La page "${LEGAL_PAGES.find(p => p.slug === slug)?.name}" a été mise à jour.`
      })

      await loadPages()
    } catch (error) {
      console.error('Error saving legal page:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de sauvegarder la page',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const deletePage = async (slug) => {
    const pageName = LEGAL_PAGES.find(p => p.slug === slug)?.name || slug
    if (!confirm(`Êtes-vous sûr de vouloir désactiver la page "${pageName}" ?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('legal_pages')
        .update({ enabled: false })
        .eq('page_slug', slug)

      if (error) throw error

      await systemLogger.log('legal_page_deleted', {
        page: slug
      })

      toast({
        title: 'Désactivée !',
        description: 'La page a été désactivée.'
      })

      await loadPages()
    } catch (error) {
      console.error('Error deleting page:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de désactiver la page',
        variant: 'destructive'
      })
    }
  }

  const openPreview = (slug) => {
    const url = `${window.location.origin}/${slug}`
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-solidarpay-text">Gestion des Pages Légales</h1>
          <p className="text-solidarpay-text/70 mt-2">
            Créez et modifiez les pages légales de votre site (CGU, Confidentialité, À propos, Contact)
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            {LEGAL_PAGES.map((page) => {
              const pageData = pages[page.slug]
              return (
                <TabsTrigger key={page.slug} value={page.slug} className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {page.name}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {LEGAL_PAGES.map((page) => {
            const pageData = pages[page.slug] || {
              page_slug: page.slug,
              title: page.name,
              content: '',
              meta_description: '',
              enabled: true
            }

            return (
              <TabsContent key={page.slug} value={page.slug}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{page.name}</CardTitle>
                        <CardDescription>{page.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={pageData.enabled}
                          onCheckedChange={(checked) => {
                            updatePage(page.slug, 'enabled', checked)
                            savePage(page.slug)
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPreview(page.slug)}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Aperçu
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPreview(page.slug)}
                          className="gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Voir la page
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Titre de la page</Label>
                        <Input
                          value={pageData.title || ''}
                          onChange={(e) => updatePage(page.slug, 'title', e.target.value)}
                          placeholder={page.name}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Meta description (SEO)</Label>
                        <Input
                          value={pageData.meta_description || ''}
                          onChange={(e) => updatePage(page.slug, 'meta_description', e.target.value)}
                          placeholder="Description pour les moteurs de recherche"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Contenu de la page (HTML ou Markdown)</Label>
                      <Textarea
                        value={pageData.content || ''}
                        onChange={(e) => updatePage(page.slug, 'content', e.target.value)}
                        placeholder={`Contenu de la page ${page.name.toLowerCase()}...`}
                        rows={20}
                        className="font-mono text-sm resize-none"
                      />
                      <p className="text-xs text-solidarpay-text/50">
                        Vous pouvez utiliser du HTML ou du Markdown. Le contenu sera rendu directement.
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-solidarpay-text/70">
                        URL: <code className="bg-solidarpay-bg px-2 py-1 rounded">/{page.slug}</code>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => deletePage(page.slug)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Désactiver
                        </Button>
                        <Button
                          onClick={() => savePage(page.slug)}
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
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
      <Toaster />
    </div>
  )
}

