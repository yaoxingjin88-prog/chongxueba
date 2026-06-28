/**
 * 合并 sql/ 下所有 SQL 为单个导入文件（供宝塔 / phpMyAdmin / mysql CLI 使用）
 * 自动跳过 schema.sql 中已有的 ADD COLUMN / INDEX，避免 Duplicate 错误
 *
 * 用法: node scripts/merge-sql.js
 * 输出: sql/full_database.sql
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlDir = path.join(__dirname, '../sql')
const outFile = path.join(sqlDir, 'full_database.sql')

const migrationFiles = [
  'migrate_search.sql',
  'migrate_plaza.sql',
  'migrate_ambient_sound.sql',
  'migrate_auth_accounts.sql',
  'migrate_settings.sql',
  'migrate_favorites.sql',
  'migrate_profile.sql',
  'migrate_avatar_url.sql',
  'migrate_leaderboard.sql',
  'migrate_study_room_sync.sql',
  'migrate_study_room_accounts.sql',
  'migrate_voice_room_sync.sql',
  'migrate_interact.sql',
  'migrate_voice_room.sql',
  'migrate_video_room.sql',
  'migrate_study_menu.sql',
  'migrate_study_room_info.sql',
  'migrate_study_invite.sql',
  'migrate_video_focus_ai.sql',
  'migrate_pet_nurture.sql',
  'migrate_tasks_center.sql',
  'migrate_mall.sql',
  'migrate_achievements.sql',
  'migrate_vip.sql',
  'migrate_study_room_create.sql',
]

const seedFiles = ['seed.sql', 'seed_test_accounts.sql']

function readSql(file) {
  const filePath = path.join(sqlDir, file)
  if (!fs.existsSync(filePath)) {
    console.warn(`跳过（不存在）: ${file}`)
    return ''
  }
  return fs.readFileSync(filePath, 'utf8').trim()
}

function readCreateTableBody(sql, startIndex) {
  let depth = 1
  let i = startIndex
  let body = ''
  while (i < sql.length && depth > 0) {
    const ch = sql[i]
    if (ch === '(') depth += 1
    else if (ch === ')') depth -= 1
    if (depth > 0) body += ch
    i += 1
  }
  return body
}

/** @returns {{ columns: Map<string, Set<string>>, indexes: Map<string, Set<string>>, uniqueColumns: Map<string, Set<string>> }} */
function parseSchema(schemaSql) {
  const columns = new Map()
  const indexes = new Map()
  const uniqueColumns = new Map()
  const createRegex = /CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\(/gi
  let match

  while ((match = createRegex.exec(schemaSql))) {
    const table = match[1].toLowerCase()
    const body = readCreateTableBody(schemaSql, match.index + match[0].length)
    const cols = new Set()
    const idxs = new Set()
    const uniqCols = new Set()

    for (const line of body.split('\n')) {
      const trimmed = line.trim().replace(/,$/, '')
      if (!trimmed || trimmed.startsWith('--')) continue

      const indexMatch = trimmed.match(/^(?:UNIQUE\s+)?INDEX\s+(\w+)/i)
      const uniqueKeyMatch = trimmed.match(/^UNIQUE KEY\s+(\w+)/i)
      if (indexMatch) {
        idxs.add(indexMatch[1].toLowerCase())
        continue
      }
      if (uniqueKeyMatch) {
        idxs.add(uniqueKeyMatch[1].toLowerCase())
        continue
      }

      if (/^(PRIMARY KEY|UNIQUE KEY|UNIQUE INDEX|KEY |FOREIGN KEY|CONSTRAINT|\))/i.test(trimmed)) continue

      const colMatch = trimmed.match(/^[`"]?(\w+)[`"]?\s+/i)
      if (colMatch) {
        cols.add(colMatch[1].toLowerCase())
        if (/\bUNIQUE\b/i.test(trimmed)) {
          idxs.add(colMatch[1].toLowerCase())
          uniqCols.add(colMatch[1].toLowerCase())
        }
      }
    }

    columns.set(table, cols)
    indexes.set(table, idxs)
    uniqueColumns.set(table, uniqCols)
  }

  return { columns, indexes, uniqueColumns }
}

function stripLeadingComments(statement) {
  return statement
    .split('\n')
    .filter((line) => !/^\s*--/.test(line))
    .join('\n')
    .trim()
}

function splitStatements(sql) {
  return sql
    .split('\n')
    .filter((line) => !/^\s*USE\s+/i.test(line))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

function extractAddColumns(statement) {
  if (!/^ALTER TABLE/i.test(statement)) return null
  const tableMatch = statement.match(/ALTER TABLE\s+(\w+)/i)
  if (!tableMatch) return null
  const table = tableMatch[1].toLowerCase()
  const cols = []
  const addRegex = /ADD COLUMN\s+(?:IF NOT EXISTS\s+)?[`"]?(\w+)[`"]?/gi
  let m
  while ((m = addRegex.exec(statement))) {
    cols.push(m[1].toLowerCase())
  }
  return cols.length ? { table, cols } : null
}

function extractIndexOps(statement) {
  const createUnique = statement.match(/CREATE UNIQUE INDEX\s+(\w+)\s+ON\s+(\w+)\s*\(([^)]+)\)/i)
  if (createUnique) {
    const table = createUnique[2].toLowerCase()
    const cols = createUnique[3].split(',').map((c) => c.trim().toLowerCase())
    return { table, names: [createUnique[1].toLowerCase()], cols }
  }

  const tableMatch = statement.match(/ALTER TABLE\s+(\w+)/i)
  if (!tableMatch) return null
  const table = tableMatch[1].toLowerCase()
  const names = []
  const addIdx = statement.matchAll(/ADD INDEX\s+(\w+)/gi)
  for (const m of addIdx) names.push(m[1].toLowerCase())
  return names.length ? { table, names, cols: [] } : null
}

function filterAddColumnParts(statement, missingCols) {
  const lines = statement.split('\n')
  const kept = []
  let inAlter = false

  for (const line of lines) {
    if (/^ALTER TABLE/i.test(line.trim())) {
      kept.push(line)
      inAlter = true
      continue
    }
    const addMatch = line.match(/ADD COLUMN\s+(?:IF NOT EXISTS\s+)?[`"]?(\w+)[`"]?/i)
    if (addMatch) {
      if (missingCols.has(addMatch[1].toLowerCase())) kept.push(line)
      continue
    }
    if (inAlter && line.trim()) kept.push(line)
  }

  return kept.join('\n').replace(/,\s*$/, '').trim()
}

/**
 * @param {string} statement
 * @param {Map<string, Set<string>>} knownColumns
 * @param {Map<string, Set<string>>} knownIndexes
 * @param {Map<string, Set<string>>} uniqueColumns
 */
function processStatement(statement, knownColumns, knownIndexes, uniqueColumns) {
  const normalized = stripLeadingComments(statement)
  if (!normalized) return { sql: null, skipped: null }

  const addInfo = extractAddColumns(normalized)
  if (addInfo) {
    const { table, cols } = addInfo
    if (!knownColumns.has(table)) knownColumns.set(table, new Set())
    const existing = knownColumns.get(table)
    const missing = cols.filter((c) => !existing.has(c))

    if (missing.length === 0) {
      return { sql: null, skipped: `-- [已跳过] ${table}.${cols.join(', ')} 已在 schema 中存在` }
    }

    if (missing.length < cols.length) {
      const missingSet = new Set(missing)
      for (const c of missing) existing.add(c)
      return { sql: filterAddColumnParts(normalized, missingSet), skipped: null }
    }

    for (const c of missing) existing.add(c)
    return { sql: normalized, skipped: null }
  }

  const indexInfo = extractIndexOps(normalized)
  if (indexInfo) {
    const { table, names, cols = [] } = indexInfo
    if (!knownIndexes.has(table)) knownIndexes.set(table, new Set())
    const existing = knownIndexes.get(table)
    const uniq = uniqueColumns.get(table) || new Set()
    const redundantByColumn = cols.length > 0 && cols.every((c) => uniq.has(c))

    if (redundantByColumn) {
      return { sql: null, skipped: `-- [已跳过] 唯一索引 ${table}.(${cols.join(', ')}) 已在 schema 中存在` }
    }

    const missing = names.filter((n) => !existing.has(n))

    if (missing.length === 0) {
      return { sql: null, skipped: `-- [已跳过] 索引 ${table}.${names.join(', ')} 已在 schema 中存在` }
    }

    for (const n of missing) existing.add(n)
    return { sql: normalized, skipped: null }
  }

  return { sql: normalized, skipped: null }
}

function buildMigrationSection(file, knownColumns, knownIndexes, uniqueColumns) {
  const raw = readSql(file)
  if (!raw) return { body: '', skipped: 0 }

  const statements = splitStatements(raw)
  const parts = []
  let skipped = 0

  for (const statement of statements) {
    const { sql, skipped: skipComment } = processStatement(statement, knownColumns, knownIndexes, uniqueColumns)
    if (skipComment) {
      parts.push(skipComment)
      skipped += 1
    } else if (sql) {
      parts.push(`${sql};`)
    }
  }

  if (!parts.length) return { body: '', skipped }

  return {
    body: `
-- -----------------------------------------------------------------------------
-- 增量迁移（${file}）
-- -----------------------------------------------------------------------------

${parts.join('\n\n')}
`,
    skipped,
  }
}

const schemaSql = readSql('schema.sql')
const { columns: knownColumns, indexes: knownIndexes, uniqueColumns } = parseSchema(schemaSql)

const header = `-- =============================================================================
-- 宠学霸 · 完整数据库导入脚本（去重版）
-- 生成时间: ${new Date().toISOString()}
-- 用法:
--   1. 宝塔 → 数据库 → 导入 → 选择本文件
--   2. 或命令行: mysql -u root -p < full_database.sql
--
-- 说明:
--   - 适用于全新空库导入
--   - 已自动跳过 schema 中已有的字段和索引，避免 Duplicate 错误
--   - 生产环境可去掉末尾 seed 段
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

`

const footer = `
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 导入完成
-- =============================================================================
`

let body = `
-- -----------------------------------------------------------------------------
-- 基础表结构（schema.sql）
-- -----------------------------------------------------------------------------

${schemaSql}

`

let totalSkipped = 0
for (const file of migrationFiles) {
  const { body: section, skipped } = buildMigrationSection(file, knownColumns, knownIndexes, uniqueColumns)
  body += section
  totalSkipped += skipped
}

for (const file of seedFiles) {
  const sql = readSql(file)
  if (!sql) continue
  body += `
-- -----------------------------------------------------------------------------
-- 种子数据（${file}）
-- -----------------------------------------------------------------------------

${sql}

`
}

fs.writeFileSync(outFile, header + body + footer, 'utf8')

const sizeKb = (fs.statSync(outFile).size / 1024).toFixed(1)
console.log(`已生成: ${outFile}`)
console.log(`大小: ${sizeKb} KB`)
console.log(`已跳过重复语句: ${totalSkipped} 条`)
