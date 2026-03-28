'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users, Search, RefreshCw, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ROLE_LABELS = {
  member: 'Membre',
  admin: 'Admin tontine',
  super_admin: 'Super admin',
}

function roleBadgeVariant(role) {
  if (role === 'super_admin') return 'default'
  if (role === 'admin') return 'secondary'
  return 'outline'
}

export default function AdminUsersPage() {
  const [rows, setRows] = useState([])
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [countryFilter, setCountryFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('member_admin')
  const [search, setSearch] = useState('')

  const loadCountries = useCallback(async () => {
    const { data, error } = await supabase
      .from('payment_countries')
      .select('code, name')
      .eq('enabled', true)
      .order('name', { ascending: true })
    if (!error) setCountries(data || [])
  }, [])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      let q = supabase
        .from('users')
        .select('id, email, fullName, phone, country, role, createdAt')
        .order('createdAt', { ascending: false })

      if (countryFilter !== 'all') {
        q = q.eq('country', countryFilter)
      }

      const { data, error } = await q
      if (error) throw error
      setRows(data || [])
    } catch (e) {
      console.error(e)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [countryFilter])

  useEffect(() => {
    loadCountries()
  }, [loadCountries])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((u) => {
      if (roleFilter === 'member_admin') {
        if (u.role !== 'member' && u.role !== 'admin') return false
      } else if (roleFilter !== 'all' && u.role !== roleFilter) {
        return false
      }
      if (!q) return true
      const name = (u.fullName || '').toLowerCase()
      const mail = (u.email || '').toLowerCase()
      return name.includes(q) || mail.includes(q)
    })
  }, [rows, roleFilter, search])

  const countryName = (code) => {
    if (!code) return '—'
    const c = countries.find((x) => x.code === code)
    return c ? `${c.name} (${code})` : code
  }

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-solidarpay-text sm:text-3xl">Utilisateurs</h1>
        <p className="mt-1 text-sm text-solidarpay-text/70 sm:text-base">
          Liste des comptes (membres et administrateurs de tontine), filtrable par pays et rôle.
        </p>
      </div>

      <Card className="min-w-0">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-solidarpay-primary" />
            Filtres
          </CardTitle>
          <CardDescription>
            Les super administrateurs apparaissent uniquement si vous choisissez « Tous les rôles ».
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                Pays
              </Label>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member_admin">Membres + admins tontine</SelectItem>
                  <SelectItem value="member">Membres uniquement</SelectItem>
                  <SelectItem value="admin">Admins tontine uniquement</SelectItem>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="super_admin">Super admins uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-2">
              <Label className="flex items-center gap-1">
                <Search className="h-3.5 w-3.5" />
                Recherche
              </Label>
              <Input
                placeholder="Nom ou email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => loadUsers()}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <span className="text-sm text-solidarpay-text/70">
              {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <CardContent className="p-0 sm:p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <RefreshCw className="h-8 w-8 animate-spin text-solidarpay-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Nom</TableHead>
                  <TableHead className="min-w-[160px]">Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Téléphone</TableHead>
                  <TableHead>Pays</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="hidden md:table-cell">Inscription</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-solidarpay-text/70">
                      Aucun utilisateur ne correspond aux filtres.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.fullName || '—'}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs sm:text-sm">{u.email}</TableCell>
                      <TableCell className="hidden sm:table-cell">{u.phone || '—'}</TableCell>
                      <TableCell className="text-sm">{countryName(u.country)}</TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(u.role)} className="whitespace-nowrap">
                          {ROLE_LABELS[u.role] || u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-sm text-solidarpay-text/80 md:table-cell">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
