/**
 * SYSTÈME DE VÉRIFICATION KYC AUTOMATIQUE
 * Analyse et décision automatique des documents d'identité
 */

/**
 * Analyse un document d'identité
 * @param {File} file - Fichier du document
 * @param {Object} userData - Données de l'utilisateur
 * @returns {Promise<Object>} Résultat de l'analyse
 */
export async function analyseDocument(file, userData) {
  let score = 0
  let checks = {
    qualiteImage: false,
    visageDetecte: false,
    texteLisible: false,
    documentExpire: false,
    nomCorrespond: false,
    typeDocumentValide: false
  }
  let raisons = []
  
  // Simuler un délai de traitement (2-5 secondes)
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))

  // 1. VÉRIFICATION QUALITÉ IMAGE
  if (file.size > 100000 && file.size < 5000000) {
    checks.qualiteImage = true
    score += 15
  } else {
    raisons.push("Image de mauvaise qualité ou taille incorrecte")
  }

  // 2. DÉTECTION DE VISAGE
  // Simuler: 80% de chance de succès
  if (Math.random() > 0.2) {
    checks.visageDetecte = true
    score += 20
  } else {
    raisons.push("Aucun visage détecté sur le document")
  }

  // 3. EXTRACTION DE TEXTE (OCR - simulé pour MVP, prêt pour vraie API)
  const extractionOCR = await extraireTexteCompletOCR(file)
  const nomExtrait = extractionOCR.nom || simulerOCR(file)
  const texteComplet = extractionOCR.texteComplet || ''
  const nomUser = (userData.fullName || userData.nom || '').toLowerCase().trim()
  
  if (nomExtrait && nomExtrait.length > 3) {
    checks.texteLisible = true
    score += 15
    
    // 4. COMPARAISON DES NOMS
    const similarite = calculerSimilarite(nomExtrait, nomUser)
    if (similarite > 0.7) {
      checks.nomCorrespond = true
      score += 25
    } else {
      raisons.push(`Nom du document (${nomExtrait}) ne correspond pas au nom inscrit (${nomUser})`)
    }
  } else {
    raisons.push("Texte illisible ou document de mauvaise qualité")
  }

  // 5. VÉRIFICATION TYPE DE DOCUMENT (Détection automatique améliorée)
  const detectionType = await detecterTypeDocument(file)
  const typeDetecte = detectionType.type
  
  if (['passport', 'id_card', 'drivers_license'].includes(typeDetecte)) {
    checks.typeDocumentValide = true
    
    // Bonus de score basé sur la confiance de la détection
    const bonusConfiance = Math.round(detectionType.confidence * 20)
    score += 10 + bonusConfiance
    
    // Si la confiance est très élevée, on peut être sûr du type
    if (detectionType.confidence > 0.8) {
      score += 5
    }
  } else {
    raisons.push(`Type de document non reconnu (confiance: ${Math.round(detectionType.confidence * 100)}%)`)
  }

  // 6. VÉRIFICATION DATE D'EXPIRATION
  // Simuler: 90% de chance que le document soit valide
  if (Math.random() > 0.1) {
    checks.documentExpire = false
    score += 10
  } else {
    checks.documentExpire = true
    raisons.push("Le document semble être expiré")
  }

  const tempsTraitement = (2 + Math.random() * 3).toFixed(1)

  return {
    score: Math.min(100, Math.round(score)),
    checks,
    raisons,
    nomExtrait: nomExtrait || nomUser,
    typeDocument: typeDetecte,
    typeDocumentConfidence: detectionType.confidence,
    typeDocumentDetails: detectionType.details,
    tempsTraitement: `${tempsTraitement}s`
  }
}

/**
 * Calcule la similarité entre deux chaînes
 */
