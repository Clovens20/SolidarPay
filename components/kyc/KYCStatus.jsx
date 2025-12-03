'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  FileText,
  ShieldCheck,
  HelpCircle
} from 'lucide-react'

export default function KYCStatus({ userId, onUpload }) {
  const [kycStatus, setKycStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analysing, setAnalysing] = useState(false)

  useEffect(() => {
    loadKYCStatus()
    
    // Check for real-time updates (polling)
    const interval = setInterval(loadKYCStatus, 3000)
    return () => clearInterval(interval)
  }, [userId])

  const loadKYCStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setKycStatus(data)
        
        // Si en cours d'analyse, simuler le processus
        if (data.status === 'pending' && !analysing) {
          checkAnalysisStatus(data)
        }
      }
    } catch (error) {
      console.error('Error loading KYC status:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkAnalysisStatus = async (document) => {
    // Si le document vient d'être soumis et est en pending, simuler l'analyse
    const submittedTime = new Date(document.submittedAt || document.createdAt)
    const now = new Date()
    const secondsDiff = (now - submittedTime) / 1000

    // Si moins de 5 secondes depuis la soumission, simuler l'analyse
    if (secondsDiff < 5 && !document.autoScore) {
      setAnalysing(true)
      // L'analyse devrait déjà être en cours, attendre un peu
      setTimeout(() => {
        loadKYCStatus()
        setAnalysing(false)
      }, 3000)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solidarpay-primary mx-auto"></div>
            <p className="mt-4 text-solidarpay-text/70">Chargement du statut...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Aucun document soumis
  if (!kycStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-solidarpay-primary" />
            Vérification d'identité
          </CardTitle>
          <CardDescription>
            Vérifiez votre identité pour accéder à toutes les fonctionnalités
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-solidarpay-text/70 mb-4">
              Aucun document soumis. Commencez votre vérification maintenant.
            </p>
            {onUpload && (
              <Button
                onClick={onUpload}
                className="bg-solidarpay-primary hover:bg-solidarpay-secondary"
              >
                <FileText className="w-4 h-4 mr-2" />
                Soumettre un document
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // EN COURS D'ANALYSE
  if (kycStatus.status === 'pending' && !kycStatus.autoScore) {
    return (
      <Card className="border-solidarpay-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-solidarpay-primary animate-pulse" />
            Analyse en cours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-solidarpay-primary mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-solidarpay-text">
              Analyse de votre document en cours...
            </p>
            <p className="text-sm text-solidarpay-text/70 mt-2">
              Vous recevrez une réponse dans quelques instants
            </p>
          </div>
          <Progress value={66} className="h-2" />
          <p className="text-xs text-center text-solidarpay-text/70">
            Vérification automatique en cours...
          </p>
        </CardContent>
      </Card>
    )
  }

  // APPROUVÉ
  if (kycStatus.status === 'approved') {
    return (
      <Card className="border-green-300 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            Identité vérifiée
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-green-800 mb-2">
              Félicitations ! Votre identité est vérifiée
            </h3>
            <Badge className="bg-green-600 text-white">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Compte Vérifié
            </Badge>
          </div>
          <div className="p-4 bg-white rounded-lg border border-green-200">
            <p className="text-sm text-green-900">
              Vous pouvez maintenant rejoindre ou créer des tontines et profiter de toutes les fonctionnalités de SolidarPay.
            </p>
          </div>
          {kycStatus.autoScore && (
            <div className="text-center text-xs text-green-700">
              Score de vérification: {kycStatus.autoScore}%
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // REJETÉ
  if (kycStatus.status === 'rejected') {
    const raisons = kycStatus.rejectionReason?.split(',') || []
    const attempts = kycStatus.metadata?.attemptNumber || 1

    return (
      <Card className="border-red-300 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <XCircle className="w-5 h-5" />
            Vérification échouée
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-bold text-red-800 mb-2">
              Vérification non approuvée
            </h3>
            {attempts >= MAX_ATTEMPTS && (
              <Badge variant="destructive" className="mt-2">
                Limite de tentatives atteinte (5/5)
              </Badge>
            )}
          </div>

          {raisons.length > 0 && (
            <div className="p-4 bg-white rounded-lg border border-red-200">
              <p className="font-semibold text-sm text-red-900 mb-2">Raisons :</p>
              <ul className="space-y-1">
                {raisons.map((raison, index) => (
                  <li key={index} className="text-sm text-red-800 flex items-start gap-2">
                    <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{raison.trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {attempts < MAX_ATTEMPTS ? (
            <Button
              onClick={onUpload}
              variant="outline"
              className="w-full border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Soumettre un nouveau document ({attempts}/{MAX_ATTEMPTS})
            </Button>
          ) : (
            <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-900">
                  <p className="font-semibold mb-1">Trop de tentatives</p>
                  <p>Vous avez atteint la limite. Veuillez contacter le support pour obtenir de l'aide.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // NOUVEAU DOCUMENT REQUIS
  if (kycStatus.status === 'new_document_required') {
    const attempts = kycStatus.metadata?.attemptNumber || 1

    return (
      <Card className="border-orange-300 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <RefreshCw className="w-5 h-5" />
            Nouveau document requis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <div className="text-6xl mb-4">🔄</div>
            <h3 className="text-xl font-bold text-orange-800 mb-2">
              Qualité insuffisante
            </h3>
          </div>

          <div className="p-4 bg-white rounded-lg border border-orange-200">
            <p className="font-semibold text-sm text-orange-900 mb-2">Conseils :</p>
            <ul className="space-y-2 text-sm text-orange-800">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Utilisez un bon éclairage naturel</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Placez le document à plat</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Assurez-vous que tous les textes sont nets</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Évitez les reflets et ombres</span>
              </li>
            </ul>
          </div>

          <Button
            onClick={onUpload}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Prendre une nouvelle photo
          </Button>

          <Button
            variant="outline"
            className="w-full"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Besoin d'aide ?
          </Button>
        </CardContent>
      </Card>
    )
  }

  // REVUE MANUELLE
  if (kycStatus.status === 'pending_review') {
    return (
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Clock className="w-5 h-5" />
            Vérification approfondie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-xl font-bold text-blue-800 mb-2">
              Vérification approfondie en cours
            </h3>
          </div>

          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 mb-2">
              Un administrateur examinera votre document sous 24-48h.
            </p>
            <p className="text-sm text-blue-900">
              Vous recevrez une notification par email dès qu'une décision sera prise.
            </p>
          </div>

          {kycStatus.autoScore && (
            <div className="text-center">
              <Badge variant="outline" className="bg-blue-100">
                Score automatique: {kycStatus.autoScore}%
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return null
}

const MAX_ATTEMPTS = 5

