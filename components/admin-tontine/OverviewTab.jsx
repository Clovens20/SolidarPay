'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/currency-utils'
import { Users, DollarSign, Calendar, TrendingUp } from 'lucide-react'

export default function OverviewTab({ tontine }) {
  const [stats, setStats] = useState({
    memberCount: 0,
    totalCollected: 0,
    activeCycles: 0,
    completedCycles: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [tontine.id])

  const loadStats = async () => {
    try {
      // Member count
      const { count: memberCount } = await supabase
        .from('tontine_members')
        .select('*', { count: 'exact', head: true })
        .eq('tontineId', tontine.id)

      // Active cycles
      const { data: activeCycles } = await supabase
        .from('cycles')
        .select('totalCollected')
        .eq('tontineId', tontine.id)
        .eq('status', 'active')

      // Completed cycles
      const { count: completedCycles } = await supabase
        .from('cycles')
        .select('*', { count: 'exact', head: true })
        .eq('tontineId', tontine.id)
        .eq('status', 'completed')

      const totalCollected = (activeCycles || []).reduce((sum, cycle) => 
        sum + parseFloat(cycle.totalCollected || 0), 0
      )

      setStats({
        memberCount: memberCount || 0,
        totalCollected,
        activeCycles: activeCycles?.length || 0,
        completedCycles: completedCycles || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membres</CardTitle>
            <Users className="w-4 h-4 text-solidarpay-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.memberCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cotisation</CardTitle>
            <DollarSign className="w-4 h-4 text-solidarpay-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(tontine.contributionAmount, tontine.currency || 'CAD')}
            </div>
            <p className="text-xs text-muted-foreground">
              {tontine.frequency === 'monthly' ? 'Par mois' : 
               tontine.frequency === 'biweekly' ? 'Bi-hebdomadaire' : 
               'Par semaine'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total collecté</CardTitle>
            <TrendingUp className="w-4 h-4 text-solidarpay-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalCollected, tontine.currency || 'CAD')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cycles</CardTitle>
            <Calendar className="w-4 h-4 text-solidarpay-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCycles}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedCycles} terminé(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tontine Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de la tontine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-solidarpay-text/70">Nom</p>
              <p className="font-medium">{tontine.name}</p>
            </div>
            <div>
              <p className="text-sm text-solidarpay-text/70">Statut</p>
              <Badge variant={tontine.status === 'active' ? 'default' : 'secondary'}>
                {tontine.status === 'active' ? 'Active' : tontine.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-solidarpay-text/70">Fréquence</p>
              <p className="font-medium">
                {tontine.frequency === 'monthly' ? 'Mensuelle' : 
                 tontine.frequency === 'biweekly' ? 'Bi-hebdomadaire' : 
                 'Hebdomadaire'}
              </p>
            </div>
            <div>
              <p className="text-sm text-solidarpay-text/70">Email KOHO</p>
              <p className="font-medium">{tontine.kohoReceiverEmail}</p>
            </div>
            <div>
              <p className="text-sm text-solidarpay-text/70">Créée le</p>
              <p className="font-medium">
                {new Date(tontine.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