function calculerSimilarite(str1, str2) {
  if (!str1 || !str2) return 0
  
  str1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '')
  str2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '')
  
  if (str1 === str2) return 1.0
  
  let matches = 0
  const minLength = Math.min(str1.length, str2.length)
  
  for (let i = 0; i < minLength; i++) {
    if (str1[i] === str2[i]) matches++
  }
  
  // Vérifier aussi si un nom contient l'autre
  if (str1.includes(str2) || str2.includes(str1)) {
    return Math.max(0.7, matches / Math.max(str1.length, str2.length))
  }
  
  return matches / Math.max(str1.length, str2.length)
}

/**
 * Extraire le texte complet du document avec OCR
 * Cette fonction peut être facilement remplacée par une vraie API OCR
 * @param {File} file - Fichier du document
 * @returns {Promise<Object>} Texte extrait avec informations structurées
 */
async function extraireTexteCompletOCR(file) {
  // TODO: Intégrer une vraie API OCR ici
  // Options possibles:
  // - Google Cloud Vision API
  // - AWS Textract
  // - Microsoft Azure Computer Vision
  // - Tesseract.js (client-side)
  
  // Pour l'instant, simulation intelligente
  const fileName = file.name.toLowerCase()
  
  // Retourner une structure qui simule une vraie extraction OCR
  return {
    texteComplet: await extraireTexteOCR(file), // Texte brut extrait
    nom: null, // Sera extrait du texte complet dans une vraie implémentation
    prenom: null,
    dateNaissance: null,
    numeroDocument: null,
    dateExpiration: null,
    confiance: 0.85, // Score de confiance de l'OCR
    languesDetectees: ['fr', 'en']
  }
}

/**
 * Simule l'extraction OCR d'un nom (fonction de fallback)
 */
function simulerOCR(file) {
  // Simuler extraction de nom basée sur le nom de fichier ou données utilisateur
  // En production, ceci serait extrait du texte OCR complet
  const noms = [
    "Jean Dupont",
    "Marie Martin",
    "Pierre Dubois",
    "Sophie Bernard",
    "Luc Tremblay"
  ]
  
  // Essayer d'extraire du nom de fichier
  const fileName = file.name.toLowerCase()
  if (fileName.includes('id') || fileName.includes('passport') || fileName.includes('permis')) {
    // Retourner un nom réaliste
    return noms[Math.floor(Math.random() * noms.length)]
  }
  
  return noms[Math.floor(Math.random() * noms.length)]
}

/**
 * EXEMPLE D'INTÉGRATION AVEC UNE VRAIE API OCR
 * Cette fonction montre comment intégrer Google Cloud Vision API
 * 
 * async function extraireTexteCompletOCR(file) {
 *   try {
 *     // Convertir le fichier en base64
 *     const base64Image = await fileToBase64(file)
 *     
 *     // Appeler Google Cloud Vision API
 *     const response = await fetch('https://vision.googleapis.com/v1/images:annotate?key=YOUR_API_KEY', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({
 *         requests: [{
 *           image: { content: base64Image.split(',')[1] },
 *           features: [{ type: 'TEXT_DETECTION' }]
 *         }]
 *       })
 *     })
 *     
 *     const data = await response.json()
 *     const texteComplet = data.responses[0]?.fullTextAnnotation?.text || ''
 *     
 *     // Parser le texte pour extraire les informations structurées
 *     return {
 *       texteComplet,
 *       nom: extraireNom(texteComplet),
 *       prenom: extrairePrenom(texteComplet),
 *       dateNaissance: extraireDateNaissance(texteComplet),
 *       numeroDocument: extraireNumeroDocument(texteComplet),
 *       dateExpiration: extraireDateExpiration(texteComplet),
 *       confiance: data.responses[0]?.textAnnotations?.[0]?.confidence || 0.8,
 *       languesDetectees: detecterLangues(texteComplet)
 *     }
 *   } catch (error) {
 *     console.error('Erreur OCR:', error)
 *     // Fallback sur simulation
 *     return extraireTexteCompletOCR_Fallback(file)
 *   }
 * }
 */

/**
 * Détecte automatiquement le type de document en analysant son contenu
 * @param {File} file - Fichier du document
 * @returns {Promise<Object>} Type détecté avec score de confiance
 */
