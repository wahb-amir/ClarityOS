/**
 * Conventional commit parser — replaces the shallow regex in utils.ts
 *
 * Parses: type(scope): subject
 * Maps commit types to client-friendly language.
 * Internal commits (chore, ci, build, test, docs) are flagged as internal.
 */

export interface ParsedCommit {
  /** The translated, client-friendly description */
  humanText: string
  /** True if this commit should be hidden from clients by default */
  internal: boolean
  /** Suggested activity type */
  activityType: 'FEATURE_PROGRESS' | 'BUG_FIX' | 'DEPLOYMENT'
  /** True if the commit couldn't be cleanly parsed and needs review */
  needsReview: boolean
}

// Conventional commit prefix → [client prefix, activity type, internal?]
const TYPE_MAP: Record<string, [string, ParsedCommit['activityType'], boolean]> = {
  feat:     ['Added',                       'FEATURE_PROGRESS', false],
  fix:      ['Fixed an issue in',           'BUG_FIX',          false],
  perf:     ['Improved performance of',     'FEATURE_PROGRESS', false],
  refactor: ['Improved',                    'FEATURE_PROGRESS', false],
  style:    ['Updated appearance of',       'FEATURE_PROGRESS', false],
  revert:   ['Reverted recent change to',   'BUG_FIX',          false],
  // Internal types — published: false, internal: true
  chore:    ['(internal)',  'FEATURE_PROGRESS', true],
  ci:       ['(internal)',  'FEATURE_PROGRESS', true],
  build:    ['(internal)',  'FEATURE_PROGRESS', true],
  test:     ['(internal)',  'FEATURE_PROGRESS', true],
  docs:     ['(internal)',  'FEATURE_PROGRESS', true],
}

/** Strip noise: ticket IDs, PR merge lines, file paths, branch names */
function stripNoise(subject: string): string {
  return subject
    .replace(/\b[A-Z]+-\d+\b/g, '')          // ticket IDs: PROJ-123
    .replace(/\(#\d+\)/g, '')                  // PR numbers: (#42)
    .replace(/Merge\s+pull\s+request.*/i, '')  // Merge PR lines
    .replace(/Merge\s+branch.*/i, '')          // Merge branch lines
    .replace(/[\w./\\-]+\.(ts|tsx|js|jsx|css|json|md|py|go|rs)\b/g, '') // file paths
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Convert snake_case / kebab-case / camelCase scope to readable words */
function humanizeScope(scope: string): string {
  return scope
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
}

/** Attempt to parse a conventional commit message */
function parseConventional(message: string): { type: string; scope?: string; subject: string } | null {
  // type(scope): subject  OR  type: subject
  const match = message.match(/^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)/)
  if (!match) return null
  return { type: match[1].toLowerCase(), scope: match[2], subject: match[3] }
}

export function translateCommit(rawMessage: string): ParsedCommit {
  const firstLine = rawMessage.split('\n')[0].trim()
  const parsed = parseConventional(firstLine)

  if (!parsed) {
    // Unparseable — apply basic noise stripping, flag for review
    const cleaned = stripNoise(firstLine)
    const lower = firstLine.toLowerCase()
    const activityType: ParsedCommit['activityType'] =
      /\b(fix|bug|patch|hotfix|resolve)\b/.test(lower) ? 'BUG_FIX' :
      /\b(deploy|release|publish|ship)\b/.test(lower)  ? 'DEPLOYMENT' :
      'FEATURE_PROGRESS'
    return {
      humanText: cleaned.charAt(0).toUpperCase() + cleaned.slice(1) || firstLine,
      internal: false,
      activityType,
      needsReview: true,
    }
  }

  const { type, scope, subject } = parsed
  const entry = TYPE_MAP[type]

  if (!entry) {
    // Unknown type — treat as feature, flag for review
    const cleaned = stripNoise(subject)
    return {
      humanText: cleaned.charAt(0).toUpperCase() + cleaned.slice(1),
      internal: false,
      activityType: 'FEATURE_PROGRESS',
      needsReview: true,
    }
  }

  const [prefix, activityType, internal] = entry

  if (internal) {
    return { humanText: `(internal — ${type}${scope ? `: ${scope}` : ''})`, internal: true, activityType, needsReview: false }
  }

  const cleanedSubject = stripNoise(subject)
  const scopePart = scope ? ` the ${humanizeScope(scope)}` : ''
  const humanText = `${prefix}${scopePart}${scopePart ? ': ' : ' '}${cleanedSubject}`.replace(/\s{2,}/g, ' ').trim()

  return {
    humanText: humanText.charAt(0).toUpperCase() + humanText.slice(1),
    internal: false,
    activityType,
    needsReview: false,
  }
}
