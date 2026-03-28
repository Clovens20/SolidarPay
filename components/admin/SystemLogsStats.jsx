'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Settings, Activity } from 'lucide-react'

export default function SystemLogsStats({ stats }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      <Card className={stats.criticalErrors24h > 0 ? 'border-red-300 bg-red-50' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Erreurs critiques</CardTitle>
          <AlertCircle className="w-4 h-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.criticalErrors24h}</div>
          <p className="text-xs text-muted-foreground mt-1">Dernières 24h</p>
          {stats.criticalErrors24h > 0 && (
            <Badge variant="destructive" className="mt-2">
              Attention requise
            </Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Modifications système</CardTitle>
          <Settings className="w-4 h-4 text-solidarpay-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.systemChangesWeek}</div>
          <p className="text-xs text-muted-foreground mt-1">Cette semaine</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Journaux sans erreur (7j)</CardTitle>
          <Activity className="w-4 h-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.logHealthPercent7d == null ? '—' : `${stats.logHealthPercent7d}%`}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Part des entrées non error/critical sur 7 jours
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