async function detecterTypeDocument(file) {
  // Analyser le nom de fichier d'abord (indice rapide)
  const fileName = file.name.toLowerCase()
  const fileNameIndices = analyserNomFichier(fileName)
  
  // Analyser les dimensions et le format de l'image
  const dimensionsAnalyse = await analyserDimensionsDocument(file)
  
  // Extraire le texte du document avec OCR
  const texteExtrait = await extraireTexteOCR(file)
  
  // Analyser le texte pour détecter des patterns spécifiques
  const patternsDetectes = analyserPatternsDocument(texteExtrait)
  
  // Calculer les scores pour chaque type de document
  const scores = {
    passport: 0,
    id_card: 0,
    drivers_license: 0
  }
  
  // Score basé sur le nom de fichier
  scores.passport += fileNameIndices.passport ? 20 : 0
  scores.id_card += fileNameIndices.id_card ? 20 : 0
  scores.drivers_license += fileNameIndices.drivers_license ? 20 : 0
  
  // Score basé sur les dimensions
  if (dimensionsAnalyse.isPassportFormat) scores.passport += 30
  if (dimensionsAnalyse.isCardFormat) {
    scores.id_card += 15
    scores.drivers_license += 15
  }
  
  // Score basé sur les patterns de texte détectés
  scores.passport += patternsDetectes.passport * 40
  scores.id_card += patternsDetectes.id_card * 40
  scores.drivers_license += patternsDetectes.drivers_license * 40
  
  // Déterminer le type avec le score le plus élevé
  let typeDetecte = 'id_card' // Par défaut
  let scoreMax = scores.id_card
  
  if (scores.passport > scoreMax) {
    typeDetecte = 'passport'
    scoreMax = scores.passport
  }
  if (scores.drivers_license > scoreMax) {
    typeDetecte = 'drivers_license'
    scoreMax = scores.drivers_license
  }
  
  // Si le score est trop bas (< 30), on considère comme non détecté
  if (scoreMax < 30) {
    return {
      type: 'unknown',
      confidence: scoreMax / 100,
      scores: scores
    }
  }
  
  return {
    type: typeDetecte,
    confidence: Math.min(100, scoreMax) / 100,
    scores: scores,
    details: {
      fileNameIndices,
      dimensionsAnalyse,
      patternsDetectes
    }
  }
}

/**
 * Analyse le nom de fichier pour des indices sur le type de document
 */
function analyserNomFichier(fileName) {
  return {
    passport: fileName.includes('passport') || 
              fileName.includes('passeport') ||
              fileName.includes('pass') ||
              fileName.includes('pa-'),
    id_card: fileName.includes('id') || 
             fileName.includes('carte') || 
             fileName.includes('identite') ||
             fileName.includes('identity') ||
             fileName.includes('cni') ||
             fileName.includes('national'),
    drivers_license: fileName.includes('permis') || 
                     fileName.includes('license') || 
                     fileName.includes('driving') ||
                     fileName.includes('driver') ||
                     fileName.includes('dl-') ||
                     fileName.includes('conduire')
  }
}

/**
 * Analyse les dimensions et le format du document
 */
async function analyserDimensionsDocument(file) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({
        isPassportFormat: false,
        isCardFormat: false,
        ratio: 1,
        width: 0,
        height: 0
      })
      return
    }
    
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      const width = img.width
      const height = img.height
      const ratio = width / height
      
      URL.revokeObjectURL(url)
      
      // Passeport: format rectangulaire (ratio ~1.42), dimensions ~125x88mm ou similaire
      // Format typique: largeur ~2x la hauteur (ratio ~1.4-1.6)
      const isPassportFormat = ratio >= 1.3 && ratio <= 1.7 && width > height
      
      // Carte d'identité/Permis: format carte (ratio ~1.586), dimensions ~85.6x53.98mm
      // Format typique: largeur ~1.5x la hauteur (ratio ~1.5-1.6)
      const isCardFormat = ratio >= 1.4 && ratio <= 1.7 && width > height && !isPassportFormat
      
      resolve({
        isPassportFormat,
        isCardFormat,
        ratio,
        width,
        height
      })
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({
        isPassportFormat: false,
        isCardFormat: false,
        ratio: 1,
        width: 0,
        height: 0
      })
    }
    
    img.src = url
  })
}

