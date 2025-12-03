'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings } from 'lucide-react'

export default function SettingsTab({ tontine, onUpdate }) {
  // TODO: Implement settings management
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-solidarpay-text">Paramètres</h2>
        <p className="text-solidarpay-text/70">Modifiez les paramètres de votre tontine</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration
          </CardTitle>
          <CardDescription>Modifiez les paramètres de base de votre tontine</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la tontine</Label>
            <Input id="name" defaultValue={tontine.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Montant de cotisation</Label>
            <Input id="amount" type="number" defaultValue={tontine.contributionAmount} />
          </div>
          <Button className="bg-solidarpay-primary hover:bg-solidarpay-secondary">
            Sauvegarder
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

