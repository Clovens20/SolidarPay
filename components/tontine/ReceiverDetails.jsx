'use client'

import { parseReceiverStorage } from '@/lib/tontine-receiver'

/**
 * Affichage des coordonnées de réception (Chili JSON, email Interac, ou texte brut).
 */
export default function ReceiverDetails({ raw, compact = false }) {
  const p = parseReceiverStorage(raw)
  if (!p || p.kind === 'empty') {
    return <p className="font-medium text-solidarpay-text/60">—</p>
  }
  if (p.kind === 'direct_per_member') {
    return (
      <p className="text-sm text-solidarpay-text/80">
        Coordonnées par membre (paiement direct) — voir l’onglet <strong>Membres</strong>.
      </p>
    )
  }
  if (p.kind === 'cl_transferencia') {
    const wrap = compact ? 'text-sm space-y-0.5' : 'font-medium space-y-1 text-sm'
    return (
      <div className={wrap}>
        <p>{p.bank || '—'}</p>
        <p>RUT : {p.rut || '—'}</p>
        {p.accountType ? <p>Type : {p.accountType}</p> : null}
        <p>N° compte : {p.accountNumber || '—'}</p>
      </div>
    )
  }
  if (p.kind === 'email') {
    return <p className="font-medium break-all">{p.email}</p>
  }
  return <p className="font-medium break-all whitespace-pre-line">{p.display}</p>
}
