/**
 * Deploys `firestore.rules` when the file is no longer what was last deployed.
 *
 * Rules only take effect once they are up there, so a collection a new feature
 * writes to is refused ("Missing or insufficient permissions") until then, and
 * the app looks broken although the file and the code are right. Nothing here
 * decides what to deploy: the file does, and this only notices it changed.
 *
 *   npm run deploy:rules            # deploy if the file changed
 *   npm run deploy:rules -- --force # deploy anyway (the console was edited by hand)
 *   npm run dev / npm run preview   # `predev` / `prepreview` run this first
 *
 * What went up is remembered in `.firebase/deployed-rules.json` — the project
 * and a hash of the file, which git ignores — so an unchanged file costs a read
 * and nothing else.
 *
 * The flags say what a run owes its caller:
 * - none: deploy when changed, and stop with an error (exit 1) when that fails.
 * - `--force`: deploy whatever the hash says.
 * - `--auto`: a failed deploy warns and lets what asked for it carry on —
 *   starting the dev server offline is better than not starting it.
 * - `--hook`: the Claude Code hook (`.claude/settings.json`), which fires after
 *   every edit: silent unless something happened, and exit 2 on a failed deploy
 *   so the agent is told rather than the user finding out in the console.
 */
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const rulesFile = join(root, 'firestore.rules')
const stampFile = join(root, '.firebase', 'deployed-rules.json')

const flags = new Set(process.argv.slice(2))
const force = flags.has('--force')
const auto = flags.has('--auto')
const hook = flags.has('--hook')

const rules = readIfThere(rulesFile)
const project = parseJson(readIfThere(join(root, '.firebaserc')))?.projects?.default ?? null
if (rules === null || project === null) {
  // Nothing to deploy, or nowhere to deploy it. The hook fires on every edit in
  // the repository, so for it that is not news.
  if (!hook) fail('No firestore.rules, or no default project in .firebaserc.')
  process.exit(0)
}

const hash = createHash('sha256').update(rules).digest('hex')
const stamp = parseJson(readIfThere(stampFile))
if (!force && stamp?.sha256 === hash && stamp?.project === project) {
  say(`firestore.rules is already deployed to ${project}.`, { onlyWhenAsked: true })
  process.exit(0)
}

say(`Deploying firestore.rules to ${project}...`, { onlyWhenAsked: true })
const deploy = spawnSync(
  npx(),
  ['-y', 'firebase-tools@latest', 'deploy', '--only', 'firestore:rules', '--project', project, '--non-interactive'],
  { cwd: root, stdio: hook ? ['ignore', 'pipe', 'pipe'] : 'inherit', encoding: 'utf8' },
)
if (deploy.error || deploy.status !== 0) {
  fail(
    `Could not deploy firestore.rules to ${project}. Run 'npm run deploy:rules' to see why` +
      ", or 'npx -y firebase-tools@latest login' if the login has expired.",
    tail(`${deploy.stdout ?? ''}${deploy.stderr ?? ''}${deploy.error?.message ?? ''}`),
  )
}

mkdirSync(dirname(stampFile), { recursive: true })
writeFileSync(
  stampFile,
  `${JSON.stringify({ project, sha256: hash, deployedAt: new Date().toISOString() }, null, 2)}\n`,
)
say(`Deployed firestore.rules to ${project}.`)

/** Says something, through the hook's own channel when that is where this runs. */
function say(message, { onlyWhenAsked = false } = {}) {
  if (!hook) {
    console.log(message)
  } else if (!onlyWhenAsked) {
    console.log(JSON.stringify({ systemMessage: message, suppressOutput: true }))
  }
}

/** Ends the run the way this caller wants a failure ended (see the flags above). */
function fail(message, detail = '') {
  if (hook) {
    process.stderr.write(`${message}\n${detail}\n`)
    process.exit(2)
  }
  process.stderr.write(`${auto ? 'Warning: ' : ''}${message}\n${detail ? `${detail}\n` : ''}`)
  process.exit(auto ? 0 : 1)
}

/** npx beside the node running this, so a hook with a bare PATH still finds it. */
function npx() {
  const beside = join(dirname(process.execPath), 'npx')
  return existsSync(beside) ? beside : 'npx'
}

function readIfThere(file) {
  try {
    return readFileSync(file, 'utf8')
  } catch {
    return null
  }
}

function parseJson(text) {
  try {
    return text === null ? null : JSON.parse(text)
  } catch {
    return null
  }
}

function tail(output, lines = 20) {
  return output.trim().split('\n').slice(-lines).join('\n')
}
