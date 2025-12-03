'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Plus } from 'lucide-react'

export default function CyclesTab({ tontineId }) {
  // TODO: Implement cycles management
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-solidarpay-text">Cycles</h2>
          <p className="text-solidarpay-text/70">Gérez les cycles de cotisation</p>
        </div>
        <Button className="bg-solidarpay-primary hover:bg-solidarpay-secondary">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau cycle
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="w-16 h-16 text-solidarpay-text/30 mb-4" />
          <h3 className="text-lg font-semibold text-solidarpay-text mb-2">
            Aucun cycle
          </h3>
          <p className="text-sm text-solidarpay-text/70 mb-4">
            Créez votre premier cycle pour commencer
          </p>
          <Button className="bg-solidarpay-primary hover:bg-solidarpay-secondary">
            <Plus className="w-4 h-4 mr-2" />
            Créer un cycle
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

