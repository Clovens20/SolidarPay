'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, FileCheck, Settings, Activity } from 'lucide-react'

export default function SystemLogsStats({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <CardTitle className="text-sm font-medium">KYC traités</CardTitle>
          <FileCheck className="w-4 h-4 text-solidarpay-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.kycProcessedToday}</div>
          <p className="text-xs text-muted-foreground mt-1">Aujourd'hui</p>
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
          <CardTitle className="text-sm font-medium">Uptime du site</CardTitle>
          <Activity className="w-4 h-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.uptime}</div>
          <p className="text-xs text-muted-foreground mt-1">Disponibilité</p>
        </CardContent>
      </Card>
    </div>
  )
}

