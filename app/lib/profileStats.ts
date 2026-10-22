import { statsSnapshots, type LinkStat, type StatsId, type StatsSnapshot } from '../data/profile'

const HOUR = 60 * 60 * 1000
const RETRY_DELAY = 5 * 60 * 1000
const CACHE_PREFIX = 'teozeng:profile-stats:v1:'
type ObjectData = Record<string, unknown>
type Provider = { url: string; ttl: number; html?: boolean; parse: (data: unknown) => LinkStat[] }
export type StatsState = { snapshot: StatsSnapshot; status: 'saved' | 'current' | 'unavailable' }

function object(value: unknown): ObjectData {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid profile response')
    return value as ObjectData
}

function number(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error('Invalid counter')
    return value
}

const stat = (label: string, value: number): LinkStat => ({ label, value: Math.round(number(value)).toString() })

// Read only the small, named text fields. Never insert third-party SVG markup into the page.
function leetCardField(svg: string, id: string): string {
    const matches = Array.from(svg.matchAll(new RegExp(`<text\\b[^>]*\\bid=["']${id}["'][^>]*>([^<]*)<\\/text>`, 'g')))
    if (matches.length !== 1) throw new Error('Unrecognized LeetCard')
    return matches[0][1].trim()
}

const providers: Partial<Record<StatsId, Provider>> = {
    leetcode: {
        url: 'https://leetcard.jacoblin.cool/user5137?animation=false&font=sans-serif&cache=3600',
        ttl: HOUR,
        html: true,
        parse(data) {
            if (typeof data !== 'string' || data.length > 100000) throw new Error('Invalid LeetCard')
            // LeetCard can return HTTP 200 with an error username and random example counts.
            // Verify identity before accepting any numbers, even when the request succeeds.
            if (leetCardField(data, 'username-text') !== 'user5137') throw new Error('Unexpected user')
            const totalText = leetCardField(data, 'total-solved-text')
            if (!/^\d+$/.test(totalText)) throw new Error('Invalid total')
            const total = Number(totalText)
            const difficulties = ['easy', 'medium', 'hard'].map(difficulty => {
                const counts = leetCardField(data, `${difficulty}-solved-count`).match(/^(\d+)\s*\/\s*(\d+)$/)
                if (!counts || Number(counts[1]) > Number(counts[2])) throw new Error('Invalid solved count')
                return Number(counts[1])
            })
            if (difficulties.reduce((sum, count) => sum + count, 0) !== total) throw new Error('Inconsistent total')
            return [
                stat('Solved', total),
                ...['Easy', 'Medium', 'Hard'].map((label, i) => stat(label, difficulties[i])),
            ]
        },
    },
    duolingo: {
        url: 'https://duolingo-streak-tracker.vercel.app/api/stats/sirteo',
        ttl: HOUR,
        parse(data) {
            const user = object(data)
            if (user.username !== 'sirteo' || user.id !== 625409208) throw new Error('Unexpected user')
            if (!Array.isArray(user.courses)) throw new Error('Invalid course list')
            const courses = user.courses.map(course => object(course).id)
            if (courses.some(id => typeof id !== 'string' || !id)) throw new Error('Invalid course')
            return [
                stat('Day streak', number(user.streak)),
                { label: 'XP', value: Math.round(number(user.totalXp)).toLocaleString('en-US') },
                stat('Courses', new Set(courses).size),
            ]
        },
    },
    github: {
        url: 'https://api.github.com/users/Sir-Teo',
        ttl: HOUR,
        parse(data) {
            const user = object(data)
            if (user.login !== 'Sir-Teo' || typeof user.created_at !== 'string') throw new Error('Unexpected user')
            const year = new Date(user.created_at).getUTCFullYear()
            if (!Number.isFinite(year)) throw new Error('Invalid account date')
            return [
                stat('Public repos', number(user.public_repos)),
                stat('Followers', number(user.followers)),
                stat('Since', year),
            ]
        },
    },
    chess: {
        url: 'https://api.chess.com/pub/player/masterteo1205/stats',
        ttl: 12 * HOUR,
        parse(data) {
            const player = object(data)
            const stats: LinkStat[] = []
            for (const [key, label] of [
                ['chess_blitz', 'Blitz'],
                ['chess_rapid', 'Rapid'],
            ]) {
                if (player[key]) stats.push(stat(label, number(object(object(player[key]).last).rating)))
            }
            if (player.tactics && object(player.tactics).highest) {
                stats.push(stat('Best puzzle', number(object(object(player.tactics).highest).rating)))
            }
            if (!stats.length) throw new Error('No ratings available')
            return stats
        },
    },
    ogs: {
        url: 'https://online-go.com/api/v1/players/622443/',
        ttl: HOUR,
        parse(data) {
            const player = object(data)
            if (player.id !== 622443) throw new Error('Unexpected player')
            return [stat('Overall rating', number(object(object(player.ratings).overall).rating))]
        },
    },
    blog: {
        url: 'https://teozeng.dev/blogs/search.json',
        ttl: HOUR,
        parse(data) {
            if (!Array.isArray(data)) throw new Error('Invalid article index')
            const urls = data.map(entry => object(entry).url)
            if (urls.some(url => typeof url !== 'string')) throw new Error('Invalid article URL')
            const articles = new Set(urls.filter(url => /^\/blogs\/\d{4}\/\d{2}\/\d{2}\//.test(url as string)))
            if (data.length && !articles.size) throw new Error('Unrecognized article index')
            return [stat('Articles', articles.size)]
        },
    },
    gallery: {
        url: 'https://teozeng.dev/sir-teo.github.io-archive/gallery/index.html',
        ttl: 24 * HOUR,
        html: true,
        parse(data) {
            if (typeof data !== 'string') throw new Error('Invalid gallery')
            // Count the album's full-size links, not its thumbnails or unrelated images.
            const photos = new Set(
                Array.from(data.matchAll(/<a\b[^>]*\bhref=["'](images\/fulls\/[^"']+)["']/gi), match => match[1])
            )
            if (!photos.size) throw new Error('Gallery entries unavailable')
            return [stat('Photos', photos.size)]
        },
    },
}

// One request per provider even if a card is reopened while a request is in flight.
const memory = new Map<StatsId, StatsSnapshot>()
const requests = new Map<StatsId, Promise<StatsState>>()
const retryAt = new Map<StatsId, number>()

function readCache(id: StatsId): StatsSnapshot | undefined {
    if (memory.has(id)) return memory.get(id)
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + id)
        if (!raw) return
        const value = JSON.parse(raw) as StatsSnapshot
        const at = Date.parse(value.checkedAt)
        if (!Number.isFinite(at) || at > Date.now() || at < Date.now() - 7 * 24 * HOUR) return
        if (!Array.isArray(value.stats) || !value.stats.length) return
        if (value.stats.some(s => typeof s.label !== 'string' || typeof s.value !== 'string')) return
        memory.set(id, value)
        return value
    } catch {
        // Storage can be disabled, full, or contain an older/corrupt cache.
        return
    }
}

