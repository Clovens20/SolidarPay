'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, XCircle, TrendingUp, AlertCircle } from 'lucide-react'

export default function KYCStats({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card className={stats.pendingReview > 10 ? 'border-red-300 bg-red-50' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revues manuelles</CardTitle>
          <Clock className="w-4 h-4 text-solidarpay-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingReview || 0}</div>
          {stats.pendingReview > 10 && (
            <Badge variant="destructive" className="mt-2">
              <AlertCircle className="w-3 h-3 mr-1" />
              Attention requise
            </Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Traitées aujourd'hui</CardTitle>
          <TrendingUp className="w-4 h-4 text-solidarpay-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.processedToday}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taux d'approbation</CardTitle>
          <CheckCircle className="w-4 h-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.approvalRate}%</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Temps moyen</CardTitle>
          <Clock className="w-4 h-4 text-solidarpay-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgProcessingTime}h</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taux auto-approbation</CardTitle>
          <TrendingUp className="w-4 h-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.autoApprovalRate || 0}%</div>
          <p className="text-xs text-muted-foreground mt-1">Approuvés automatiquement</p>
        </CardContent>
      </Card>
    </div>
  )
}

