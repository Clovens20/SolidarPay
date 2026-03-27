/**
 * Migration des utilisateurs : ancien projet Supabase → nouveau projet.
 *
 * Copie : auth.users → auth.identities → public.users
 * Remplace instance_id par celui du nouveau projet.
 *
 * Dashboard → Settings → Database : URI Postgres (session pooler ou direct).
 *
 * Usage :
 *   set MIGRATE_OLD_DATABASE_URL=postgres://postgres.[OLD]:[PWD]@...
 *   set MIGRATE_NEW_DATABASE_URL=postgres://postgres.[NEW]:[PWD]@...
 *   node scripts/migrate-users-supabase.mjs
 *
 * Variables optionnelles dans .env / .env.local
 */

import fs from 'fs'
import path from 'path'
import pg from 'pg'

const { Client } = pg

function loadEnvFiles() {
  const root = process.cwd()
  for (const name of ['.env.local', '.env']) {
    const p = path.join(root, name)
    try {
      const text = fs.readFileSync(p, 'utf8')
      for (const line of text.split('\n')) {
        const t = line.trim()
        if (!t || t.startsWith('#')) continue
        const eq = t.indexOf('=')
        if (eq === -1) continue
        const key = t.slice(0, eq).trim()
        let val = t.slice(eq + 1).trim()
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1)
        }
        if (!process.env[key]) process.env[key] = val
      }
    } catch {
      /* ignore */
    }
  }
}

function quoteIdent(name) {
  return '"' + String(name).replace(/"/g, '""') + '"'
}

async function fetchTableColumns(client, schema, table) {
  const { rows } = await client.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = $1 AND table_name = $2
    ORDER BY ordinal_position
    `,
    [schema, table]
  )
  return rows.map((r) => r.column_name)
}

function intersectCols(oldCols, newCols) {
  return oldCols.filter((c) => newCols.includes(c))
}

function rowValues(row, columns) {
  return columns.map((c) => row[c])
}

async function fetchAuthUsersRows(oldC, authCols) {
  const list = authCols.map(quoteIdent).join(', ')
  if (!authCols.includes('deleted_at')) {
    const { rows } = await oldC.query(`SELECT ${list} FROM auth.users`)
    return rows
  }
  const { rows } = await oldC.query(
    `SELECT ${list} FROM auth.users WHERE deleted_at IS NULL`
  )
  return rows
}

async function copyAuthIdentities(oldC, newC, identityCols, newInstanceId) {
  if (!identityCols.length) {
    console.warn('Table auth.identities absente ou vide côté schéma, ignoré.')
    return 0
  }
  const { rows } = await oldC.query(
    `SELECT ${identityCols.map(quoteIdent).join(', ')} FROM auth.identities`
  )
  if (!rows.length) return 0

  const insertCols = identityCols.map(quoteIdent).join(', ')
  const placeholders = identityCols.map((_, i) => `$${i + 1}`).join(', ')

  let n = 0
  for (const row of rows) {
    const values = identityCols.map((c) =>
      c === 'instance_id' ? newInstanceId : row[c]
    )
    try {
      if (identityCols.includes('id')) {
        await newC.query(
          `INSERT INTO auth.identities (${insertCols}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
          values
        )
      } else {
        await newC.query(
          `INSERT INTO auth.identities (${insertCols}) VALUES (${placeholders})`,
          values
        )
      }
      n++
    } catch (e) {
      console.warn(`Identité ignorée (${row.id ?? row.user_id}): ${e.message}`)
    }
  }
  return n
}

