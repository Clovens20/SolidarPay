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
import { Filter, ArrowUpDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function KYCFilters({ filters, setFilters, sortBy, setSortBy }) {
  const [countries, setCountries] = useState([])

  useEffect(() => {
    loadCountries()
  }, [])

  const loadCountries = async () => {
    try {
      const { data } = await supabase
        .from('payment_countries')
        .select('code, name')
        .eq('enabled', true)
        .order('name', { ascending: true })

      setCountries(data || [])
    } catch (error) {
      console.error('Error loading countries:', error)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Country Filter */}
          <div className="space-y-2">
            <Label>Pays</Label>
            <Select value={filters.country || undefined} onValueChange={(value) => setFilters({ ...filters, country: value || '' })}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les pays" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Score Filter */}
          <div className="space-y-2">
            <Label>Score</Label>
            <Select value={filters.score || undefined} onValueChange={(value) => setFilters({ ...filters, score: value || '' })}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les scores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={undefined}>Tous les scores</SelectItem>
                <SelectItem value="90-100">90-100% (Haute confiance)</SelectItem>
                <SelectItem value="70-89">70-89% (Revue recommandée)</SelectItem>
                <SelectItem value="0-69">0-69% (Faible confiance)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div className="space-y-2">
            <Label>Date de soumission</Label>
            <Input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>

          {/* Document Type Filter */}
          <div className="space-y-2">
            <Label>Type de document</Label>
            <Select value={filters.documentType || undefined} onValueChange={(value) => setFilters({ ...filters, documentType: value || '' })}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={undefined}>Tous les types</SelectItem>
                <SelectItem value="identity">Pièce d'identité</SelectItem>
                <SelectItem value="proof_of_address">Justificatif de domicile</SelectItem>
                <SelectItem value="selfie">Selfie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <Label>Trier par</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oldest">Plus anciens d'abord</SelectItem>
                <SelectItem value="newest">Plus récents d'abord</SelectItem>
                <SelectItem value="scoreLow">Score le plus bas</SelectItem>
                <SelectItem value="scoreHigh">Score le plus haut</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.country || filters.score || filters.date || filters.documentType) && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ country: '', score: '', date: '', documentType: '' })}
            >
              <Filter className="w-4 h-4 mr-2" />
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

