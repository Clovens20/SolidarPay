/**
 * Convertit le Markdown simple en HTML
 * Supporte les éléments de base : titres, gras, italique, listes, paragraphes
 */
export function markdownToHtml(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return ''
  }

  // Séparer en lignes pour traitement
  const lines = markdown.split('\n')
  const processedLines = []
  let inList = false
  let inOrderedList = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : ''

    // Ignorer les lignes complètement vides au début
    if (trimmedLine === '' && processedLines.length === 0) {
      continue
    }

    // Titres (doivent être au début de la ligne)
    if (trimmedLine.startsWith('#### ')) {
      closeLists()
      processedLines.push(`<h4>${trimmedLine.substring(5)}</h4>`)
      continue
    }
    if (trimmedLine.startsWith('### ')) {
      closeLists()
      processedLines.push(`<h3>${trimmedLine.substring(4)}</h3>`)
      continue
    }
    if (trimmedLine.startsWith('## ')) {
      closeLists()
      processedLines.push(`<h2>${trimmedLine.substring(3)}</h2>`)
      continue
    }
    if (trimmedLine.startsWith('# ')) {
      closeLists()
      processedLines.push(`<h1>${trimmedLine.substring(2)}</h1>`)
      continue
    }

    // Séparateur horizontal
    if (trimmedLine === '---' || trimmedLine.startsWith('---')) {
      closeLists()
      processedLines.push('<hr>')
      continue
    }

    // Liste non ordonnée (peut commencer par - ou *)
    if (trimmedLine.match(/^[-*]\s/)) {
      if (!inList) {
        closeLists()
        processedLines.push('<ul>')
        inList = true
      }
      let content = trimmedLine.replace(/^[-*]\s/, '')
      content = processInlineFormatting(content)
      processedLines.push(`<li>${content}</li>`)
      continue
    }

    // Liste ordonnée
    if (/^\d+\.\s/.test(trimmedLine)) {
      if (!inOrderedList) {
        closeLists()
        processedLines.push('<ol>')
        inOrderedList = true
      }
      let content = trimmedLine.replace(/^\d+\.\s/, '')
      content = processInlineFormatting(content)
      processedLines.push(`<li>${content}</li>`)
      continue
    }

    // Ligne vide - fermer les listes
    if (trimmedLine === '') {
      closeLists()
      // Ne pas ajouter de paragraphe vide, juste un saut de ligne
      continue
    }

    // Paragraphe normal
    closeLists()
    
    // Si la ligne commence par un espace, c'est peut-être une continuation
    let content = processInlineFormatting(trimmedLine)
    
    // Si le contenu est vide après formatage, ignorer
    if (!content || content.trim() === '') {
      continue
    }
    
    processedLines.push(`<p>${content}</p>`)
  }

  // Fermer les listes ouvertes
  closeLists()

  function closeLists() {
    if (inList) {
      processedLines.push('</ul>')
      inList = false
    }
    if (inOrderedList) {
      processedLines.push('</ol>')
      inOrderedList = false
    }
  }

  let html = processedLines.join('\n')

  // Nettoyer les paragraphes vides multiples
  html = html.replace(/<p>\s*<\/p>\n*/g, '')
  html = html.replace(/\n{3,}/g, '\n\n')
  // Nettoyer les espaces en début/fin
  html = html.trim()

  return html
}

/**
 * Traite le formatage inline (gras, italique, liens, emojis)
 */
function processInlineFormatting(text) {
  if (!text) return ''
  
  // Échapper le HTML existant pour éviter les doubles encodages
  // Mais d'abord, protéger les balises HTML déjà présentes
  const hasHtmlTags = /<[^>]+>/.test(text)
  
  // Liens [texte](url) - doit être fait avant le formatage
  text = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  
  // Gras **texte** ou __texte__
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  
  // Italique *texte* ou _texte_ (mais pas si c'est déjà du gras)
  // Éviter de matcher les emojis ou les astérisques seuls
  text = text.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>')
  text = text.replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '<em>$1</em>')
  
  // Code inline `code`
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>')
  
  // Convertir les retours à la ligne en <br> si ce n'est pas déjà du HTML
  if (!hasHtmlTags) {
    text = text.replace(/\n/g, '<br>')
  }
  
  return text
}

/**
 * Détecte si le contenu est en Markdown
 */
export function isMarkdown(content) {
  if (!content || typeof content !== 'string') {
    return false
  }
  
  const markdownIndicators = [
    /^#{1,6}\s/m,           // Titres
    /^\*\*.*\*\*/,          // Gras
    /^\- /m,                // Listes
    /^\d+\.\s/m,            // Listes ordonnées
    /^---$/m,               // Séparateur
    /\[.*\]\(.*\)/,         // Liens
  ]
  
  return markdownIndicators.some(pattern => pattern.test(content))
}

/**
 * Convertit le contenu en HTML (Markdown ou HTML)
 */
export function convertContentToHtml(content) {
  if (!content || typeof content !== 'string') {
    return ''
  }

  const trimmed = content.trim()
  
  // Si c'est déjà du HTML valide (contient des balises), retourner tel quel
  if (trimmed.includes('<') && trimmed.includes('>') && !isMarkdown(trimmed)) {
    return trimmed
  }
  
  // Sinon, convertir depuis Markdown
  return markdownToHtml(trimmed)
}

