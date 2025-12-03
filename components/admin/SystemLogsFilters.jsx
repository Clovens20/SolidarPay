'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter, X } from 'lucide-react'

const EVENT_TYPES = [
  { value: 'auth', label: 'Authentification' },
  { value: 'kyc', label: 'KYC' },
  { value: 'tontine', label: 'Tontines' },
  { value: 'system', label: 'Système' },
  { value: 'error', label: 'Erreurs' }
]

const LEVELS = [
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Avertissement' },
  { value: 'error', label: 'Erreur' },
  { value: 'critical', label: 'Critique' }
]

export default function SystemLogsFilters({ filters, setFilters }) {
  const hasActiveFilters = filters.eventType || filters.level || filters.dateFrom || filters.dateTo || filters.search

  const clearFilters = () => {
    setFilters({
      eventType: '',
      level: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Event Type */}
          <div className="space-y-2">
            <Label>Type d'événement</Label>
            <Select 
              value={filters.eventType || undefined} 
              onValueChange={(value) => setFilters({ ...filters, eventType: value || '' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Level */}
          <div className="space-y-2">
            <Label>Niveau</Label>
            <Select 
              value={filters.level || undefined} 
              onValueChange={(value) => setFilters({ ...filters, level: value || '' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les niveaux" />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date From */}
          <div className="space-y-2">
            <Label>Date début</Label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <Label>Date fin</Label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label>Recherche</Label>
            <Input
              placeholder="Recherche textuelle..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
            >
              <X className="w-4 h-4 mr-2" />
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

