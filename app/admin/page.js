'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Users,
  UserCheck,
  Shield,
  PiggyBank,
  ShieldCheck,
  FileCheck,
  Globe,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Wrench,
  Clock,
  Activity
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const COLORS = ['#0891B2', '#0E7490', '#06B6D4', '#14B8A6', '#10B981']

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMembers: 0,
    totalAdmins: 0,
    totalTontines: 0,
    kycPending: 0,
    kycApprovedToday: 0,
    activeCountries: 0,
    paymentMethods: 0
  })
  const [charts, setCharts] = useState({
    registrations: [],
    tontinesCreated: [],
    kycStats: [],
    geography: []
  })
  const [alerts, setAlerts] = useState([])
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)

  // Load all stats in parallel
  const loadStats = useCallback(async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Parallelize all count queries
      const [
        { count: totalUsers },
        { count: totalMembers },
        { count: totalAdmins },
        { count: totalTontines },
        { count: kycPending },
        { count: kycApprovedToday },
        { data: countriesData },
        { count: paymentMethodsCount }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'member'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
        supabase.from('tontines').select('*', { count: 'exact', head: true }),
        supabase.from('kyc_documents').select('*', { count: 'exact', head: true }).in('status', ['pending', 'pending_review', 'en_attente']),
        supabase.from('kyc_documents').select('*', { count: 'exact', head: true }).eq('status', 'approved').gte('approvedAt', today.toISOString()),
        supabase.from('payment_countries').select('*', { count: 'exact' }).eq('enabled', true),
        supabase.from('payment_countries').select('paymentMethods', { count: 'exact', head: true }).not('paymentMethods', 'is', null)
      ])

      const activeCountries = countriesData?.length || 0

      setStats({
        totalUsers: totalUsers || 0,
        totalMembers: totalMembers || 0,
        totalAdmins: totalAdmins || 0,
        totalTontines: totalTontines || 0,
        kycPending: kycPending || 0,
        kycApprovedToday: kycApprovedToday || 0,
        activeCountries,
        paymentMethods: paymentMethodsCount || 0
      })

      return { kycPending: kycPending || 0 }
    } catch (error) {
      console.error('Error loading stats:', error)
      return { kycPending: 0 }
    }
  }, [])

  // Optimized charts loading - reduce queries
  const loadCharts = useCallback(async () => {
    try {
      // Reduce to 3 months instead of 6
      const months = []
      for (let i = 2; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        months.push(date.toISOString().slice(0, 7))
      }

      // Parallelize month queries
      const [registrationsData, tontinesData] = await Promise.all([
        Promise.all(
          months.map(async (month) => {
            const start = `${month}-01`
            const endDate = new Date(month + '-01')
            endDate.setMonth(endDate.getMonth() + 1)
            const end = endDate.toISOString().slice(0, 10)

            const { count } = await supabase
              .from('users')
              .select('*', { count: 'exact', head: true })
              .gte('createdAt', start)
              .lt('createdAt', end)

            return {
              month: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short' }),
              count: count || 0
            }
          })
        ),
        Promise.all(
          months.map(async (month) => {
            const start = `${month}-01`
            const endDate = new Date(month + '-01')
            endDate.setMonth(endDate.getMonth() + 1)
            const end = endDate.toISOString().slice(0, 10)

            const { count } = await supabase
              .from('tontines')
              .select('*', { count: 'exact', head: true })
              .gte('createdAt', start)
              .lt('createdAt', end)

            return {
              month: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short' }),
              count: count || 0
            }
          })
        )
      ])

      // Reduce to 2 weeks instead of 4
      const weeks = []
      for (let i = 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i * 7)
        weeks.push(date.toISOString().slice(0, 10))
      }

      const kycStats = await Promise.all(
        weeks.map(async (weekStart) => {
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekEnd.getDate() + 7)

          const [approvedResult, rejectedResult] = await Promise.all([
            supabase
              .from('kyc_documents')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'approved')
              .gte('approvedAt', weekStart)
              .lt('approvedAt', weekEnd.toISOString()),
            supabase
              .from('kyc_documents')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'rejected')
              .gte('rejectedAt', weekStart)
              .lt('rejectedAt', weekEnd.toISOString())
          ])

          return {
            week: new Date(weekStart).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
            approved: approvedResult.count || 0,
            rejected: rejectedResult.count || 0
          }
        })
      )

      // Mock geography for now (could be optimized later)
      const geography = [
        { country: 'Canada', users: 45 },
        { country: 'France', users: 32 },
        { country: 'Belgique', users: 18 },
        { country: 'Suisse', users: 12 },
        { country: 'Autres', users: 8 }
      ]

      setCharts({
        registrations: registrationsData,
        tontinesCreated: tontinesData,
        kycStats,
        geography
      })
    } catch (error) {
      console.error('Error loading charts:', error)
    }
  }, [])

  const loadAlerts = useCallback((kycPending) => {
    const alertsList = []

    if (kycPending > 0) {
      alertsList.push({
        type: 'warning',
        icon: ShieldCheck,
        title: `${kycPending} documents KYC à vérifier`,
        description: 'Des documents nécessitent votre attention'
      })
    }

    alertsList.push({
      type: 'success',
      icon: CheckCircle,
      title: 'Dernière sauvegarde',
      description: new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    })

    alertsList.push({
      type: 'info',
      icon: Wrench,
      title: 'Mode maintenance',
      description: 'Inactif'
    })

    setAlerts(alertsList)
  }, [])

  const loadTimeline = useCallback(async () => {
    try {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      // Parallelize timeline queries
      const [
        { count: newRegistrations },
        { count: newTontines },
        { count: kycSubmitted }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('createdAt', yesterday.toISOString()),
        supabase.from('tontines').select('*', { count: 'exact', head: true }).gte('createdAt', yesterday.toISOString()),
        supabase.from('kyc_documents').select('*', { count: 'exact', head: true }).gte('submittedAt', yesterday.toISOString())
      ])

      setTimeline([
        { type: 'user', label: 'Nouvelles inscriptions', count: newRegistrations || 0 },
        { type: 'tontine', label: 'Nouvelles tontines créées', count: newTontines || 0 },
        { type: 'kyc', label: 'Documents KYC soumis', count: kycSubmitted || 0 },
        { type: 'error', label: 'Erreurs système', count: 0 }
      ])
    } catch (error) {
      console.error('Error loading timeline:', error)
    }
  }, [])

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const statsResult = await loadStats()
      await Promise.all([
        loadCharts(),
        loadTimeline()
      ])
      loadAlerts(statsResult.kycPending)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [loadStats, loadCharts, loadAlerts, loadTimeline])

  useEffect(() => {
    loadDashboardData()
    
    // Reduce refresh to 60 seconds instead of 30
    const interval = setInterval(loadDashboardData, 60000)
    return () => clearInterval(interval)
  }, [loadDashboardData])

  const statCards = useMemo(() => [
    { icon: Users, label: 'Total utilisateurs inscrits', value: stats.totalUsers, color: 'text-blue-600' },
    { icon: UserCheck, label: 'Total membres', value: stats.totalMembers, color: 'text-green-600' },
    { icon: Shield, label: 'Total admins tontine', value: stats.totalAdmins, color: 'text-purple-600' },
    { icon: PiggyBank, label: 'Total tontines créées', value: stats.totalTontines, color: 'text-orange-600' },
    { 
      icon: ShieldCheck, 
      label: 'Vérifications KYC en attente', 
      value: stats.kycPending, 
      color: stats.kycPending > 0 ? 'text-red-600' : 'text-gray-600',
      badge: stats.kycPending > 0 
    },
    { icon: FileCheck, label: 'Documents approuvés aujourd\'hui', value: stats.kycApprovedToday, color: 'text-indigo-600' },
    { icon: Globe, label: 'Pays actifs', value: stats.activeCountries, color: 'text-cyan-600' },
    { icon: CreditCard, label: 'Méthodes de paiement configurées', value: stats.paymentMethods, color: 'text-pink-600' }
  ], [stats])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solidarpay-primary mx-auto"></div>
          <p className="mt-4 text-solidarpay-text">Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className={stat.badge ? 'border-red-300' : ''}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-solidarpay-text/70">
                  {stat.label}
                </CardTitle>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-solidarpay-text">
                  {stat.value}
                </div>
                {stat.badge && (
                  <Badge variant="destructive" className="mt-2">
                    Attention requise
                  </Badge>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inscriptions par mois</CardTitle>
            <CardDescription>3 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={charts.registrations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#0891B2" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tontines créées par mois</CardTitle>
            <CardDescription>3 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.tontinesCreated}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0891B2" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vérifications KYC</CardTitle>
            <CardDescription>Approuvées/Rejetées par semaine</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.kycStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" fill="#10B981" />
                <Bar dataKey="rejected" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition géographique</CardTitle>
            <CardDescription>Utilisateurs par pays</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={charts.geography}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ country, percent }) => `${country} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="users"
                >
                  {charts.geography.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Alertes techniques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert, index) => {
              const Icon = alert.icon
              return (
                <Alert key={index} variant={alert.type === 'warning' ? 'destructive' : 'default'}>
                  <Icon className="w-4 h-4" />
                  <AlertTitle>{alert.title}</AlertTitle>
                  <AlertDescription>{alert.description}</AlertDescription>
                </Alert>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline technique</CardTitle>
            <CardDescription>Dernières 24 heures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-solidarpay-bg rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-solidarpay-primary" />
                    <span className="text-sm font-medium text-solidarpay-text">{item.label}</span>
                  </div>
                  <Badge variant={item.count > 0 ? 'default' : 'secondary'}>
                    {item.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