async function copyPublicUsers(oldC, newC, userCols) {
  const insertCols = userCols.map(quoteIdent).join(', ')
  const placeholders = userCols.map((_, i) => `$${i + 1}`).join(', ')
  const orderCol = userCols.includes('createdAt')
    ? quoteIdent('createdAt')
    : userCols.includes('created_at')
      ? quoteIdent('created_at')
      : quoteIdent('id')
  const { rows } = await oldC.query(
    `SELECT ${insertCols} FROM public.users ORDER BY ${orderCol} NULLS LAST`
  )

  const updates = userCols
    .filter((c) => c !== 'id')
    .map((c) => `${quoteIdent(c)} = EXCLUDED.${quoteIdent(c)}`)
    .join(', ')

  let n = 0
  for (const row of rows) {
    const values = rowValues(row, userCols)
    await newC.query(
      `INSERT INTO public.users (${insertCols}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${updates}`,
      values
    )
    n++
  }
  return n
}

async function main() {
  loadEnvFiles()
  const oldUrl = process.env.MIGRATE_OLD_DATABASE_URL
  const newUrl = process.env.MIGRATE_NEW_DATABASE_URL

  if (!oldUrl || !newUrl) {
    console.error(
      'Définissez MIGRATE_OLD_DATABASE_URL et MIGRATE_NEW_DATABASE_URL (URI Postgres du dashboard Supabase).'
    )
    process.exit(1)
  }

  const ssl = { rejectUnauthorized: false }
  const oldC = new Client({ connectionString: oldUrl, ssl })
  const newC = new Client({ connectionString: newUrl, ssl })

  await oldC.connect()
  await newC.connect()

  try {
    const {
      rows: [inst],
    } = await newC.query('SELECT id FROM auth.instances LIMIT 1')
    if (!inst?.id) {
      throw new Error(
        'Nouvelle base : auth.instances vide. Créez au moins un compte (inscription test) sur le nouveau projet puis relancez.'
      )
    }
    const newInstanceId = inst.id
    console.log('Nouveau instance_id :', newInstanceId)

    const oldAuthCols = await fetchTableColumns(oldC, 'auth', 'users')
    const newAuthCols = await fetchTableColumns(newC, 'auth', 'users')
    const authCols = intersectCols(oldAuthCols, newAuthCols)
    if (!authCols.includes('id')) {
      throw new Error('Colonne id introuvable sur auth.users (source ou cible).')
    }

    const authRows = await fetchAuthUsersRows(oldC, authCols)
    if (!authRows.length) {
      console.warn('Aucune ligne auth.users côté source.')
    } else {
      const insertCols = authCols.map(quoteIdent).join(', ')
      const placeholders = authCols.map((_, i) => `$${i + 1}`).join(', ')
      const updateSet = authCols
        .filter((c) => c !== 'id')
        .map((c) => `${quoteIdent(c)} = EXCLUDED.${quoteIdent(c)}`)
        .join(', ')

      let nAuth = 0
      for (const row of authRows) {
        const values = authCols.map((c) =>
          c === 'instance_id' ? newInstanceId : row[c]
        )
        await newC.query(
          `INSERT INTO auth.users (${insertCols}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${updateSet}`,
          values
        )
        nAuth++
      }
      console.log('auth.users :', nAuth, 'ligne(s)')
    }

    const oldIdCols = await fetchTableColumns(oldC, 'auth', 'identities')
    const newIdCols = await fetchTableColumns(newC, 'auth', 'identities')
    const identityCols = intersectCols(oldIdCols, newIdCols)
    const nId = await copyAuthIdentities(oldC, newC, identityCols, newInstanceId)
    console.log('auth.identities :', nId, 'insert(s) réussi(s)')

    const oldUserCols = await fetchTableColumns(oldC, 'public', 'users')
    const newUserCols = await fetchTableColumns(newC, 'public', 'users')
    const userCols = intersectCols(oldUserCols, newUserCols)
    if (!userCols.includes('id')) {
      throw new Error('public.users sans colonne id.')
    }
    const nPu = await copyPublicUsers(oldC, newC, userCols)
    console.log('public.users :', nPu, 'ligne(s)')

    console.log('\nMigration terminée. Pensez à mettre à jour .env avec le nouveau projet.')
    console.log(
      'Les sessions JWT anciennes sont invalides sauf si vous copiez le JWT Secret (Settings → API) avant migration.'
    )
  } finally {
    await oldC.end()
    await newC.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
