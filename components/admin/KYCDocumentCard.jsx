'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Eye, User } from 'lucide-react'

export default function KYCDocumentCard({ document, onExamine }) {
  const score = document.autoScore || 0
  const user = document.user || {}

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Haute confiance'
    if (score >= 70) return 'Revue recommandée'
    return 'Faible confiance'
  }

  const getCountryFlag = (countryCode) => {
    const flags = {
      'CA': '🇨🇦', 'FR': '🇫🇷', 'BE': '🇧🇪', 'CH': '🇨🇭', 'US': '🇺🇸'
    }
    return flags[countryCode] || '🌍'
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header with photo */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-solidarpay-primary flex items-center justify-center text-white text-lg font-semibold flex-shrink-0">
              {user.fullName?.charAt(0)?.toUpperCase() || <User className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{user.fullName || 'N/A'}</h3>
              <p className="text-sm text-solidarpay-text/70 truncate">{user.email}</p>
            </div>
          </div>

          {/* Country */}
          {user.country && (
            <div className="flex items-center gap-1 text-sm">
              <span>{getCountryFlag(user.country)}</span>
              <span className="text-solidarpay-text/70">{user.country}</span>
            </div>
          )}

          {/* Date */}
          <div className="text-xs text-solidarpay-text/70">
            Soumis le {new Date(document.submittedAt || document.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </div>

          {/* Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Score automatique</span>
              <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                {score}%
              </span>
            </div>
            <Progress value={score} className="h-2" />
            <Badge 
              variant={score >= 90 ? 'default' : score >= 70 ? 'default' : 'destructive'}
              className={
                score >= 90 ? 'bg-green-100 text-green-800' :
                score >= 70 ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }
            >
              {getScoreLabel(score)}
            </Badge>
          </div>

          {/* Document Preview */}
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={document.documentUrl}
              alt="Document preview"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999"%3EPreview non disponible%3C/text%3E%3C/svg%3E'
              }}
            />
          </div>

          {/* Action Button */}
          <Button
            onClick={onExamine}
            className="w-full bg-solidarpay-primary hover:bg-solidarpay-secondary"
          >
            <Eye className="w-4 h-4 mr-2" />
            Examiner
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

