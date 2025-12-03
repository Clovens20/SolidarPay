'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText,
  AlertCircle
} from 'lucide-react'
import KYCDocumentCard from '@/components/admin/KYCDocumentCard'
import KYCExamModal from '@/components/admin/KYCExamModal'
import KYCStats from '@/components/admin/KYCStats'
import KYCFilters from '@/components/admin/KYCFilters'
import ManualReviewTab from '@/components/admin/ManualReviewTab'

export default function KYCPage() {
  const [documents, setDocuments] = useState([])
  const [allDocuments, setAllDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending_review') // Focus sur revues manuelles
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [stats, setStats] = useState({
    pending: 0, // En cours d'analyse automatique
    pendingReview: 0, // Revues manuelles (50-84)
    approved: 0,
    rejected: 0,
    processedToday: 0,
    approvalRate: 0,
    autoApprovalRate: 0,
    avgProcessingTime: 0
  })
  const [filters, setFilters] = useState({
    country: '',
    score: '',
    date: '',
    documentType: ''
  })
  const [sortBy, setSortBy] = useState('oldest')

  useEffect(() => {
    loadDocuments()
    loadStats()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDocuments()
      loadStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    filterAndSortDocuments()
  }, [activeTab, filters, sortBy, allDocuments])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('kyc_documents')
        .select(`
          *,
          user:userId (
            id,
            email,
            fullName,
            phone,
            country,
            role,
            createdAt
          )
        `)
        .order('createdAt', { ascending: true })

      if (error) throw error

      // Utiliser le score réel si disponible, sinon calculer
      const documentsWithScore = (data || []).map(doc => ({
        ...doc,
        autoScore: doc.autoScore || calculateMockScore(doc)
      }))

      setAllDocuments(documentsWithScore)
    } catch (error) {
      console.error('Error loading KYC documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateMockScore = (doc) => {
    let score = 50
    if (doc.status === 'approved') score = 85 + Math.random() * 15
    if (doc.status === 'rejected' || doc.status === 'new_document_required') score = Math.random() * 50
    if (doc.status === 'pending_review') score = 50 + Math.random() * 35 // 50-85
    if (doc.documentUrl) score += 20
    return Math.round(Math.min(100, Math.max(0, score)))
  }

  const loadStats = async () => {
    try {
      // Pending (en cours d'analyse automatique - pas encore de score)
      const { count: pending } = await supabase
        .from('kyc_documents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .is('autoScore', null)

      // Pending Review (revues manuelles - score 50-84)
      const { count: pendingReview } = await supabase
        .from('kyc_documents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_review')

      const { count: approved } = await supabase
        .from('kyc_documents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')

      const { count: rejected } = await supabase
        .from('kyc_documents')
        .select('*', { count: 'exact', head: true })
        .in('status', ['rejected', 'new_document_required'])

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: processedToday } = await supabase
        .from('kyc_documents')
        .select('*', { count: 'exact', head: true })
        .in('status', ['approved', 'rejected', 'new_document_required'])
        .gte('reviewedAt', today.toISOString())

      // Calculer les taux
      const total = approved + rejected
      const approvalRate = total > 0 
        ? Math.round((approved / total) * 100)
        : 0

      // Taux d'approbation automatique (approuvés automatiquement vs total)
      const { data: autoApproved } = await supabase
        .from('kyc_documents')
        .select('id')
        .eq('status', 'approved')
        .gte('autoScore', 85)
        .not('reviewedBy', 'is', null)

      const autoApprovalRate = approved > 0 && autoApproved
        ? Math.round((autoApproved.length / approved) * 100)
        : 0

      setStats({
        pending: pending || 0,
        pendingReview: pendingReview || 0,
        approved: approved || 0,
        rejected: rejected || 0,
        processedToday: processedToday || 0,
        approvalRate,
        autoApprovalRate,
        avgProcessingTime: 2.3 // Mock
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const filterAndSortDocuments = () => {
    let filtered = [...allDocuments]

    // Filter by tab
    if (activeTab === 'pending') {
      // En cours d'analyse automatique (pas encore de score)
      filtered = filtered.filter(doc => 
        doc.status === 'pending' && !doc.autoScore
      )
    } else if (activeTab === 'pending_review') {
      // Revues manuelles uniquement
      filtered = filtered.filter(doc => doc.status === 'pending_review')
    } else if (activeTab !== 'all') {
      filtered = filtered.filter(doc => doc.status === activeTab)
    }

    // Apply filters
    if (filters.country) {
      filtered = filtered.filter(doc => doc.user?.country === filters.country)
    }
    if (filters.documentType) {
      filtered = filtered.filter(doc => doc.documentType === filters.documentType)
    }
    if (filters.score) {
      const [min, max] = filters.score.split('-').map(Number)
      filtered = filtered.filter(doc => {
        const score = doc.autoScore || 0
        return score >= min && score <= max
      })
    }
    if (filters.date) {
      const dateFilter = new Date(filters.date)
      dateFilter.setHours(0, 0, 0, 0)
      filtered = filtered.filter(doc => {
        const docDate = new Date(doc.submittedAt || doc.createdAt)
        docDate.setHours(0, 0, 0, 0)
        return docDate.getTime() === dateFilter.getTime()
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt)
        case 'oldest':
          return new Date(a.submittedAt || a.createdAt) - new Date(b.submittedAt || b.createdAt)
        case 'scoreLow':
          return (a.autoScore || 0) - (b.autoScore || 0)
        case 'scoreHigh':
          return (b.autoScore || 0) - (a.autoScore || 0)
        default:
          return 0
      }
    })

    setDocuments(filtered)
  }

  const handleDocumentUpdate = () => {
    loadDocuments()
    loadStats()
    setSelectedDocument(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-solidarpay-text">Vérifications KYC</h1>
          <p className="text-solidarpay-text/70 mt-1">Surveillance des vérifications automatiques et revues manuelles</p>
        </div>
      </div>

      {/* Statistics */}
      <KYCStats stats={stats} />

      {/* Filters */}
      <KYCFilters
        filters={filters}
        setFilters={setFilters}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending_review" className="relative">
            ⏳ Revues Manuelles
            {stats.pendingReview > 0 && (
              <Badge className="ml-2 bg-red-500">
                {stats.pendingReview}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending">
            🔄 En Analyse
          </TabsTrigger>
          <TabsTrigger value="approved">
            ✅ Approuvées
          </TabsTrigger>
          <TabsTrigger value="rejected">
            ❌ Rejetées
          </TabsTrigger>
          <TabsTrigger value="all">
            📋 Toutes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending_review" className="mt-6">
          <ManualReviewTab 
            documents={documents}
            loading={loading}
            onExamine={(doc) => setSelectedDocument(doc)}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <DocumentGrid 
            documents={documents}
            loading={loading}
            onExamine={(doc) => setSelectedDocument(doc)}
          />
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <DocumentGrid 
            documents={documents}
            loading={loading}
            onExamine={(doc) => setSelectedDocument(doc)}
          />
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <DocumentGrid 
            documents={documents}
            loading={loading}
            onExamine={(doc) => setSelectedDocument(doc)}
          />
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <DocumentGrid 
            documents={documents}
            loading={loading}
            onExamine={(doc) => setSelectedDocument(doc)}
          />
        </TabsContent>
      </Tabs>

      {/* Exam Modal */}
      {selectedDocument && (
        <KYCExamModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onUpdate={handleDocumentUpdate}
        />
      )}
    </div>
  )
}

// Document Grid Component
function DocumentGrid({ documents, loading, onExamine }) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solidarpay-primary mx-auto"></div>
        <p className="mt-4 text-solidarpay-text/70">Chargement...</p>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="w-16 h-16 text-solidarpay-text/30 mb-4" />
          <h3 className="text-lg font-semibold text-solidarpay-text mb-2">
            Aucun document
          </h3>
          <p className="text-sm text-solidarpay-text/70">
            Aucun document trouvé avec les filtres sélectionnés
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map((doc) => (
        <KYCDocumentCard
          key={doc.id}
          document={doc}
          onExamine={() => onExamine(doc)}
        />
      ))}
    </div>
  )
}
