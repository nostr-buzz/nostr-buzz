import { SimplePool } from 'nostr-tools'

const postId = process.argv[2]
if (!postId) {
  console.error('Usage: node ./tmp-nostr-metrics-debug.mjs <event-id>')
  process.exit(1)
}

const relays = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://relay.nostr.band',
]

const kinds = [1, 6, 16, 7, 9735]
const pool = new SimplePool({ enablePing: true, enableReconnect: false })

function countByKind(events) {
  const out = { replies: 0, reposts: 0, reactions: 0, zaps: 0, total: events.length }
  for (const e of events) {
    if (e.kind === 1) out.replies++
    else if (e.kind === 6 || e.kind === 16) out.reposts++
    else if (e.kind === 7) out.reactions++
    else if (e.kind === 9735) out.zaps++
  }
  return out
}

function hasRef(e, target) {
  const t = target.toLowerCase()
  return e.tags.some(tag => (tag[0] || '').toLowerCase() === 'e' && (tag[1] || '').toLowerCase() === t)
}

async function run() {
  try {
    const byRelay = {}

    for (const relay of relays) {
      const filtered = await pool.querySync([relay], {
        kinds,
        '#e': [postId],
        limit: 2000,
      }, { maxWait: 10000 })

      const wide = await pool.querySync([relay], {
        kinds,
        limit: 5000,
      }, { maxWait: 10000 })

      const localMatched = wide.filter(e => hasRef(e, postId))

      byRelay[relay] = {
        filteredCount: filtered.length,
        filteredMetrics: countByKind(filtered),
        wideCount: wide.length,
        localMatchedCount: localMatched.length,
        localMatchedMetrics: countByKind(localMatched),
      }
    }

    console.log(JSON.stringify({ postId, byRelay }, null, 2))
  } catch (err) {
    console.error('error', err)
    process.exitCode = 1
  } finally {
    pool.close(relays)
    pool.destroy()
  }
}

run()
