'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, AlertTriangle, XCircle, Clock } from 'lucide-react'

export default function SystemLogsAlerts({ alerts }) {
  if (alerts.length === 0) {
    return null
  }

  const getAlertConfig = (type) => {
    const configs = {
      critical: {
        variant: 'destructive',
        icon: XCircle,
        className: 'border-red-300 bg-red-50'
      },
      warning: {
        variant: 'default',
        icon: AlertTriangle,
        className: 'border-yellow-300 bg-yellow-50'
      }
    }
    return configs[type] || configs.warning
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => {
        const config = getAlertConfig(alert.type)
        const Icon = alert.icon || config.icon

        return (
          <Alert key={index} variant={config.variant} className={config.className}>
            <Icon className="h-4 w-4" />
            <AlertTitle className="font-semibold">{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        )
      })}
    </div>
  )
}

