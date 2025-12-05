'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Loader2 } from 'lucide-react'
import { convertContentToHtml } from '@/lib/markdown-utils'

export default function TermsPage() {
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPage = async () => {
      try {
        const { data, error } = await supabase
          .from('legal_pages')
          .select('*')
          .eq('page_slug', 'terms')
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            console.log('Page "terms" non trouvée dans la base de données')
            setPage(null)
          } else {
            console.error('Erreur lors du chargement de la page:', error)
            throw error
          }
        } else if (data) {
          console.log('Page CGU chargée:', {
            title: data.title,
            enabled: data.enabled,
            contentLength: data.content?.length || 0
          })
          setPage(data)
        } else {
          setPage(null)
        }
      } catch (err) {
        console.error('Error loading terms page:', err)
        setPage(null)
      } finally {
        setLoading(false)
      }
    }

    loadPage()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-solidarpay-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {page ? (
            <>
              {!page.enabled && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Cette page est actuellement désactivée. Activez-la dans l'interface d'administration pour qu'elle soit visible publiquement.
                    </p>
                </div>
              )}
              <h1 className="text-4xl font-bold text-solidarpay-text mb-6">{page.title}</h1>
              {(() => {
                const content = page.content?.trim() || ''
                const hasContent = content && content.length > 10
                
                if (hasContent) {
                  const htmlContent = convertContentToHtml(content)
                  return (
                    <div
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                  )
                } else {
                  return (
                    <div className="text-center py-8">
                      <p className="text-xl text-solidarpay-text/70 mb-4">Contenu à compléter...</p>
                      <p className="text-sm text-solidarpay-text/50">
                        Allez dans <code className="bg-gray-100 px-2 py-1 rounded">/admin/legal-pages</code> pour ajouter le contenu.
                      </p>
                    </div>
                  )
                }
              })()}
            </>
          ) : (
            <div className="text-center">
              <h1 className="text-4xl font-bold text-solidarpay-text mb-4">Conditions Générales d'Utilisation</h1>
              <p className="text-xl text-solidarpay-text/70">Contenu à compléter...</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

