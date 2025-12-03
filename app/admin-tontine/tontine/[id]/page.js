'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import OverviewTab from '@/components/admin-tontine/OverviewTab'
import MembersTab from '@/components/admin-tontine/MembersTab'
import CyclesTab from '@/components/admin-tontine/CyclesTab'
import SettingsTab from '@/components/admin-tontine/SettingsTab'

export default function ManageTontinePage() {
  const params = useParams()
  const router = useRouter()
  const [tontine, setTontine] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadTontine()
    }
  }, [params.id])

  const loadTontine = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('tontines')
        .select('*')
        .eq('id', params.id)
        .eq('adminId', session.user.id)
        .single()

      if (error) throw error
      if (!data) {
        router.push('/admin-tontine')
        return
      }

      setTontine(data)
    } catch (error) {
      console.error('Error loading tontine:', error)
      router.push('/admin-tontine')
    } finally {
      setLoading(false)
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

  if (!tontine) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.push('/admin-tontine')}
          className="text-sm text-solidarpay-text/70 hover:text-solidarpay-text mb-4"
        >
          ← Retour à mes tontines
        </button>
        <h1 className="text-3xl font-bold text-solidarpay-text">{tontine.name}</h1>
        <p className="text-solidarpay-text/70 mt-1">Gérez votre tontine</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="members">Membres</TabsTrigger>
          <TabsTrigger value="cycles">Cycles</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab tontine={tontine} />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <MembersTab tontineId={tontine.id} tontineName={tontine.name} />
        </TabsContent>

        <TabsContent value="cycles" className="mt-6">
          <CyclesTab tontineId={tontine.id} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SettingsTab tontine={tontine} onUpdate={loadTontine} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

