/**
 * Makes the key pair check-ins are pushed with (CHECKIN-10), and puts each half
 * where it is read:
 *
 * - the private half, and the public one beside it, into the Firebase project's
 *   Secret Manager, where the sender in `functions/` reads them. Nothing here
 *   prints the private half, and it is never written to a file;
 * - the public half into `.env.local` as `VITE_VAPID_PUBLIC_KEY`, which the app
 *   subscribes to push with. Git ignores the file.
 *
 *   npm run setup:push              # once: makes the keys, unless .env.local has one
 *   npm run setup:push -- --force   # makes new keys; every device turns push on again
 *
 * Secret Manager needs the project on the Blaze plan. The public key must also be
 * set in the Vercel project's environment (Production) before the next deploy,
 * and the functions deployed afterwards (`npm run deploy:functions`): this says so
 * at the end rather than doing either.
 */
import { spawnSync } from 'node:child_process'
import { generateKeyPairSync } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const envFile = join(root, '.env.local')
const NAME = 'VITE_VAPID_PUBLIC_KEY'
const force = process.argv.includes('--force')

const project = JSON.parse(readFileSync(join(root, '.firebaserc'), 'utf8')).projects.default
const env = existsSync(envFile) ? readFileSync(envFile, 'utf8') : ''
const existing = new RegExp(`^${NAME}=(.+)$`, 'm').exec(env)?.[1]?.trim()

if (existing && !force) {
  console.log(`${NAME} is already set in .env.local. Run with --force to make new keys.`)
  process.exit(0)
}

// A P-256 key pair, written the way Web Push writes VAPID keys: URL-safe base64
// of the raw public point (65 bytes) and of the private scalar (32 bytes).
const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
const point = publicKey.export({ format: 'jwk' })
const scalar = privateKey.export({ format: 'jwk' })
const raw = Buffer.concat([Buffer.from([4]), Buffer.from(point.x, 'base64url'), Buffer.from(point.y, 'base64url')])
const vapidPublic = raw.toString('base64url')
const vapidPrivate = scalar.d

for (const [secret, value] of [
  ['VAPID_PUBLIC_KEY', vapidPublic],
  ['VAPID_PRIVATE_KEY', vapidPrivate],
]) {
  const set = spawnSync(
    npx(),
    ['-y', 'firebase-tools@latest', 'functions:secrets:set', secret, '--data-file', '-', '--project', project, '--non-interactive', '--force'],
    { cwd: root, input: value, stdio: ['pipe', 'pipe', 'pipe'], encoding: 'utf8' },
  )
  if (set.error || set.status !== 0) {
    process.stderr.write(
      `Could not keep ${secret} in ${project}'s Secret Manager. Is the project on the Blaze plan, and is the login current ('npx -y firebase-tools@latest login')?\n` +
        `${tail(`${set.stdout ?? ''}${set.stderr ?? ''}${set.error?.message ?? ''}`)}\n`,
    )
    process.exit(1)
  }
}

// Only once the sender has its keys does the app subscribe with the public one.
const line = `${NAME}=${vapidPublic}`
writeFileSync(envFile, existing === undefined ? `${env}${env === '' || env.endsWith('\n') ? '' : '\n'}${line}\n` : env.replace(new RegExp(`^${NAME}=.*$`, 'm'), line))

console.log(`Made new push keys: both are in ${project}'s Secret Manager, and the public one is in .env.local.`)
console.log('Next:')
console.log(`  1. Set ${NAME} to the same value in the Vercel project (Production): npx vercel env add ${NAME} production`)
console.log('  2. Deploy the sender: npm run deploy:functions')
console.log('  3. Restart npm run dev, and deploy the app so it subscribes with the new key.')

/** npx beside the node running this, so a bare PATH still finds it. */
function npx() {
  const beside = join(dirname(process.execPath), 'npx')
  return existsSync(beside) ? beside : 'npx'
}

function tail(output, lines = 20) {
  return output.trim().split('\n').slice(-lines).join('\n')
}
