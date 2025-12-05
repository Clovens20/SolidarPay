'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, ArrowLeft, CheckCircle, Clock, XCircle, Eye, FileText, User, Mail, Phone, Globe } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import KYCDocumentModal from '@/components/admin-tontine/KYCDocumentModal'

export default function SearchMembersPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [selectedCountry, setSelectedCountry] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [groupedResults, setGroupedResults] = useState({})
  const [countries, setCountries] = useState([])
  const [countryNames, setCountryNames] = useState({})
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [searching, setSearching] = useState(false)
  const [kycModal, setKycModal] = useState(null)
  const [viewProfileModal, setViewProfileModal] = useState(null)

  useEffect(() => {
    loadCountries()
  }, [])

  const loadCountries = async () => {
    try {
      setLoadingCountries(true)
      console.log('🔍 Loading countries...')
      
      const { data, error } = await supabase
        .from('payment_countries')
        .select('code, name, enabled')
        .eq('enabled', true)
        .order('name', { ascending: true })

      if (error) {
        console.error('❌ Error loading countries:', error)
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les pays: ' + error.message,
          variant: 'destructive'
        })
        setCountries([])
        return
      }
      
      console.log('✅ Countries loaded:', data)
      console.log('📊 Number of countries:', data?.length || 0)
      
      setCountries(data || [])
      
      // Create a map of country codes to names for quick lookup
      const countryMap = {}
      ;(data || []).forEach(country => {
        countryMap[country.code] = country.name
      })
      setCountryNames(countryMap)
      
      if (!data || data.length === 0) {
        console.warn('⚠️ No countries found with enabled=true')
        console.warn('Trying to load all countries without filter...')
        
        // Essayer sans le filtre enabled pour voir si c'est un problème de permissions
        const { data: allData, error: allError } = await supabase
          .from('payment_countries')
          .select('code, name, enabled')
          .order('name', { ascending: true })
        
        if (!allError && allData && allData.length > 0) {
          console.log('✅ Found countries without enabled filter:', allData)
          // Filtrer manuellement les pays activés
          const enabledCountries = allData.filter(c => c.enabled === true)
          console.log('✅ Enabled countries:', enabledCountries)
          setCountries(enabledCountries)
          
          const countryMap2 = {}
          enabledCountries.forEach(country => {
            countryMap2[country.code] = country.name
          })
          setCountryNames(countryMap2)
        } else {
          console.error('❌ Still no countries found:', allError)
          toast({
            title: 'Aucun pays disponible',
            description: 'Aucun pays activé trouvé. Vérifiez la configuration.',
            variant: 'destructive'
          })
        }
      }
    } catch (error) {
      console.error('❌ Exception loading countries:', error)
      toast({
        title: 'Erreur',
        description: 'Erreur lors du chargement des pays: ' + error.message,
        variant: 'destructive'
      })
      setCountries([])
    } finally {
      setLoadingCountries(false)
    }
  }

  const getCountryFlag = (countryCode) => {
    const flags = {
      'CA': '🇨🇦', 'US': '🇺🇸', 'FR': '🇫🇷', 'BE': '🇧🇪', 'CH': '🇨🇭',
      'MX': '🇲🇽', 'CL': '🇨🇱', 'HT': '🇭🇹', 'SN': '🇸🇳', 'CM': '🇨🇲'
    }
    return flags[countryCode] || '🌍'
  }

  // Map countries to regions
  const getCountryRegion = (countryCode) => {
    const regions = {
      // Amérique du Nord
      'CA': 'Amérique du Nord',
      'US': 'Amérique du Nord',
      'MX': 'Amérique du Nord',
      // Europe
      'FR': 'Europe',
      'BE': 'Europe',
      'CH': 'Europe',
      // Amérique du Sud
      'CL': 'Amérique du Sud',
      // Caraïbes
      'HT': 'Caraïbes',
      // Afrique
      'SN': 'Afrique',
      'CM': 'Afrique'
    }
    return regions[countryCode] || 'Autre'
  }

  // Group results by region and country
  const groupResultsByRegionAndCountry = (results) => {
    const grouped = {}
    
    results.forEach(user => {
      const countryCode = user.country || 'UNKNOWN'
      const region = getCountryRegion(countryCode)
      const countryName = countryNames[countryCode] || countryCode
      
      if (!grouped[region]) {
        grouped[region] = {}
      }
      
      if (!grouped[region][countryCode]) {
        grouped[region][countryCode] = {
          code: countryCode,
          name: countryName,
          members: []
        }
      }
      
      grouped[region][countryCode].members.push(user)
    })
    
    return grouped
  }

  // Sort regions and countries
  const getSortedRegions = (grouped) => {
    const regionOrder = [
      'Amérique du Nord',
      'Amérique du Sud',
      'Caraïbes',
      'Europe',
      'Afrique',
      'Autre'
    ]
    
    return Object.keys(grouped).sort((a, b) => {
      const indexA = regionOrder.indexOf(a)
      const indexB = regionOrder.indexOf(b)
      if (indexA === -1 && indexB === -1) return a.localeCompare(b)
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })
  }

  const getKYCStatus = (kyc) => {
    if (!kyc) {
      return {
        status: 'not_verified',
        label: 'Non vérifié',
        color: 'destructive',
        icon: XCircle
      }
    }

    switch (kyc.status) {
      case 'approved':
      case 'verifie':
        return {
          status: 'approved',
          label: 'Vérifié',
          color: 'default',
          icon: CheckCircle
        }
      case 'pending':
      case 'en_attente':
      case 'pending_review':
        return {
          status: 'pending',
          label: 'En attente',
          color: 'secondary',
          icon: Clock
        }
      case 'rejected':
      case 'rejete':
        return {
          status: 'rejected',
          label: 'Rejeté',
          color: 'destructive',
          icon: XCircle
        }
      default:
        return {
          status: 'not_verified',
          label: 'Non vérifié',
          color: 'destructive',
          icon: XCircle
        }
    }
  }

  const handleSearch = async () => {
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

      // Filter by country if selected (mais pas si 'all')
      if (selectedCountry && selectedCountry !== 'all') {
        query = query.eq('country', selectedCountry)
      }

      const { data, error } = await query.limit(50)

      if (error) throw error

      // Load KYC status for each result
      const resultsWithKYC = await Promise.all(
        (data || []).map(async (user) => {
          const { data: kyc } = await supabase
            .from('kyc_documents')
            .select('*')
            .eq('userId', user.id)
            .order('createdAt', { ascending: false })
            .limit(1)
            .maybeSingle()

          return {
            ...user,
            kyc: kyc || null
          }
        })
      )

      setSearchResults(resultsWithKYC)
      
      // Group results by region and country
      const grouped = groupResultsByRegionAndCountry(resultsWithKYC)
      setGroupedResults(grouped)

      if (resultsWithKYC.length === 0) {
        toast({
          title: 'Aucun résultat',
          description: 'Aucun membre ne correspond à votre recherche',
        })
      }
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

  const handleViewKYC = async (user) => {
    if (!user.kyc) {
      toast({
        title: 'Aucun document',
        description: 'Ce membre n\'a pas encore soumis de document KYC',
        variant: 'destructive'
      })
      return
    }

    setKycModal(user)
  }

  const handleViewProfile = (user) => {
    setViewProfileModal(user)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin-tontine')}
          className="text-solidarpay-text/70 hover:text-solidarpay-text"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à mes tontines
        </Button>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Recherche globale de membres
          </CardTitle>
          <CardDescription>
            Recherchez des membres dans toute la plateforme par nom ou email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Country Filter (Optional) - Select avec fond blanc opaque */}
          <div className="space-y-2">
            <Label>Filtrer par pays (optionnel)</Label>
            {loadingCountries ? (
              <div className="text-sm text-solidarpay-text/50 italic flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-solidarpay-primary"></div>
                Chargement des pays...
              </div>
            ) : (
              <Select
                value={selectedCountry || 'all'}
                onValueChange={(value) => {
                  console.log('Country selected:', value)
                  setSelectedCountry(value)
                }}
              >
                <SelectTrigger className="w-full bg-white/95 backdrop-blur-sm border border-gray-200">
                  <SelectValue placeholder="Sélectionner un pays">
                    {selectedCountry === 'all' || !selectedCountry
                      ? '🌍 Tous les pays'
                      : `${getCountryFlag(selectedCountry)} ${countryNames[selectedCountry] || countries.find(c => c.code === selectedCountry)?.name || selectedCountry}`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-sm border border-gray-200 max-h-[300px]">
                  <SelectItem value="all" className="cursor-pointer hover:bg-gray-100">
                    <span className="flex items-center gap-2">
                      <span>🌍</span>
                      <span>Tous les pays</span>
                    </span>
                  </SelectItem>
                  {countries.length > 0 ? (
                    countries.map((country) => {
                      if (!country || !country.code) {
                        return null
                      }
                      return (
                        <SelectItem
                          key={country.code}
                          value={country.code}
                          className="cursor-pointer hover:bg-gray-100"
                        >
                          <span className="flex items-center gap-2">
                            <span>{getCountryFlag(country.code)}</span>
                            <span>{country.name}</span>
                          </span>
                        </SelectItem>
                      )
                    })
                  ) : (
                    <SelectItem value="no-countries" disabled>
                      Aucun pays disponible
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-solidarpay-text/70">
              {selectedCountry === 'all' || !selectedCountry
                ? 'Recherche dans tous les pays'
                : `Filtrage actif : ${countryNames[selectedCountry] || countries.find(c => c.code === selectedCountry)?.name || selectedCountry}`}
            </p>
          </div>

          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Rechercher un membre</Label>
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
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={!searchTerm.trim() || searching}
                className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
              >
                {searching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Recherche...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Rechercher
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-solidarpay-text/70">
              Recherchez par nom complet ou adresse email. Vous pouvez filtrer par pays pour affiner les résultats.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Search Results - Grouped by Region and Country */}
      {searchResults.length > 0 && Object.keys(groupedResults).length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-solidarpay-text">
              Résultats de recherche
            </h2>
            <Badge variant="secondary" className="text-sm">
              {searchResults.length} membre(s) trouvé(s)
            </Badge>
          </div>
          
          {getSortedRegions(groupedResults).map((region) => {
            const countriesInRegion = Object.values(groupedResults[region])
              .sort((a, b) => a.name.localeCompare(b.name))
            const totalMembersInRegion = countriesInRegion.reduce((sum, country) => sum + country.members.length, 0)
            
            return (
              <Card key={region} className="border-solidarpay-border">
                <CardHeader className="bg-gradient-to-r from-solidarpay-primary/10 to-solidarpay-secondary/10">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-solidarpay-primary" />
                      {region}
                    </div>
                    <Badge variant="outline">
                      {totalMembersInRegion} membre(s)
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {countriesInRegion.map((countryData) => (
                      <div key={countryData.code} className="space-y-4">
                        {/* Country Header */}
                        <div className="flex items-center gap-3 pb-3 border-b border-solidarpay-border">
                          <span className="text-2xl">{getCountryFlag(countryData.code)}</span>
                          <div className="flex-1">
                            <h3 className="font-semibold text-solidarpay-text text-lg">
                              {countryData.name}
                            </h3>
                            <p className="text-sm text-solidarpay-text/70">
                              {countryData.members.length} membre(s) dans ce pays
                            </p>
                          </div>
                        </div>

                        {/* Members Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {countryData.members.map((user) => {
                            const kycInfo = getKYCStatus(user.kyc)
                            const KYCIcon = kycInfo.icon

                            return (
                              <Card key={user.id} className="border-solidarpay-border hover:shadow-md transition-shadow">
                                <CardContent className="pt-6">
                                  <div className="space-y-4">
                                    {/* User Info */}
                                    <div className="flex items-start gap-4">
                                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-solidarpay-primary to-solidarpay-secondary flex items-center justify-center text-white font-bold text-lg">
                                        {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-solidarpay-text truncate">
                                          {user.fullName || 'Nom non disponible'}
                                        </h3>
                                        <p className="text-sm text-solidarpay-text/70 truncate">
                                          {user.email}
                                        </p>
                                        {user.phone && (
                                          <p className="text-xs text-solidarpay-text/60 flex items-center gap-1 mt-1">
                                            <Phone className="w-3 h-3" />
                                            {user.phone}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* KYC Status */}
                                    <div className="flex items-center justify-between">
                                      <Badge variant={kycInfo.color} className="flex items-center gap-1">
                                        <KYCIcon className="w-3 h-3" />
                                        {kycInfo.label}
                                      </Badge>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2 border-t border-solidarpay-border">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewProfile(user)}
                                        className="flex-1"
                                      >
                                        <User className="w-4 h-4 mr-1" />
                                        Profil
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewKYC(user)}
                                        disabled={!user.kyc}
                                        className="flex-1"
                                      >
                                        <FileText className="w-4 h-4 mr-1" />
                                        KYC
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {searchResults.length === 0 && !searching && searchTerm && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="w-16 h-16 text-solidarpay-text/30 mb-4" />
            <h3 className="text-lg font-semibold text-solidarpay-text mb-2">
              Aucun résultat trouvé
            </h3>
            <p className="text-sm text-solidarpay-text/70 text-center max-w-md mb-4">
              Aucun membre ne correspond à votre recherche "{searchTerm}".
              Essayez avec un autre nom ou email.
            </p>
          </CardContent>
        </Card>
      )}

      {/* KYC Document Modal */}
      {kycModal && kycModal.kyc && (
        <KYCDocumentModal
          member={{ user: kycModal, kyc: kycModal.kyc }}
          tontineName="Recherche globale"
          onClose={() => setKycModal(null)}
        />
      )}

      {/* Profile View Modal */}
      {viewProfileModal && (
        <Dialog open={!!viewProfileModal} onOpenChange={() => setViewProfileModal(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Profil du membre</DialogTitle>
              <DialogDescription>
                Informations complètes du membre
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-solidarpay-primary to-solidarpay-secondary flex items-center justify-center text-white font-bold text-xl">
                  {viewProfileModal.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <Label className="text-xs text-solidarpay-text/70">Nom complet</Label>
                    <p className="font-semibold">{viewProfileModal.fullName || 'Non disponible'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-solidarpay-text/70">Email</Label>
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {viewProfileModal.email}
                    </p>
                  </div>
                  {viewProfileModal.phone && (
                    <div>
                      <Label className="text-xs text-solidarpay-text/70">Téléphone</Label>
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {viewProfileModal.phone}
                      </p>
                    </div>
                  )}
                  {viewProfileModal.country && (
                    <div>
                      <Label className="text-xs text-solidarpay-text/70">Pays</Label>
                      <p className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        {getCountryFlag(viewProfileModal.country)} {viewProfileModal.country}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-solidarpay-text/70">Date d'inscription</Label>
                    <p>
                      {viewProfileModal.createdAt 
                        ? new Date(viewProfileModal.createdAt).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'Non disponible'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-solidarpay-text/70">Statut KYC</Label>
                    <div className="mt-1">
                      {(() => {
                        const kycStatus = getKYCStatus(viewProfileModal.kyc)
                        const StatusIcon = kycStatus.icon
                        return (
                          <Badge variant={kycStatus.color} className="flex items-center gap-1 w-fit">
                            <StatusIcon className="w-3 h-3" />
                            {kycStatus.label}
                          </Badge>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              {viewProfileModal.kyc && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewProfileModal(null)
                    handleViewKYC(viewProfileModal)
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Voir le document KYC
                </Button>
              )}
              <Button onClick={() => setViewProfileModal(null)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
