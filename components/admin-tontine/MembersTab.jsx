'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, CheckCircle, Clock, XCircle, MoreVertical, Eye, UserMinus, User, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import AddMemberModal from './AddMemberModal'
import KYCDocumentModal from './KYCDocumentModal'

export default function MembersTab({ tontineId, tontineName }) {
  const [selectedCountry, setSelectedCountry] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [members, setMembers] = useState([])
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [addMemberModal, setAddMemberModal] = useState(null)
  const [kycModal, setKycModal] = useState(null)
  const [removeMemberId, setRemoveMemberId] = useState(null)
  const [removeMemberInfo, setRemoveMemberInfo] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    loadCountries()
    loadMembers()
  }, [tontineId])

  const loadCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_countries')
        .select('*')
        .eq('enabled', true)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error loading countries:', error)
        toast({
          title: 'Attention',
          description: 'Impossible de charger les pays. Vérifiez que la table payment_countries existe.',
          variant: 'destructive'
        })
        return
      }
      
      setCountries(data || [])
      
      if (!data || data.length === 0) {
        toast({
          title: 'Aucun pays disponible',
          description: 'Aucun pays n\'a été configuré. Contactez le super admin.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error loading countries:', error)
      toast({
        title: 'Erreur',
        description: 'Erreur lors du chargement des pays: ' + error.message,
        variant: 'destructive'
      })
    }
  }

  const loadMembers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tontine_members')
        .select(`
          *,
          user:userId (
            id,
            email,
            fullName,
            phone,
            country
          )
        `)
        .eq('tontineId', tontineId)
        .order('joinedAt', { ascending: false })

      if (error) throw error

      // Load KYC status for each member
      const membersWithKYC = await Promise.all(
        (data || []).map(async (member) => {
          const { data: kyc } = await supabase
            .from('kyc_documents')
            .select('*')
            .eq('userId', member.user.id)
            .order('createdAt', { ascending: false })
            .limit(1)
            .single()

          return {
            ...member,
            kyc: kyc || null
          }
        })
      )

      setMembers(membersWithKYC)
    } catch (error) {
      console.error('Error loading members:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les membres',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!selectedCountry) {
      toast({
        title: 'Pays requis',
        description: 'Veuillez sélectionner un pays avant de rechercher',
        variant: 'destructive'
      })
      return
    }

    if (!searchTerm.trim()) {
      toast({
        title: 'Recherche requise',
        description: 'Veuillez entrer un nom ou email',
        variant: 'destructive'
      })
      return
    }

    try {
      setSearching(true)
      
      // Search users by name or email
      let query = supabase
        .from('users')
        .select('*')
        .or(`fullName.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .eq('role', 'member')

      // Filter by country if users table has country field
      // Note: You may need to add country field to users table
      if (selectedCountry) {
        query = query.eq('country', selectedCountry)
      }

      const { data, error } = await query.limit(20)

      if (error) throw error

      // Check if users are already members
      const { data: existingMembers } = await supabase
        .from('tontine_members')
        .select('userId')
        .eq('tontineId', tontineId)

      const existingMemberIds = (existingMembers || []).map(m => m.userId)

      // Load KYC status for each result
      const resultsWithKYC = await Promise.all(
        (data || []).map(async (user) => {
          const { data: kyc } = await supabase
            .from('kyc_documents')
            .select('*')
            .eq('userId', user.id)
            .order('createdAt', { ascending: false })
            .limit(1)
            .single()

          return {
            ...user,
            kyc: kyc || null,
            isAlreadyMember: existingMemberIds.includes(user.id)
          }
        })
      )

      setSearchResults(resultsWithKYC)
    } catch (error) {
      console.error('Error searching:', error)
      toast({
        title: 'Erreur de recherche',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setSearching(false)
    }
  }

  const handleAddMember = (user) => {
    setAddMemberModal(user)
  }

  const confirmAddMember = async () => {
    if (!addMemberModal) return

    try {
      // Get current max rotation order
      const { data: existingMembers } = await supabase
        .from('tontine_members')
        .select('rotationOrder')
        .eq('tontineId', tontineId)
        .order('rotationOrder', { ascending: false })
        .limit(1)

      const nextOrder = existingMembers && existingMembers.length > 0
        ? existingMembers[0].rotationOrder + 1
        : 1

      const { error } = await supabase
        .from('tontine_members')
        .insert({
          tontineId,
          userId: addMemberModal.id,
          rotationOrder: nextOrder
        })

      if (error) throw error

      toast({
        title: 'Membre ajouté',
        description: `${addMemberModal.fullName} a été ajouté à la tontine`
      })

      setAddMemberModal(null)
      setSearchResults([])
      loadMembers()
    } catch (error) {
      console.error('Error adding member:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le membre',
        variant: 'destructive'
      })
    }
  }

  const handleRemoveMember = async () => {
    if (!removeMemberId || !removeMemberInfo) return

    try {
      // Delete the member from tontine
      const { error: deleteError } = await supabase
        .from('tontine_members')
        .delete()
        .eq('id', removeMemberId)

      if (deleteError) throw deleteError

      // Reorganize rotation order for remaining members
      // Get all remaining members ordered by rotation order
      const { data: remainingMembers, error: fetchError } = await supabase
        .from('tontine_members')
        .select('id, rotationOrder')
        .eq('tontineId', tontineId)
        .order('rotationOrder', { ascending: true })

      if (fetchError) throw fetchError

      // Update rotation order sequentially (1, 2, 3, ...)
      if (remainingMembers && remainingMembers.length > 0) {
        const updates = remainingMembers.map((member, index) => ({
          id: member.id,
          rotationOrder: index + 1
        }))

        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('tontine_members')
            .update({ rotationOrder: update.rotationOrder })
            .eq('id', update.id)

          if (updateError) {
            console.warn('Error updating rotation order:', updateError)
            // Continue with other updates even if one fails
          }
        }
      }

      const memberName = removeMemberInfo.user?.fullName || 'le membre'
      toast({
        title: 'Membre retiré',
        description: `${memberName} a été retiré de la tontine avec succès. L'ordre de rotation a été réorganisé.`
      })

      setRemoveMemberId(null)
      setRemoveMemberInfo(null)
      loadMembers()
    } catch (error) {
      console.error('Error removing member:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de retirer le membre. Veuillez réessayer.',
        variant: 'destructive'
      })
    }
  }

  const getKYCStatus = (kyc) => {
    if (!kyc) {
      return { status: 'none', label: 'Non vérifié', color: 'destructive', icon: XCircle }
    }
    
    switch (kyc.status) {
      case 'approved':
        return { status: 'approved', label: 'Vérifié', color: 'default', icon: CheckCircle, className: 'bg-green-100 text-green-800' }
      case 'pending':
        return { status: 'pending', label: 'En attente', color: 'default', icon: Clock, className: 'bg-orange-100 text-orange-800' }
      case 'rejected':
        return { status: 'rejected', label: 'Rejeté', color: 'destructive', icon: XCircle }
      default:
        return { status: 'none', label: 'Non vérifié', color: 'destructive', icon: XCircle }
    }
  }

  const getCountryFlag = (countryCode) => {
    const flags = {
      'CA': '🇨🇦',
      'FR': '🇫🇷',
      'BE': '🇧🇪',
      'CH': '🇨🇭',
      'US': '🇺🇸'
    }
    return flags[countryCode] || '🌍'
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Rechercher des membres</CardTitle>
          <CardDescription>
            Recherchez des membres inscrits pour les ajouter à votre tontine
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Country Selection */}
          <div className="space-y-2">
            <Label htmlFor="country">Étape 1: Sélectionner le pays</Label>
            <Select value={selectedCountry || undefined} onValueChange={setSelectedCountry}>
              <SelectTrigger id="country">
                <SelectValue placeholder="Sélectionnez le pays de votre tontine" />
              </SelectTrigger>
              <SelectContent>
                {countries.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    Aucun pays disponible
                  </div>
                ) : (
                  countries.map((country) => (
                    <SelectItem key={country.code || country.id} value={country.code}>
                      {getCountryFlag(country.code)} {country.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-solidarpay-text/70">
              Seuls les membres de ce pays pourront être ajoutés
            </p>
          </div>

          {/* Step 2: Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Étape 2: Rechercher</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-solidarpay-text/50 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Nom complet ou email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                  disabled={!selectedCountry}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={!selectedCountry || !searchTerm.trim() || searching}
                className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
              >
                {searching ? 'Recherche...' : 'Rechercher'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats de recherche</CardTitle>
            <CardDescription>{searchResults.length} membre(s) trouvé(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((user) => {
                const kycInfo = getKYCStatus(user.kyc)
                const KYCIcon = kycInfo.icon
                const canAdd = kycInfo.status === 'approved' && !user.isAlreadyMember

                return (
                  <Card key={user.id} className="relative">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center space-y-3">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full bg-solidarpay-primary flex items-center justify-center text-white text-xl font-semibold">
                          {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>

                        {/* Name */}
                        <div>
                          <h3 className="font-semibold text-lg">{user.fullName}</h3>
                          <p className="text-sm text-solidarpay-text/70">{user.email}</p>
                          {user.phone && (
                            <p className="text-xs text-solidarpay-text/70">{user.phone}</p>
                          )}
                        </div>

                        {/* Country */}
                        {user.country && (
                          <div className="flex items-center gap-1 text-sm">
                            <span>{getCountryFlag(user.country)}</span>
                            <span className="text-solidarpay-text/70">{user.country}</span>
                          </div>
                        )}

                        {/* KYC Status */}
                        <Badge className={kycInfo.className || ''} variant={kycInfo.color}>
                          <KYCIcon className="w-3 h-3 mr-1" />
                          {kycInfo.label}
                        </Badge>

                        {/* Actions */}
                        {user.isAlreadyMember ? (
                          <Badge variant="secondary">Déjà membre</Badge>
                        ) : canAdd ? (
                          <Button
                            size="sm"
                            onClick={() => handleAddMember(user)}
                            className="w-full bg-solidarpay-primary hover:bg-solidarpay-secondary"
                          >
                            Ajouter à ma tontine
                          </Button>
                        ) : (
                          <div className="text-xs text-solidarpay-text/70 text-center">
                            {kycInfo.status === 'pending' && 'En cours de vérification'}
                            {kycInfo.status === 'rejected' && 'Doit compléter sa vérification'}
                            {kycInfo.status === 'none' && 'Doit compléter sa vérification'}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Members */}
      <Card>
        <CardHeader>
          <CardTitle>Membres de la tontine</CardTitle>
          <CardDescription>{members.length} membre(s) dans cette tontine</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solidarpay-primary mx-auto"></div>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-solidarpay-text/70">
              Aucun membre dans cette tontine
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Statut KYC</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Date d'ajout</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const kycInfo = getKYCStatus(member.kyc)
                  const KYCIcon = kycInfo.icon

                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-solidarpay-primary flex items-center justify-center text-white text-sm font-semibold">
                            {member.user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <span className="font-medium">{member.user?.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{member.user?.email}</TableCell>
                      <TableCell>{member.user?.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge className={kycInfo.className || ''} variant={kycInfo.color}>
                          <KYCIcon className="w-3 h-3 mr-1" />
                          {kycInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.kyc && member.kyc.status === 'approved' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setKycModal(member)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Voir
                          </Button>
                        ) : (
                          <span className="text-sm text-solidarpay-text/50">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(member.joinedAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setKycModal(member)}>
                              <FileText className="w-4 h-4 mr-2" />
                              Voir le document KYC
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setRemoveMemberId(member.id)
                                setRemoveMemberInfo(member)
                              }}
                              className="text-red-600"
                            >
                              <UserMinus className="w-4 h-4 mr-2" />
                              Retirer de la tontine
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Member Modal */}
      <AddMemberModal
        user={addMemberModal}
        tontineName={tontineName}
        onConfirm={confirmAddMember}
        onCancel={() => setAddMemberModal(null)}
      />

      {/* KYC Document Modal */}
      {kycModal && (
        <KYCDocumentModal
          member={kycModal}
          tontineName={tontineName}
          onClose={() => setKycModal(null)}
        />
      )}

      {/* Remove Member Confirmation */}
      <Dialog 
        open={!!removeMemberId} 
        onOpenChange={() => {
          setRemoveMemberId(null)
          setRemoveMemberInfo(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer le membre</DialogTitle>
            <DialogDescription>
              {removeMemberInfo?.user?.fullName ? (
                <>
                  Êtes-vous sûr de vouloir retirer <strong>{removeMemberInfo.user.fullName}</strong> de la tontine <strong>{tontineName}</strong> ?
                  <br /><br />
                  Cette action est <strong>irréversible</strong>. Le membre perdra l'accès à cette tontine et ne pourra plus participer aux cycles.
                </>
              ) : (
                'Êtes-vous sûr de vouloir retirer ce membre de la tontine ? Cette action est irréversible.'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRemoveMemberId(null)
                setRemoveMemberInfo(null)
              }}
            >
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleRemoveMember}>
              <UserMinus className="w-4 h-4 mr-2" />
              Confirmer la suppression
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

