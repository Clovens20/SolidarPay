'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Loader2 } from 'lucide-react'

const LEGAL_SLUGS = ['about', 'contact', 'terms', 'privacy']

export default function LegalPage() {
  const params = useParams()
  const slug = params?.slug
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug || !LEGAL_SLUGS.includes(slug)) {
      setError('Page introuvable')
      setLoading(false)
      return
    }

    const loadPage = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('legal_pages')
          .select('*')
          .eq('page_slug', slug)
          .eq('enabled', true)
          .single()

        if (fetchError) throw fetchError

        if (!data) {
          setError('Page introuvable')
          return
        }

        setPage(data)
      } catch (err) {
        console.error('Error loading legal page:', err)
        setError('Erreur lors du chargement de la page')
      } finally {
        setLoading(false)
      }
    }

    loadPage()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-solidarpay-primary" />
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-solidarpay-text mb-2">Page introuvable</h1>
          <p className="text-solidarpay-text/70">{error || 'Cette page n\'existe pas ou a été désactivée.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h1 className="text-4xl font-bold text-solidarpay-text mb-6">{page.title}</h1>
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}

