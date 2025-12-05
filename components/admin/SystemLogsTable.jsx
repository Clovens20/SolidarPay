'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileText, Info, AlertCircle, AlertTriangle, XCircle } from 'lucide-react'

export default function SystemLogsTable({ logs, loading, eventCategories }) {
  const [selectedLog, setSelectedLog] = useState(null)

  const levelBadge = (level) => {
    const variants = {
      info: { variant: 'default', icon: Info, label: 'Info', className: 'bg-blue-100 text-blue-800' },
      warning: { variant: 'default', icon: AlertTriangle, label: 'Avertissement', className: 'bg-yellow-100 text-yellow-800' },
      error: { variant: 'destructive', icon: AlertCircle, label: 'Erreur', className: 'bg-red-100 text-red-800' },
      critical: { variant: 'destructive', icon: XCircle, label: 'Critique', className: 'bg-red-200 text-red-900' }
    }
    const config = variants[level] || variants.info
    const Icon = config.icon
    return (
      <Badge className={config.className} variant={config.variant}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solidarpay-primary mx-auto"></div>
        <p className="mt-4 text-solidarpay-text/70">Chargement des logs...</p>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-solidarpay-text/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-solidarpay-text mb-2">
          Aucun log
        </h3>
        <p className="text-sm text-solidarpay-text/70">
          Aucun événement trouvé avec les filtres sélectionnés
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Horodatage</TableHead>
              <TableHead>Niveau</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Action/Événement</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Détails</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const category = eventCategories?.[log.category] || { 
                icon: log.categoryIcon || '📝', 
                label: log.categoryLabel || log.category 
              }
              const metadata = typeof log.metadata === 'string' 
                ? JSON.parse(log.metadata || '{}') 
                : log.metadata || {}

              return (
                <TableRow 
                  key={log.id}
                  className={log.level === 'critical' ? 'bg-red-50' : log.level === 'error' ? 'bg-red-25' : ''}
                >
                  <TableCell className="font-mono text-xs">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    {levelBadge(log.level)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      <span>{category.icon}</span>
                      <span>{category.label}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      <p className="font-medium text-sm">{log.message}</p>
                      {log.categoryLabel && (
                        <p className="text-xs text-solidarpay-text/70 mt-1">
                          {log.categoryLabel}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.ipAddress ? (
                      <span className="font-mono text-xs text-solidarpay-text/70">
                        {log.ipAddress}
                      </span>
                    ) : (
                      <span className="text-xs text-solidarpay-text/50">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Info className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de l'événement</DialogTitle>
              <DialogDescription>
                Informations complètes sur cet événement système
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-solidarpay-text/70">Horodatage</p>
                  <p className="font-mono text-xs sm:text-sm">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-solidarpay-text/70">Niveau</p>
                  <div>{levelBadge(selectedLog.level)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-solidarpay-text/70">Type</p>
                  <p className="text-sm">{selectedLog.eventType || 'system'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-solidarpay-text/70">Catégorie</p>
                  <p className="text-sm">{selectedLog.category}</p>
                </div>
                {selectedLog.ipAddress && (
                  <div>
                    <p className="text-sm font-medium text-solidarpay-text/70">Adresse IP</p>
                    <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                  </div>
                )}
                {selectedLog.userAgent && (
                  <div>
                    <p className="text-sm font-medium text-solidarpay-text/70">User Agent</p>
                    <p className="text-xs break-all">{selectedLog.userAgent}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-solidarpay-text/70 mb-2">Message</p>
                <p className="text-sm bg-gray-50 p-3 rounded">{selectedLog.message}</p>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-solidarpay-text/70 mb-2">Métadonnées</p>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-60">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

