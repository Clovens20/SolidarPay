'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Users,
  UserCheck,
  Shield,
  PiggyBank,
  Globe,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Wrench,
  Clock,
  Activity,
} from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

const AdminDashboardCharts = dynamic(
  () => import('@/components/admin/AdminDashboardCharts'),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="min-w-0 overflow-hidden">
            <CardContent className="p-6">
              <div className="h-[240px] w-full animate-pulse rounded-lg bg-solidarpay-border/40 sm:h-[300px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    ),
  }
)

function countPaymentMethodsFromCountries(rows) {
  if (!rows?.length) return 0
  return rows.reduce((acc, row) => {
    const pm = row.paymentMethods
    return acc + (Array.isArray(pm) ? pm.length : 0)
  }, 0)
}

function parseMaintenanceMode(value) {
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  if (value && typeof value === 'object' && 'enabled' in value) return Boolean(value.enabled)
  return false
}

function buildGeographyData(userRows, nameByCode) {
  const counts = new Map()
  for (const row of userRows || []) {
    const code = row.country?.trim()
    if (!code) continue
    counts.set(code, (counts.get(code) || 0) + 1)
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const top = 5
  const head = sorted.slice(0, top)
  const tail = sorted.slice(top)
  const otherSum = tail.reduce((s, [, n]) => s + n, 0)
  const out = head.map(([code, users]) => ({
    country: nameByCode[code] || code,
    users,
  }))
  if (otherSum > 0) {
    out.push({ country: 'Autres', users: otherSum })
  }
  return out
}

export default function AdminDashboard() {
  const isMobile = useIsMobile()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMembers: 0,
    totalAdmins: 0,
    totalTontines: 0,
    activeCountries: 0,
    paymentMethods: 0,
  })
  const [charts, setCharts] = useState({
    registrations: [],
    tontinesCreated: [],
    geography: [],
  })
  const [alerts, setAlerts] = useState([])
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [secondaryLoading, setSecondaryLoading] = useState(true)

  const loadStats = useCallback(async () => {
    const { data: countriesRows, error: countriesError } = await supabase
      .from('payment_countries')
      .select('code, name, paymentMethods')
      .eq('enabled', true)

    if (countriesError) console.error('payment_countries:', countriesError)

    const activeList = countriesRows || []
    const activeCountries = activeList.length
    const paymentMethods = countPaymentMethodsFromCountries(activeList)

    const [
      { count: totalUsers },
      { count: totalMembers },
      { count: totalAdmins },
      { count: totalTontines },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'member'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      supabase.from('tontines').select('*', { count: 'exact', head: true }),
    ])

    setStats({
      totalUsers: totalUsers || 0,
      totalMembers: totalMembers || 0,
      totalAdmins: totalAdmins || 0,
      totalTontines: totalTontines || 0,
      activeCountries,
      paymentMethods,
    })

    return {
      nameByCode: Object.fromEntries(activeList.map((c) => [c.code, c.name])),
    }
  }, [])

  const loadCharts = useCallback(async (nameByCode) => {
    const months = []
    for (let i = 2; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      months.push(date.toISOString().slice(0, 7))
    }

    const monthRange = (month) => {
      const start = `${month}-01`
      const endDate = new Date(month + '-01')
      endDate.setMonth(endDate.getMonth() + 1)
      const end = endDate.toISOString().slice(0, 10)
      return { start, end }
    }

    const [registrationsData, tontinesData, geoResult] = await Promise.all([
      Promise.all(
        months.map(async (month) => {
          const { start, end } = monthRange(month)
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('createdAt', start)
            .lt('createdAt', end)
          return {
            month: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short' }),
            count: count || 0,
          }
        })
      ),
      Promise.all(
        months.map(async (month) => {
          const { start, end } = monthRange(month)
          const { count } = await supabase
            .from('tontines')
            .select('*', { count: 'exact', head: true })
            .gte('createdAt', start)
            .lt('createdAt', end)
          return {
            month: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short' }),
            count: count || 0,
          }
        })
      ),
      supabase.from('users').select('country').not('country', 'is', null),
    ])

    if (geoResult.error) console.error('Géographie dashboard:', geoResult.error)
    const geography = buildGeographyData(geoResult.data, nameByCode || {})

    setCharts({
      registrations: registrationsData,
      tontinesCreated: tontinesData,
      geography,
    })
  }, [])

  const loadTimeline = useCallback(async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const [regRes, tonRes, logRes] = await Promise.all([
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('createdAt', yesterday.toISOString()),
      supabase
        .from('tontines')
        .select('*', { count: 'exact', head: true })
        .gte('createdAt', yesterday.toISOString()),
      supabase
        .from('system_logs')
        .select('*', { count: 'exact', head: true })
        .in('level', ['error', 'critical'])
        .gte('createdAt', yesterday.toISOString()),
    ])

    if (logRes.error && logRes.error.code !== '42P01') {
      console.warn('Timeline system_logs:', logRes.error)
    }

    const systemErrors = logRes.error ? 0 : logRes.count || 0

    setTimeline([
      { type: 'user', label: 'Nouvelles inscriptions', count: regRes.count || 0 },
      { type: 'tontine', label: 'Nouvelles tontines créées', count: tonRes.count || 0 },
      { type: 'error', label: 'Entrées erreur / critique (logs)', count: systemErrors },
    ])
  }, [])

  const applyAlerts = useCallback((maintenanceValue, refreshedAt) => {
    const alertsList = []
    const maintenanceOn = parseMaintenanceMode(maintenanceValue)

    alertsList.push({
      type: maintenanceOn ? 'warning' : 'success',
      icon: maintenanceOn ? Wrench : CheckCircle,
      title: 'Mode maintenance',
      description: maintenanceOn
        ? 'Activé (clé maintenance_mode). Voir la page Maintenance.'
        : 'Désactivé — configuration plateforme.',
    })

    alertsList.push({
      type: 'info',
      icon: Clock,
      title: 'Actualisation des indicateurs',
      description: `Données lues en base à ${refreshedAt.toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}.`,
    })

    setAlerts(alertsList)
  }, [])

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    setSecondaryLoading(true)
    const refreshedAt = new Date()

    try {
      const maintenancePromise = supabase
        .from('platform_customization')
        .select('value')
        .eq('key', 'maintenance_mode')
        .maybeSingle()

      const statsPromise = loadStats()
      const chartsPromise = statsPromise.then((meta) => loadCharts(meta.nameByCode))
      const timelinePromise = loadTimeline()
      const [maintenanceResult, statsResult] = await Promise.all([
        maintenancePromise,
        statsPromise,
      ])
      applyAlerts(maintenanceResult.data?.value, refreshedAt)
      setLoading(false)

      await Promise.all([chartsPromise, timelinePromise])
    } catch (error) {
      console.error('Error loading dashboard:', error)
      applyAlerts(false, refreshedAt)
    } finally {
      setLoading(false)
      setSecondaryLoading(false)
    }
  }, [loadStats, loadCharts, loadTimeline, applyAlerts])

  useEffect(() => {
    let mounted = true

    const run = async () => {
      if (mounted) await loadDashboardData()
    }
    void run()

    const interval = setInterval(() => {
      if (mounted && typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadDashboardData()
      }
    }, 180000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [loadDashboardData])

  const statCards = useMemo(
    () => [
      { icon: Users, label: 'Total utilisateurs inscrits', value: stats.totalUsers, color: 'text-blue-600' },
      { icon: UserCheck, label: 'Total membres', value: stats.totalMembers, color: 'text-green-600' },
      { icon: Shield, label: 'Total admins tontine', value: stats.totalAdmins, color: 'text-purple-600' },
      { icon: PiggyBank, label: 'Total tontines créées', value: stats.totalTontines, color: 'text-orange-600' },
      { icon: Globe, label: 'Pays actifs', value: stats.activeCountries, color: 'text-cyan-600' },
      {
        icon: CreditCard,
        label: 'Méthodes de paiement (pays actifs)',
        value: stats.paymentMethods,
        color: 'text-pink-600',
      },
    ],
    [stats]
  )

  const chartHeight = isMobile ? 240 : 300

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-solidarpay-primary" />
          <p className="mt-4 text-sm text-solidarpay-text sm:text-base">Chargement des statistiques…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card
              key={index}
              className={`min-w-0 touch-manipulation ${stat.badge ? 'border-red-300' : ''}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium leading-tight text-solidarpay-text/70 sm:text-sm">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 shrink-0 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums text-solidarpay-text sm:text-3xl">{stat.value}</div>
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

      <AdminDashboardCharts
        charts={charts}
        secondaryLoading={secondaryLoading}
        isMobile={isMobile}
        chartHeight={chartHeight}
      />

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Alertes</CardTitle>
            <CardDescription>État issu des données réelles de la plateforme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert, index) => {
              const Icon = alert.icon
              return (
                <Alert
                  key={index}
                  variant={alert.type === 'warning' ? 'destructive' : 'default'}
                  className="text-sm"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <AlertTitle>{alert.title}</AlertTitle>
                  <AlertDescription>{alert.description}</AlertDescription>
                </Alert>
              )
            })}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Activité récente</CardTitle>
            <CardDescription>Dernières 24 heures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {secondaryLoading ? (
                <p className="text-sm text-solidarpay-text/70">Chargement…</p>
              ) : (
                timeline.map((item, index) => (
                  <div
                    key={index}
                    className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-solidarpay-bg p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Activity className="h-5 w-5 shrink-0 text-solidarpay-primary" />
                      <span className="text-sm font-medium leading-snug text-solidarpay-text">{item.label}</span>
                    </div>
                    <Badge variant={item.count > 0 ? 'default' : 'secondary'} className="shrink-0 tabular-nums">
                      {item.count}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
