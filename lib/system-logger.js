import { supabase } from './supabase'

/**
 * System Logger - Logs techniques uniquement
 * 
 * Types d'événements trackés:
 * - auth: Connexions/déconnexions (stats uniquement)
 * - kyc: Actions KYC du super admin
 * - tontine: Stats de création de tontines
 * - system: Modifications système
 * - error: Erreurs techniques
 */

const EVENT_CATEGORIES = {
  // Auth
  'auth_login': { type: 'auth', level: 'info' },
  'auth_logout': { type: 'auth', level: 'info' },
  'auth_locked': { type: 'auth', level: 'warning' },
  
  // KYC (Super Admin actions)
  'kyc_submitted': { type: 'kyc', level: 'info' },
  'kyc_approved': { type: 'kyc', level: 'info' },
  'kyc_rejected': { type: 'kyc', level: 'info' },
  'kyc_requested': { type: 'kyc', level: 'info' },
  
  // Tontines (stats)
  'tontine_created': { type: 'tontine', level: 'info' },
  'tontine_member_added': { type: 'tontine', level: 'info' },
  
  // System
  'system_maintenance': { type: 'system', level: 'info' },
  'system_settings': { type: 'system', level: 'info' },
  'system_backup': { type: 'system', level: 'info' },
  'system_country': { type: 'system', level: 'info' },
  'system_payment': { type: 'system', level: 'info' },
  'system_customization': { type: 'system', level: 'info' },
  
  // Errors
  'error_server': { type: 'error', level: 'error' },
  'error_upload': { type: 'error', level: 'warning' },
  'error_database': { type: 'error', level: 'error' },
  'error_email': { type: 'error', level: 'warning' },
  'error_critical': { type: 'error', level: 'critical' }
}

/**
 * Log an event to the system logs
 * 
 * @param {string} category - Event category (see EVENT_CATEGORIES)
 * @param {string} message - Event message
 * @param {object} metadata - Additional metadata (optional)
 * @param {object} request - Request object with IP and user agent (optional)
 */
export async function logSystemEvent(category, message, metadata = {}, request = null) {
  try {
    const eventConfig = EVENT_CATEGORIES[category] || { type: 'system', level: 'info' }
    
    // Get user info if available
    let userId = null
    try {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id || null
    } catch (e) {
      // Not logged in, that's fine
    }

    // Extract IP and user agent from request
    const ipAddress = request?.headers?.get('x-forwarded-for')?.split(',')[0] || 
                     request?.headers?.get('x-real-ip') ||
                     null
    const userAgent = request?.headers?.get('user-agent') || null

    const { error } = await supabase
      .from('system_logs')
      .insert([{
        level: eventConfig.level,
        category,
        message,
        metadata: typeof metadata === 'object' ? metadata : { raw: metadata },
        userId,
        ipAddress,
        userAgent
      }])

    if (error) {
      console.error('Error logging system event:', error)
    }
  } catch (error) {
    // Don't fail the main operation if logging fails
    console.error('Error in logSystemEvent:', error)
  }
}

/**
 * Helper functions for specific event types
 */

// KYC Events
export async function logKYCSubmitted(userId, documentId) {
  const documentIdStr = documentId?.toString() || 'unknown'
  await logSystemEvent('kyc_submitted', `Document KYC soumis par utilisateur ${userId}`, {
    userId,
    documentId: documentIdStr
  })
  return documentIdStr
}

export async function logKYCApproved(userId, documentId, reviewedBy) {
  await logSystemEvent('kyc_approved', `Document KYC approuvé pour utilisateur ${userId}`, {
    userId,
    documentId,
    reviewedBy
  })
}

export async function logKYCRejected(userId, documentId, reviewedBy, reason) {
  await logSystemEvent('kyc_rejected', `Document KYC rejeté pour utilisateur ${userId}: ${reason}`, {
    userId,
    documentId,
    reviewedBy,
    reason
  })
}

export async function logKYCRequested(userId, documentId, reviewedBy, reason) {
  await logSystemEvent('kyc_requested', `Nouveau document KYC demandé pour utilisateur ${userId}`, {
    userId,
    documentId,
    reviewedBy,
    reason
  })
}

// System Events
export async function logSystemMaintenance(action, details) {
  await logSystemEvent('system_maintenance', `Mode maintenance ${action}`, {
    action,
    details
  })
}

export async function logSystemSettingsChange(setting, oldValue, newValue, changedBy) {
  await logSystemEvent('system_settings', `Paramètre modifié: ${setting}`, {
    setting,
    oldValue,
    newValue,
    changedBy
  })
}

export async function logSystemBackup(type, size) {
  await logSystemEvent('system_backup', `Sauvegarde créée: ${type}`, {
    type,
    size
  })
}

export async function logCountryChange(action, countryCode, details) {
  await logSystemEvent('system_country', `Pays ${action}: ${countryCode}`, {
    action,
    countryCode,
    details
  })
}

export async function logPaymentMethodChange(action, method, details) {
  await logSystemEvent('system_payment', `Méthode de paiement ${action}: ${method}`, {
    action,
    method,
    details
  })
}

export async function logCustomizationChange(component, details) {
  await logSystemEvent('system_customization', `Personnalisation modifiée: ${component}`, {
    component,
    details
  })
}

// Error Events
export async function logServerError(error, endpoint, request) {
  await logSystemEvent('error_server', `Erreur serveur 500: ${error.message}`, {
    error: error.message,
    stack: error.stack,
    endpoint
  }, request)
}

export async function logUploadError(error, fileName, request) {
  await logSystemEvent('error_upload', `Upload échoué: ${fileName}`, {
    error: error.message,
    fileName
  }, request)
}

export async function logDatabaseError(error, query, request) {
  await logSystemEvent('error_database', `Erreur base de données: ${error.message}`, {
    error: error.message,
    query
  }, request)
}

export async function logEmailError(error, recipient, request) {
  await logSystemEvent('error_email', `Erreur envoi email à ${recipient}`, {
    error: error.message,
    recipient
  }, request)
}

export async function logCriticalError(error, context, request) {
  await logSystemEvent('error_critical', `ERREUR CRITIQUE: ${error.message}`, {
    error: error.message,
    stack: error.stack,
    context
  }, request)
}

// Tontine Stats (for daily aggregations, not individual events)
export async function logTontineCreated(tontineId, adminId) {
  await logSystemEvent('tontine_created', `Tontine créée: ${tontineId}`, {
    tontineId,
    adminId
  })
}

export async function logMemberAdded(tontineId, userId) {
  await logSystemEvent('tontine_member_added', `Membre ajouté à tontine ${tontineId}`, {
    tontineId,
    userId
  })
}