export function initialStats(id: StatsId): StatsState {
    return { snapshot: statsSnapshots[id], status: 'saved' }
}

export function canRefreshStats(id: StatsId): boolean {
    return Boolean(providers[id])
}

export function refreshStats(id: StatsId): Promise<StatsState> {
    const provider = providers[id]
    if (!provider) return Promise.resolve(initialStats(id))
    const cached = readCache(id)
    const fallback = cached ?? statsSnapshots[id]
    if (cached && Date.now() - Date.parse(cached.checkedAt) < provider.ttl) {
        return Promise.resolve({ snapshot: cached, status: 'current' })
    }
    const pending = requests.get(id)
    if (pending) return pending
    if (Date.now() < (retryAt.get(id) ?? 0)) {
        return Promise.resolve({ snapshot: fallback, status: 'unavailable' })
    }

    const request = (async (): Promise<StatsState> => {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)
        try {
            const response = await fetch(provider.url, {
                signal: controller.signal,
                credentials: 'omit',
                referrerPolicy: 'no-referrer',
            })
            if (!response.ok) throw new Error('Stats unavailable')
            const data: unknown = provider.html ? await response.text() : await response.json()
            const snapshot = { checkedAt: new Date().toISOString(), stats: provider.parse(data) }
            memory.set(id, snapshot)
            retryAt.delete(id)
            try {
                localStorage.setItem(CACHE_PREFIX + id, JSON.stringify(snapshot))
            } catch {
                // A successful response is still usable without persistent storage.
            }
            return { snapshot, status: 'current' }
        } catch {
            retryAt.set(id, Date.now() + RETRY_DELAY)
            return { snapshot: fallback, status: 'unavailable' }
        } finally {
            clearTimeout(timeout)
        }
    })()
    requests.set(id, request)
    void request.then(() => requests.delete(id))
    return request
}
