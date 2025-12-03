'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { analyseDocument, prendreDecision, calculerHashFichier } from '@/lib/kyc-automatic-verification'
import { logKYCSubmitted } from '@/lib/system-logger'
import { sendKYCApprovalEmail, sendKYCRejectionEmail, sendKYCNewDocumentEmail, sendKYCManualReviewEmail } from '@/lib/kyc-emails'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
const MAX_ATTEMPTS = 5

export default function UploadKYC({ user, onComplete }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)
  const { toast } = useToast()

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (selectedFile) => {
    // Validation du fichier
    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      toast({
        title: 'Type de fichier invalide',
        description: 'Veuillez télécharger un fichier JPG, PNG ou PDF',
        variant: 'destructive'
      })
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({
        title: 'Fichier trop volumineux',
        description: 'La taille maximale est de 5MB',
        variant: 'destructive'
      })
      return
    }

    setFile(selectedFile)

    // Créer preview
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      toast({
        title: 'Aucun fichier',
        description: 'Veuillez sélectionner un document',
        variant: 'destructive'
      })
      return
    }

    try {
      setUploading(true)
      setProgress(0)

      // Vérifier le nombre de tentatives
      const attempts = await checkAttempts()
      if (attempts >= MAX_ATTEMPTS) {
        toast({
          title: 'Limite de tentatives atteinte',
          description: 'Vous avez atteint la limite de 5 tentatives. Veuillez contacter le support.',
          variant: 'destructive'
        })
        setUploading(false)
        return
      }

      // Vérifier les doublons
      const fileHash = await calculerHashFichier(file)
      const isDuplicate = await checkDuplicateHash(fileHash)
      if (isDuplicate) {
        toast({
          title: 'Document déjà utilisé',
          description: 'Ce document a déjà été soumis. Veuillez utiliser un document différent.',
          variant: 'destructive'
        })
        setUploading(false)
        return
      }

      // Simuler l'upload progress
      const uploadInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(uploadInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Convertir le fichier en base64 pour le stockage
      const fileBase64 = await fileToBase64(file)

      // Analyser le document
      setProgress(50)
      const resultatAnalyse = await analyseDocument(file, user)
      
      setProgress(90)

      // Prendre une décision
      const decision = prendreDecision(resultatAnalyse)

      // Sauvegarder dans la base de données
      await saveKYCResult(file, fileBase64, fileHash, resultatAnalyse, decision, attempts + 1)

      setProgress(100)
      clearInterval(uploadInterval)

      // Appeler le callback avec le résultat
      if (onComplete) {
        onComplete({
          ...decision,
          resultatAnalyse,
          fileBase64
        })
      }

    } catch (error) {
      console.error('Error uploading KYC:', error)
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la vérification',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }

  const checkAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('id', { count: 'exact', head: true })
        .eq('userId', user.id)
      
      if (error) throw error
      return data?.length || 0
    } catch (error) {
      console.error('Error checking attempts:', error)
      return 0
    }
  }

  const checkDuplicateHash = async (hash) => {
    try {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('id', { count: 'exact', head: true })
        .eq('documentHash', hash)
        .neq('userId', user.id)
      
      if (error) throw error
      return (data?.length || 0) > 0
    } catch (error) {
      console.error('Error checking duplicate hash:', error)
      return false
    }
  }

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const saveKYCResult = async (file, fileBase64, hash, analyse, decision, attemptNumber) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      // Upload le fichier vers Supabase Storage ou stocker en base64
      const documentUrl = fileBase64 // En production, uploader vers Supabase Storage

      const { data, error } = await supabase
        .from('kyc_documents')
        .insert([{
          userId: user.id,
          documentType: analyse.typeDocument || 'identity',
          documentUrl,
          documentHash: hash,
          status: decision.statut,
          autoScore: analyse.score,
          analysisResults: analyse.checks,
          extractedInfo: {
            nomExtrait: analyse.nomExtrait,
            typeDocument: analyse.typeDocument
          },
          rejectionReason: decision.raisons?.join(', ') || null,
          submittedAt: new Date().toISOString(),
          metadata: {
            attemptNumber,
            tempsTraitement: analyse.tempsTraitement,
            fileSize: file.size,
            fileName: file.name
          }
        }])
        .select()
        .single()

      if (error) throw error
      
      const documentId = data.id

      // Logger l'événement système
      if (documentId) {
        await logKYCSubmitted(user.id, documentId)
      }

      // Envoyer la notification email appropriée
      await sendKYCEmailNotification(user, decision)
      
      return documentId
    } catch (error) {
      console.error('Error saving KYC result:', error)
      throw error
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vérification d'identité (KYC)</CardTitle>
        <CardDescription>
          Téléchargez votre pièce d'identité pour vérifier votre compte
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
            dragActive
              ? 'border-solidarpay-primary bg-solidarpay-bg'
              : 'border-solidarpay-border hover:border-solidarpay-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!file ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-solidarpay-bg flex items-center justify-center">
                <Upload className="w-8 h-8 text-solidarpay-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-solidarpay-text">
                  Téléchargez votre pièce d'identité
                </h3>
                <p className="text-sm text-solidarpay-text/70 mt-1">
                  Glissez-déposez votre fichier ici ou cliquez pour sélectionner
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Badge variant="outline">Carte d'identité nationale</Badge>
                <Badge variant="outline">Passeport</Badge>
                <Badge variant="outline">Permis de conduire</Badge>
              </div>
              <div className="text-xs text-solidarpay-text/70">
                Formats acceptés: JPG, PNG, PDF (max 5MB)
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
              >
                <Upload className="w-4 h-4 mr-2" />
                Sélectionner un fichier
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              {preview && (
                <div className="relative max-w-md mx-auto">
                  <img
                    src={preview}
                    alt="Document preview"
                    className="w-full h-auto rounded-lg border border-solidarpay-border"
                  />
                </div>
              )}
              <div className="flex items-center justify-between p-4 bg-solidarpay-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-solidarpay-primary" />
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-solidarpay-text/70">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setFile(null)
                    setPreview(null)
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-solidarpay-text/70">Analyse en cours...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-solidarpay-text/70 text-center">
              ⏳ Votre document est en cours de vérification automatique...
            </p>
          </div>
        )}

        {/* Submit Button */}
        {file && !uploading && (
          <Button
            onClick={handleSubmit}
            className="w-full bg-solidarpay-primary hover:bg-solidarpay-secondary"
            disabled={uploading}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Soumettre pour vérification
          </Button>
        )}

        {/* Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Conseils pour une vérification rapide :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Utilisez un bon éclairage naturel</li>
                <li>Placez le document à plat</li>
                <li>Assurez-vous que tous les textes sont visibles</li>
                <li>Le document ne doit pas être expiré</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

async function sendKYCEmailNotification(user, decision) {
  try {
    switch (decision.statut) {
      case 'approved':
        await sendKYCApprovalEmail(user.email, user.fullName)
        break
      case 'rejected':
      case 'new_document_required':
        await sendKYCRejectionEmail(
          user.email, 
          user.fullName, 
          decision.raisons?.join(', ') || 'Document non conforme',
          decision.actionRequise || ''
        )
        break
      case 'pending_review':
        await sendKYCManualReviewEmail(user.email, user.fullName)
        break
    }
  } catch (error) {
    console.error('Error sending email notification:', error)
  }
}

