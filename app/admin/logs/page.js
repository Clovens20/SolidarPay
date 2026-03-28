'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { FileText, Info, AlertCircle, XCircle, Activity } from 'lucide-react'
import SystemLogsStats from '@/components/admin/SystemLogsStats'
import SystemLogsFilters from '@/components/admin/SystemLogsFilters'
import SystemLogsTable from '@/components/admin/SystemLogsTable'
import SystemLogsAlerts from '@/components/admin/SystemLogsAlerts'

const EVENT_TYPES = {
  'auth': 'Authentification',
  'kyc': 'KYC',
  'tontine': 'Tontines',
  'system': 'Système',
  'error': 'Erreurs'
}

const EVENT_CATEGORIES = {
  'auth_login': { type: 'auth', icon: '🔐', label: 'Connexion' },
  'auth_logout': { type: 'auth', icon: '🚪', label: 'Déconnexion' },
  'auth_locked': { type: 'auth', icon: '🔒', label: 'Compte verrouillé' },
  'kyc_submitted': { type: 'kyc', icon: '📄', label: 'Document soumis' },
  'kyc_approved': { type: 'kyc', icon: '✅', label: 'Document approuvé' },
  'kyc_rejected': { type: 'kyc', icon: '❌', label: 'Document rejeté' },
  'kyc_requested': { type: 'kyc', icon: '🔄', label: 'Nouveau document demandé' },
  'tontine_created': { type: 'tontine', icon: '💰', label: 'Tontine créée' },
  'tontine_member_added': { type: 'tontine', icon: '👥', label: 'Membre ajouté' },
  'system_maintenance': { type: 'system', icon: '🔧', label: 'Maintenance' },
  'system_settings': { type: 'system', icon: '⚙️', label: 'Paramètres modifiés' },
  'system_backup': { type: 'system', icon: '💾', label: 'Sauvegarde' },
  'system_country': { type: 'system', icon: '🌍', label: 'Pays modifié' },
  'system_payment': { type: 'system', icon: '💳', label: 'Méthode de paiement' },
  'system_customization': { type: 'system', icon: '🎨', label: 'Personnalisation' },
  'error_server': { type: 'error', icon: '❌', label: 'Erreur serveur' },
  'error_upload': { type: 'error', icon: '⚠️', label: 'Upload échoué' },
  'error_database': { type: 'error', icon: '🔌', label: 'Erreur base de données' },
  'error_email': { type: 'error', icon: '📧', label: 'Erreur email' },
  'error_critical': { type: 'error', icon: '💥', label: 'Erreur critique' }
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    criticalErrors24h: 0,
    systemChangesWeek: 0,
    logHealthPercent7d: null,
  })
  const [alerts, setAlerts] = useState([])
  const [filters, setFilters] = useState({
    eventType: '',
    level: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  })

  // Mémoriser loadLogs pour éviter les re-créations
  const loadLogsMemo = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(100) // Reduced from 500 for better performance

      if (error) {
        console.error('Error loading logs:', error)
        // Si la table n'existe pas, créer un message d'erreur amical
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          setLogs([])
          return
        }
        throw error
      }
      
      // Transform logs with event category info
      const transformedLogs = (data || []).map(log => {
        const category = EVENT_CATEGORIES[log.category] || { type: 'system', icon: '📝', label: log.category }
        return {
          ...log,
          eventType: category.type,
          categoryLabel: category.label,
          categoryIcon: category.icon
        }
      })

      setLogs(transformedLogs)
    } catch (error) {
      console.error('Error loading logs:', error)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Mémoriser loadStats pour éviter les re-créations
  const loadStatsMemo = useCallback(async () => {
    try {
      // Parallelize all stats queries
      const yesterday = new Date()
      yesterday.setHours(yesterday.getHours() - 24)
      
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const [
        { count: criticalErrors, error: criticalError },
        { count: systemChanges, error: systemError },
        { count: totalLogs7d, error: totalErr },
        { count: badLogs7d, error: badErr },
      ] = await Promise.all([
        supabase
          .from('system_logs')
          .select('*', { count: 'exact', head: true })
          .eq('level', 'critical')
          .gte('createdAt', yesterday.toISOString()),
        supabase
          .from('system_logs')
          .select('*', { count: 'exact', head: true })
          .eq('level', 'info')
          .like('category', 'system_%')
          .gte('createdAt', weekAgo.toISOString()),
        supabase
          .from('system_logs')
          .select('*', { count: 'exact', head: true })
          .gte('createdAt', weekAgo.toISOString()),
        supabase
          .from('system_logs')
          .select('*', { count: 'exact', head: true })
          .in('level', ['error', 'critical'])
          .gte('createdAt', weekAgo.toISOString()),
      ])

      if (criticalError) console.error('Error loading critical errors:', criticalError)
      if (systemError) console.error('Error loading system changes:', systemError)
      if (totalErr || badErr) console.error('Error loading log health:', totalErr || badErr)

      const total7 = totalLogs7d || 0
      const bad7 = badLogs7d || 0
      const logHealthPercent7d =
        !totalErr && !badErr && total7 > 0
          ? Math.round(((total7 - bad7) / total7) * 1000) / 10
          : !totalErr && total7 === 0
            ? 100
            : null

      setStats({
        criticalErrors24h: criticalErrors || 0,
        systemChangesWeek: systemChanges || 0,
        logHealthPercent7d,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      // Set default stats on error
      setStats({
        criticalErrors24h: 0,
        systemChangesWeek: 0,
        logHealthPercent7d: null,
      })
    }
  }, [])

  // Mémoriser checkAlerts pour éviter les re-créations
  const checkAlertsMemo = useCallback(async () => {
    const alertsList = []

    try {
      // Check critical errors
      const yesterday = new Date()
      yesterday.setHours(yesterday.getHours() - 24)
      
      const { count: criticalErrors, error: criticalError } = await supabase
        .from('system_logs')
        .select('*', { count: 'exact', head: true })
        .eq('level', 'critical')
        .gte('createdAt', yesterday.toISOString())

      if (!criticalError && criticalErrors > 0) {
        alertsList.push({
          type: 'critical',
          title: 'Erreur critique détectée',
          description: `${criticalErrors} erreur(s) critique(s) dans les dernières 24h`,
          icon: XCircle
        })
      }

    } catch (error) {
      console.error('Error checking alerts:', error)
    }

    setAlerts(alertsList)
  }, [])

  useEffect(() => {
    let mounted = true

    const initializeLogs = async () => {
      if (!mounted) return
      await Promise.all([loadLogsMemo(), loadStatsMemo(), checkAlertsMemo()])
    }

    void initializeLogs()

    // Auto-refresh every 60 seconds (reduced from 30)
    const interval = setInterval(() => {
      if (mounted) {
        loadLogsMemo()
        loadStatsMemo()
        checkAlertsMemo()
      }
    }, 60000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [loadLogsMemo, loadStatsMemo, checkAlertsMemo])

  // Utiliser useMemo pour filtrer au lieu d'un useEffect qui cause des boucles
  const filteredLogsMemo = useMemo(() => {
    let filtered = [...logs]

    // Filter by event type
    if (filters.eventType) {
      filtered = filtered.filter(log => log.eventType === filters.eventType)
    }

    // Filter by level
    if (filters.level) {
      filtered = filtered.filter(log => log.level === filters.level)
    }

    // Filter by date range
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter(log => new Date(log.createdAt) >= fromDate)
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(log => new Date(log.createdAt) <= toDate)
    }

    // Filter by search
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(log =>
        log.message?.toLowerCase().includes(search) ||
        log.category?.toLowerCase().includes(search) ||
        log.metadata?.toLowerCase().includes(search)
      )
    }

    return filtered
  }, [filters, logs])


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-solidarpay-text">Logs Système</h1>
          <p className="text-solidarpay-text/70 mt-1">Surveillance technique - Événements système uniquement</p>
        </div>
      </div>

      {/* Real-time Alerts */}
      <SystemLogsAlerts alerts={alerts} />

      {/* Statistics */}
      <SystemLogsStats stats={stats} />

      {/* Filters */}
      <SystemLogsFilters
        filters={filters}
        setFilters={setFilters}
      />

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Événements système</CardTitle>
          <CardDescription>
            {filteredLogsMemo.length} événement(s) trouvé(s) sur {logs.length} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solidarpay-primary mx-auto"></div>
              <p className="mt-4 text-solidarpay-text/70">Chargement des logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-solidarpay-text/30 mx-auto mb-4" />
              <p className="text-solidarpay-text/70 mb-2">Aucun log système enregistré</p>
              <p className="text-sm text-solidarpay-text/50">
                Les événements système apparaîtront ici automatiquement
              </p>
            </div>
          ) : (
            <SystemLogsTable
              logs={filteredLogsMemo}
              loading={loading}
              eventCategories={EVENT_CATEGORIES}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
