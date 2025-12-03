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

  // 3. EXTRACTION DE TEXTE (OCR simulé)
  const nomExtrait = simulerOCR(file)
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

  // 5. VÉRIFICATION TYPE DE DOCUMENT
  const typeDetecte = detecterTypeDocument(file)
  if (['passport', 'id_card', 'drivers_license'].includes(typeDetecte)) {
    checks.typeDocumentValide = true
    score += 15
  } else {
    raisons.push("Type de document non reconnu")
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
 * Simule l'extraction OCR d'un nom
 */
function simulerOCR(file) {
  // Simuler extraction de nom basée sur le nom de fichier ou données utilisateur
  // En production, utiliser une vraie API OCR
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
 * Détecte le type de document
 */
function detecterTypeDocument(file) {
  const fileName = file.name.toLowerCase()
  const fileType = file.type
  
  if (fileName.includes('passport') || fileName.includes('passeport')) {
    return 'passport'
  }
  if (fileName.includes('id') || fileName.includes('carte') || fileName.includes('identite')) {
    return 'id_card'
  }
  if (fileName.includes('permis') || fileName.includes('license') || fileName.includes('driving')) {
    return 'drivers_license'
  }
  
  // Par défaut
  return 'id_card'
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

