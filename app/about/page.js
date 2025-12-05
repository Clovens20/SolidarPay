'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Loader2 } from 'lucide-react'
import { convertContentToHtml } from '@/lib/markdown-utils'

export default function AboutPage() {
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPage = async () => {
      try {
        // D'abord, chercher la page même si elle est désactivée pour voir si elle existe
        const { data, error } = await supabase
          .from('legal_pages')
          .select('*')
          .eq('page_slug', 'about')
          .single()

        if (error) {
          // Si l'erreur est "not found", la page n'existe pas encore
          if (error.code === 'PGRST116') {
            console.log('Page "about" non trouvée dans la base de données')
            setPage(null)
          } else {
            console.error('Erreur lors du chargement de la page:', error)
            throw error
          }
        } else if (data) {
          console.log('Page chargée:', {
            title: data.title,
            enabled: data.enabled,
            contentLength: data.content?.length || 0,
            contentPreview: data.content?.substring(0, 200) || 'vide',
            hasContent: !!(data.content && data.content.trim() && data.content.trim().length > 10)
          })
          // Afficher la page même si elle est désactivée
          setPage(data)
        } else {
          console.log('Aucune donnée retournée')
          setPage(null)
        }
      } catch (err) {
        console.error('Error loading about page:', err)
        // En cas d'erreur, ne pas afficher le message par défaut
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
                const rawContent = page.content || ''
                const trimmedContent = rawContent.trim()
                const hasContent = trimmedContent && trimmedContent.length > 10
                
                console.log('Rendering content:', {
                  hasContent,
                  length: trimmedContent.length,
                  preview: trimmedContent.substring(0, 100)
                })
                
                if (hasContent) {
                  const htmlContent = convertContentToHtml(trimmedContent)
                  console.log('Converted HTML length:', htmlContent.length)
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
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left max-w-2xl mx-auto">
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>État actuel :</strong>
                        </p>
                        <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
                          <li>Page trouvée : {page ? 'Oui' : 'Non'}</li>
                          <li>Contenu présent : {rawContent ? 'Oui' : 'Non'}</li>
                          <li>Longueur du contenu : {rawContent?.length || 0} caractères</li>
                          <li>Contenu après trim : {trimmedContent?.length || 0} caractères</li>
                          <li>Page activée : {page?.enabled ? 'Oui' : 'Non'}</li>
                        </ul>
                        {rawContent && (
                          <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                            <strong>Premiers caractères du contenu :</strong>
                            <pre className="mt-2 whitespace-pre-wrap break-words">{rawContent.substring(0, 200)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }
              })()}
            </>
          ) : (
            <div className="text-center">
              <h1 className="text-4xl font-bold text-solidarpay-text mb-4">À propos de SolidarPay</h1>
              <p className="text-xl text-solidarpay-text/70 mb-4">Contenu à compléter...</p>
              <p className="text-sm text-solidarpay-text/50">
                Cette page n'existe pas encore dans la base de données. 
                <br />
                Créez-la via l'interface d'administration (<code className="bg-gray-100 px-2 py-1 rounded">/admin/legal-pages</code>).
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

