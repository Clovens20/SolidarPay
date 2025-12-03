'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  User,
  Calendar,
  FileText,
  ShieldCheck
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { sendKYCApprovalEmail, sendKYCRejectionEmail, sendKYCNewDocumentEmail } from '@/lib/kyc-emails'
import { logKYCApproved, logKYCRejected, logKYCRequested } from '@/lib/system-logger'

const REJECTION_REASONS = [
  'Document illisible ou de mauvaise qualité',
  'Document expiré',
  'Informations ne correspondent pas',
  'Type de document non accepté',
  'Photo floue ou incomplète',
  'Document frauduleux suspecté'
]

export default function KYCExamModal({ document, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [actionMode, setActionMode] = useState(null) // 'approve', 'reject', 'request'
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectionComment, setRejectionComment] = useState('')
  const [requestReason, setRequestReason] = useState('')
  const [requestInstructions, setRequestInstructions] = useState('')
  const [history, setHistory] = useState([])
  const { toast } = useToast()

  useEffect(() => {
    if (document) {
      loadHistory()
    }
  }, [document])

  const loadHistory = async () => {
    if (!document?.user?.id) return

    try {
      const { data } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('userId', document.user.id)
        .order('createdAt', { ascending: false })

      setHistory(data || [])
    } catch (error) {
      console.error('Error loading history:', error)
    }
  }

  const score = document.autoScore || calculateMockScore(document)
  const user = document.user || {}

  // Mock automatic analysis results
  const analysisResults = {
    faceDetected: score > 70,
    qualitySufficient: score > 60,
    textReadable: score > 50,
    notExpired: true,
    nameMatches: score > 75
  }

  const extractedInfo = {
    name: user.fullName || 'Non détecté',
    birthDate: '01/01/1990', // Mock
    documentNumber: 'XXX-XXX-XXX', // Mock
    expiryDate: '31/12/2030', // Mock
    issueCountry: user.country || 'CA' // Mock
  }

  const handleApprove = async () => {
    try {
      setLoading(true)
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('kyc_documents')
        .update({
          status: 'approved',
          reviewedBy: currentUser.id,
          reviewedAt: new Date().toISOString()
        })
        .eq('id', document.id)

      if (error) throw error

      // Send notification email
      await sendKYCApprovalEmail(user.email, user.fullName)

      // Log system event
      await logKYCApproved(user.id, document.id, currentUser.id)

      toast({
        title: 'Document approuvé',
        description: `${user.fullName} a été notifié par email`
      })

      onUpdate()
    } catch (error) {
      console.error('Error approving:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'approuver le document',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason) {
      toast({
        title: 'Raison requise',
        description: 'Veuillez sélectionner une raison de rejet',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('kyc_documents')
        .update({
          status: 'rejected',
          reviewedBy: currentUser.id,
          reviewedAt: new Date().toISOString(),
          rejectionReason: rejectionComment ? `${rejectionReason}: ${rejectionComment}` : rejectionReason
        })
        .eq('id', document.id)

      if (error) throw error

      // Send notification email
      await sendKYCRejectionEmail(user.email, user.fullName, rejectionReason, rejectionComment)

      // Log system event
      await logKYCRejected(user.id, document.id, currentUser.id, rejectionReason)

      toast({
        title: 'Document rejeté',
        description: `${user.fullName} a été notifié par email`
      })

      onUpdate()
    } catch (error) {
      console.error('Error rejecting:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de rejeter le document',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRequestNew = async () => {
    if (!requestReason) {
      toast({
        title: 'Raison requise',
        description: 'Veuillez sélectionner une raison',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      // Update status to pending with a special flag
      const { error } = await supabase
        .from('kyc_documents')
        .update({
          status: 'pending',
          rejectionReason: `Nouveau document requis: ${requestReason}. ${requestInstructions || ''}`
        })
        .eq('id', document.id)

      if (error) throw error

      // Send notification email
      await sendKYCNewDocumentEmail(user.email, user.fullName, requestReason, requestInstructions)

      // Log system event
      await logKYCRequested(user.id, document.id, currentUser.id, requestReason)

      toast({
        title: 'Demande envoyée',
        description: `${user.fullName} a été notifié par email`
      })

      onUpdate()
    } catch (error) {
      console.error('Error requesting new document:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer la demande',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getCountryFlag = (countryCode) => {
    const flags = { 'CA': '🇨🇦', 'FR': '🇫🇷', 'BE': '🇧🇪', 'CH': '🇨🇭', 'US': '🇺🇸' }
    return flags[countryCode] || '🌍'
  }

  const rejectionCount = history.filter(d => d.status === 'rejected').length
  const canQuickApprove = score > 95 && Object.values(analysisResults).every(v => v === true)

  return (
    <Dialog open={!!document} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Examen du document KYC</DialogTitle>
          <DialogDescription>
            Document soumis par {user.fullName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-12 gap-6">
          {/* Section 1: Member Info (Left - 3 columns) */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations du membre</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-solidarpay-primary flex items-center justify-center text-white text-2xl font-semibold">
                    {user.fullName?.charAt(0)?.toUpperCase() || <User className="w-10 h-10" />}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-solidarpay-text/70">Nom complet</p>
                    <p className="font-semibold">{user.fullName}</p>
                  </div>
                  <div>
                    <p className="text-solidarpay-text/70">Email</p>
                    <p className="font-semibold">{user.email}</p>
                  </div>
                  {user.phone && (
                    <div>
                      <p className="text-solidarpay-text/70">Téléphone</p>
                      <p className="font-semibold">{user.phone}</p>
                    </div>
                  )}
                  {user.country && (
                    <div>
                      <p className="text-solidarpay-text/70">Pays</p>
                      <p className="font-semibold flex items-center gap-1">
                        {getCountryFlag(user.country)} {user.country}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-solidarpay-text/70">Date d'inscription</p>
                    <p className="font-semibold">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-solidarpay-text/70">Type de compte</p>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? 'Admin Tontine' : 'Membre'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 2: Document (Center - 6 columns) */}
          <div className="col-span-12 lg:col-span-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Document</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Document Controls */}
                <div className="flex items-center justify-between">
                  <Badge>
                    {document.documentType === 'identity' ? 'Pièce d\'identité' :
                     document.documentType === 'proof_of_address' ? 'Justificatif de domicile' :
                     'Selfie'}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm">{Math.round(zoom * 100)}%</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRotation((rotation + 90) % 360)}
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFullscreen(!fullscreen)}
                    >
                      <Maximize className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Document Image */}
                <div 
                  className={`relative bg-gray-100 rounded-lg overflow-hidden ${fullscreen ? 'fixed inset-4 z-50' : ''}`}
                  style={{ aspectRatio: '4/3' }}
                >
                  <img
                    src={document.documentUrl}
                    alt="Document KYC"
                    className="w-full h-full object-contain"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: 'transform 0.3s'
                    }}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999"%3EDocument non disponible%3C/text%3E%3C/svg%3E'
                    }}
                  />
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = document.documentUrl
                    link.download = `document_${document.id}.pdf`
                    link.click()
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger l'original
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Section 3: Analysis (Right - 3 columns) */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analyse automatique</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Score */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Score global</span>
                    <span className="text-lg font-bold text-solidarpay-primary">{score}%</span>
                  </div>
                  <div className="relative w-full h-24">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="40%"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="40%"
                        fill="none"
                        stroke={score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 40 * (score / 100)} ${2 * Math.PI * 40}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{score}%</span>
                    </div>
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Vérifications automatiques:</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      {analysisResults.faceDetected ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span>Visage détecté</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {analysisResults.qualitySufficient ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span>Qualité suffisante</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {analysisResults.textReadable ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span>Texte lisible</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {analysisResults.notExpired ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span>Document non expiré</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {analysisResults.nameMatches ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : score > 50 ? (
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span>Nom correspond</span>
                    </div>
                  </div>
                </div>

                {/* Extracted Info */}
                <div className="space-y-2 pt-4 border-t">
                  <p className="text-sm font-medium">Informations extraites:</p>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-solidarpay-text/70">Nom:</span>{' '}
                      <span className="font-semibold">{extractedInfo.name}</span>
                    </div>
                    <div>
                      <span className="text-solidarpay-text/70">Date de naissance:</span>{' '}
                      <span className="font-semibold">{extractedInfo.birthDate}</span>
                    </div>
                    <div>
                      <span className="text-solidarpay-text/70">N° document:</span>{' '}
                      <span className="font-semibold">{extractedInfo.documentNumber}</span>
                    </div>
                    <div>
                      <span className="text-solidarpay-text/70">Date d'expiration:</span>{' '}
                      <span className="font-semibold">{extractedInfo.expiryDate}</span>
                    </div>
                    <div>
                      <span className="text-solidarpay-text/70">Pays d'émission:</span>{' '}
                      <span className="font-semibold">{extractedInfo.issueCountry}</span>
                    </div>
                  </div>
                </div>

                {/* Comparison */}
                <div className="space-y-2 pt-4 border-t">
                  <p className="text-sm font-medium">Comparaison avec l'inscription:</p>
                  <div className="p-2 bg-gray-50 rounded text-xs">
                    <div className="flex items-center justify-between">
                      <span>Nom inscrit:</span>
                      <span className="font-semibold">{user.fullName}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span>Nom du document:</span>
                      <span className={`font-semibold ${extractedInfo.name !== user.fullName ? 'text-orange-600' : ''}`}>
                        {extractedInfo.name}
                      </span>
                    </div>
                    {extractedInfo.name !== user.fullName && (
                      <Badge variant="destructive" className="mt-2 w-full justify-center">
                        Incohérence détectée
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Decision Zone */}
        <div className="col-span-12 space-y-4 pt-4 border-t">
          {/* Alerts */}
          {rejectionCount >= 3 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">
                  Ce compte a déjà été rejeté {rejectionCount} fois
                </span>
              </div>
            </div>
          )}

          {canQuickApprove && (
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approbation rapide (1 clic)
            </Button>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Approve */}
            <Button
              onClick={() => setActionMode('approve')}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approuver
            </Button>

            {/* Reject */}
            <Button
              onClick={() => setActionMode('reject')}
              disabled={loading}
              variant="destructive"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Rejeter
            </Button>

            {/* Request New */}
            <Button
              onClick={() => setActionMode('request')}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Demander nouveau document
            </Button>
          </div>

          {/* Action Forms */}
          {actionMode === 'approve' && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <p className="mb-4 font-semibold">
                  Approuver le document de {user.fullName} ?
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleApprove}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? 'Traitement...' : 'Confirmer l\'approbation'}
                  </Button>
                  <Button variant="outline" onClick={() => setActionMode(null)}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {actionMode === 'reject' && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label>Raison du rejet *</Label>
                  <Select value={rejectionReason} onValueChange={setRejectionReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une raison" />
                    </SelectTrigger>
                    <SelectContent>
                      {REJECTION_REASONS.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Commentaire additionnel (optionnel)</Label>
                  <Textarea
                    value={rejectionComment}
                    onChange={(e) => setRejectionComment(e.target.value)}
                    placeholder="Ajoutez des détails..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleReject}
                    disabled={loading || !rejectionReason}
                    variant="destructive"
                  >
                    {loading ? 'Traitement...' : 'Confirmer le rejet'}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setActionMode(null)
                    setRejectionReason('')
                    setRejectionComment('')
                  }}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {actionMode === 'request' && (
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label>Raison *</Label>
                  <Select value={requestReason} onValueChange={setRequestReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une raison" />
                    </SelectTrigger>
                    <SelectContent>
                      {REJECTION_REASONS.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Instructions spécifiques</Label>
                  <Textarea
                    value={requestInstructions}
                    onChange={(e) => setRequestInstructions(e.target.value)}
                    placeholder="Ex: Veuillez soumettre une photo plus claire en pleine lumière"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleRequestNew}
                    disabled={loading || !requestReason}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {loading ? 'Traitement...' : 'Envoyer la demande'}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setActionMode(null)
                    setRequestReason('')
                    setRequestInstructions('')
                  }}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* History Tab */}
        {history.length > 1 && (
          <div className="col-span-12 pt-4 border-t">
            <Tabs defaultValue="current">
              <TabsList>
                <TabsTrigger value="current">Document actuel</TabsTrigger>
                <TabsTrigger value="history">Historique</TabsTrigger>
              </TabsList>
              <TabsContent value="history" className="mt-4">
                <div className="space-y-4">
                  {history.map((doc, index) => (
                    <Card key={doc.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={doc.status === 'approved' ? 'default' : doc.status === 'rejected' ? 'destructive' : 'secondary'}>
                                {doc.status === 'approved' ? 'Approuvé' : doc.status === 'rejected' ? 'Rejeté' : 'En attente'}
                              </Badge>
                              <span className="text-sm text-solidarpay-text/70">
                                {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            {doc.rejectionReason && (
                              <p className="text-sm text-solidarpay-text/70">
                                Raison: {doc.rejectionReason}
                              </p>
                            )}
                          </div>
                          <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden">
                            <img
                              src={doc.documentUrl}
                              alt="Previous document"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function calculateMockScore(doc) {
  let score = 50
  if (doc.status === 'approved') score = 85 + Math.random() * 15
  if (doc.status === 'rejected') score = Math.random() * 50
  if (doc.documentUrl) score += 20
  return Math.round(Math.min(100, Math.max(0, score)))
}