/**
 * Extraire le texte du document avec OCR (simulé pour l'instant)
 * En production, intégrer une vraie API OCR (Google Vision, AWS Textract, etc.)
 */
async function extraireTexteOCR(file) {
  // Pour l'instant, simulation basée sur le nom de fichier
  // En production, utiliser une vraie API OCR qui retourne le texte extrait
  
  const fileName = file.name.toLowerCase()
  let texteExtrait = fileName
  
  // Simuler l'extraction de texte courant dans les documents
  // Dans un vrai système, ceci viendrait de l'API OCR
  const textesSimules = {
    passport: [
      'PASSPORT',
      'PASSEPORT',
      'REPUBLIQUE',
      'REPUBLIC',
      'P',
      'TYPE',
      'MRZ', // Machine Readable Zone
      '<',
      'DATE OF BIRTH',
      'DATE DE NAISSANCE'
    ],
    id_card: [
      'IDENTITE',
      'IDENTITY',
      'REPUBLIQUE',
      'REPUBLIC',
      'CARTE NATIONALE',
      'NATIONAL IDENTITY',
      'N°',
      'NUMERO',
      'NUMBER',
      'DATE DE NAISSANCE',
      'DATE OF BIRTH'
    ],
    drivers_license: [
      'PERMIS',
      'LICENSE',
      'CONDUITE',
      'DRIVING',
      'CATEGORIE',
      'CATEGORY',
      'VEHICULES',
      'VEHICLES',
      'A1', 'A', 'B', 'C', 'D', 'E',
      'DATE DE DELIVRANCE',
      'DATE OF ISSUE',
      'VALID',
      'VALIDE'
    ]
  }
  
  // Ajouter des textes simulés selon le type supposé
  if (fileName.includes('passport')) {
    texteExtrait += ' ' + textesSimules.passport.join(' ')
  } else if (fileName.includes('permis') || fileName.includes('license')) {
    texteExtrait += ' ' + textesSimules.drivers_license.join(' ')
  } else {
    texteExtrait += ' ' + textesSimules.id_card.join(' ')
  }
  
  // TODO: Remplacer par un vrai appel OCR:
  // return await appelerAPIOCR(file)
  
  return texteExtrait.toUpperCase()
}

/**
 * Analyse les patterns de texte pour identifier le type de document
 */
