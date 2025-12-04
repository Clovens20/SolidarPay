'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { Loader2 } from 'lucide-react'

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
          .eq('enabled', true)
          .single()

        if (error) throw error
        setPage(data)
      } catch (err) {
        console.error('Error loading terms page:', err)
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
              <h1 className="text-4xl font-bold text-solidarpay-text mb-6">{page.title}</h1>
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
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

