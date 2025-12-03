'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PiggyBank, Users, TrendingUp, Plus, ArrowRight } from 'lucide-react'

export default function AdminTontineDashboard() {
  const [user, setUser] = useState(null)
  const [tontines, setTontines] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setUser(userData)

      // Load tontines where user is admin
      const { data: tontinesData, error } = await supabase
        .from('tontines')
        .select(`
          *,
          members:tontine_members(count)
        `)
        .eq('adminId', session.user.id)
        .order('createdAt', { ascending: false })

      if (error) throw error

      // Get member counts
      const tontinesWithCounts = await Promise.all(
        (tontinesData || []).map(async (tontine) => {
          const { count } = await supabase
            .from('tontine_members')
            .select('*', { count: 'exact', head: true })
            .eq('tontineId', tontine.id)

          return {
            ...tontine,
            memberCount: count || 0
          }
        })
      )

      setTontines(tontinesWithCounts)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      active: { variant: 'default', label: 'Active', color: 'bg-green-100 text-green-800' },
      suspended: { variant: 'secondary', label: 'Suspendue', color: 'bg-yellow-100 text-yellow-800' },
      completed: { variant: 'secondary', label: 'Terminée', color: 'bg-gray-100 text-gray-800' }
    }
    const config = variants[status] || variants.active
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-solidarpay-text">Mes Tontines</h1>
          <p className="text-solidarpay-text/70 mt-1">Gérez vos tontines et leurs membres</p>
        </div>
        <Button 
          onClick={() => router.push('/admin-tontine/new')}
          className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Créer une tontine
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tontines</CardTitle>
            <PiggyBank className="w-4 h-4 text-solidarpay-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tontines.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Membres</CardTitle>
            <Users className="w-4 h-4 text-solidarpay-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tontines.reduce((sum, t) => sum + (t.memberCount || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tontines Actives</CardTitle>
            <TrendingUp className="w-4 h-4 text-solidarpay-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tontines.filter(t => t.status === 'active').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tontines List */}
      {tontines.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PiggyBank className="w-16 h-16 text-solidarpay-text/30 mb-4" />
            <h3 className="text-lg font-semibold text-solidarpay-text mb-2">
              Aucune tontine
            </h3>
            <p className="text-sm text-solidarpay-text/70 mb-4">
              Créez votre première tontine pour commencer
            </p>
            <Button 
              onClick={() => router.push('/admin-tontine/new')}
              className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer une tontine
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tontines.map((tontine) => (
            <Card 
              key={tontine.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/admin-tontine/tontine/${tontine.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{tontine.name}</CardTitle>
                  {getStatusBadge(tontine.status)}
                </div>
                <CardDescription>
                  Créée le {new Date(tontine.createdAt).toLocaleDateString('fr-FR')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-solidarpay-text/70">Cotisation:</span>
                    <span className="font-semibold">${parseFloat(tontine.contributionAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-solidarpay-text/70">Fréquence:</span>
                    <span className="font-semibold">
                      {tontine.frequency === 'monthly' ? 'Mensuelle' : 
                       tontine.frequency === 'biweekly' ? 'Bi-hebdomadaire' : 
                       'Hebdomadaire'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-solidarpay-text/70">Membres:</span>
                    <span className="font-semibold">{tontine.memberCount || 0}</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/admin-tontine/tontine/${tontine.id}`)
                  }}
                >
                  Gérer
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