function analyserPatternsDocument(texte) {
  const texteUpper = texte.toUpperCase()
  let patterns = {
    passport: 0,
    id_card: 0,
    drivers_license: 0
  }
  
  // Patterns pour PASSEPORT
  const patternsPassport = [
    /PASSPORT|PASSEPORT/,
    /TYPE\s*P/,
    /MRZ/,
    /MACHINE\s*READABLE/,
    /NATIONALITY|NATIONALITE/,
    /PLACE OF BIRTH|LIEU DE NAISSANCE/,
    /AUTHORITY|AUTORITE/,
    /<\s*<\s*</, // Pattern MRZ
    /P\s*[A-Z]{3}/, // Code pays dans MRZ
  ]
  
  patternsPassport.forEach(pattern => {
    if (pattern.test(texteUpper)) {
      patterns.passport += 0.2
    }
  })
  
  // Patterns pour CARTE D'IDENTITÉ
  const patternsIdCard = [
    /IDENTITE|IDENTITY/,
    /CARTE\s*NATIONALE|NATIONAL\s*IDENTITY/,
    /CNI|C\.N\.I\./,
    /REPUBLIQUE|REPUBLIC/,
    /N°\s*\d+|NUMERO\s*\d+/,
    /NUMBER\s*\d+/,
    /NATURALISATION|NATURALIZATION/,
    /TITRE\s*DE\s*SEJOUR|RESIDENCE\s*PERMIT/,
  ]
  
  patternsIdCard.forEach(pattern => {
    if (pattern.test(texteUpper)) {
      patterns.id_card += 0.15
    }
  })
  
  // Patterns pour PERMIS DE CONDUIRE
  const patternsLicense = [
    /PERMIS|LICENSE|LICENCE/,
    /CONDUITE|DRIVING/,
    /CATEGORIE|CATEGORY/,
    /VEHICULES|VEHICLES/,
    /\b(A1|A|B|C|D|E|F|G)\b/,
    /VALID\s*UNTIL|VALIDE\s*JUSQU|VALID\s*TO/,
    /DATE\s*DE\s*DELIVRANCE|DATE\s*OF\s*ISSUE/,
    /RESTRICTIONS/,
    /ENDORSEMENTS/,
  ]
  
  patternsLicense.forEach(pattern => {
    if (pattern.test(texteUpper)) {
      patterns.drivers_license += 0.2
    }
  })
  
  // Normaliser les scores entre 0 et 1
  Object.keys(patterns).forEach(key => {
    patterns[key] = Math.min(1, patterns[key])
  })
  
  return patterns
}

/**
 * Prend une décision automatique basée sur le résultat de l'analyse
 * @param {Object} resultatAnalyse - Résultat de l'analyse
 * @returns {Object} Décision et statut
 */
export function prendreDecision(resultatAnalyse) {
  const { score, raisons, checks } = resultatAnalyse

  // RÈGLE 1: APPROBATION AUTOMATIQUE
  if (score >= 85 && checks.nomCorrespond && checks.visageDetecte) {
    return {
      decision: 'APPROUVE',
      statut: 'approved',
      message: "Félicitations ! Votre identité a été vérifiée avec succès.",
      emoji: "✅",
      couleur: "green"
    }
  }

  // RÈGLE 2: REJET AUTOMATIQUE (Critique)
  if (score < 50 || checks.documentExpire || !checks.visageDetecte) {
    return {
      decision: 'REJETE',
      statut: 'rejected',
      message: "Votre document n'a pas pu être vérifié.",
      raisons,
      emoji: "❌",
      couleur: "red",
      actionRequise: "Veuillez soumettre un nouveau document en respectant les critères suivants :\n" +
                      "- Photo claire et nette\n" +
                      "- Document non expiré\n" +
                      "- Tous les textes visibles\n" +
                      "- Bonne luminosité"
    }
  }

  // RÈGLE 3: REVUE MANUELLE (cas ambigus)
  if (score >= 50 && score < 85) {
    return {
      decision: 'EN_ATTENTE',
      statut: 'pending_review',
      message: "Votre document est en cours de vérification approfondie.",
      emoji: "⏳",
      couleur: "orange",
      delai: "Réponse dans les 24-48h"
    }
  }

  // RÈGLE 4: REJET DOUX (qualité insuffisante mais réessai possible)
  return {
    decision: 'REJETE_DOUX',
    statut: 'new_document_required',
    message: "La qualité de votre document est insuffisante.",
    raisons,
    emoji: "🔄",
    couleur: "orange",
    actionRequise: "Veuillez prendre une nouvelle photo en suivant ces conseils :\n" +
                    "- Utilisez un bon éclairage\n" +
                    "- Placez le document à plat\n" +
                    "- Assurez-vous que tous les textes sont nets"
  }
}

/**
 * Calcule le hash d'un fichier pour détecter les doublons
 */
export async function calculerHashFichier(file) {
  // Simuler le calcul de hash
  // En production, utiliser crypto.subtle.digest
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      // Hash simple pour le MVP
      const hash = btoa(reader.result).substring(0, 32)
      resolve(hash)
    }
    reader.readAsArrayBuffer(file)
  })
}

