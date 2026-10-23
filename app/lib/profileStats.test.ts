import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import snapshots from '../data/stats.json'

let api: typeof import('./profileStats')
let saved: Map<string, string>
let fetchMock: ReturnType<typeof vi.fn>
const github = { login: 'Sir-Teo', public_repos: 86, followers: 26, created_at: '2017-10-07T15:39:14Z' }
const response = (data: unknown) => ({ ok: true, json: async () => data })
const testNow = new Date(Math.max(...Object.values(snapshots).map(s => Date.parse(s.checkedAt))) + 60 * 60 * 1000)
// Text fields observed in LeetCard's public SVG response; foreign markup is never rendered.
const leetCard = `<svg><text id="username-text">user5137</text>
    <text id="total-solved-text">186</text>
    <text id="easy-solved-count">70 / 972</text>
    <text id="medium-solved-count">100 / 2131</text>
    <text id="hard-solved-count">16 / 984</text></svg>`
const duo = {
    id: 625409208,
    username: 'sirteo',
    streak: 895,
    totalXp: 127398,
    courses: [{ id: 'DUOLINGO_ES_EN' }, { id: 'DUOLINGO_FR_EN' }],
}

beforeEach(async () => {
    vi.resetModules()
    vi.useFakeTimers()
    vi.setSystemTime(testNow)
    saved = new Map()
    vi.stubGlobal('localStorage', {
        getItem: (key: string) => saved.get(key) ?? null,
        setItem: (key: string, value: string) => saved.set(key, value),
    })
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    api = await import('./profileStats')
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
})

describe('public profile stats', () => {
    it('extracts LeetCode solved counts without loading the external SVG into the page', async () => {
        fetchMock.mockResolvedValue({ ok: true, text: async () => leetCard })
        const result = await api.refreshStats('leetcode')
        expect(result.status).toBe('current')
        expect(result.snapshot.stats).toEqual([
            { label: 'Solved', value: '186' },
            { label: 'Easy', value: '70' },
            { label: 'Medium', value: '100' },
            { label: 'Hard', value: '16' },
        ])
    })

    it.each([
        leetCard.replace('user5137', 'Failed to fetch user data'),
        leetCard.replace('>186<', '>999<'),
        leetCard.replace('70 / 972', 'N/A'),
        '<html>Service unavailable</html>',
    ])('rejects error cards and inconsistent counts even when HTTP is 200', async svg => {
        fetchMock.mockResolvedValue({ ok: true, text: async () => svg })
        expect(await api.refreshStats('leetcode')).toEqual({ ...api.initialStats('leetcode'), status: 'unavailable' })
        expect(saved.size).toBe(0)
    })

    it('refreshes Duolingo streak, XP and distinct courses from the expected public account', async () => {
        fetchMock.mockResolvedValue(response({ ...duo, courses: [...duo.courses, duo.courses[0]] }))
        const result = await api.refreshStats('duolingo')
        expect(result.status).toBe('current')
        expect(result.snapshot.stats).toEqual([
            { label: 'Day streak', value: '895' },
            { label: 'XP', value: '127,398' },
            { label: 'Courses', value: '2' },
        ])
    })

    it.each([
        { error: 'upstream_unavailable' },
        { ...duo, id: 1 },
        { ...duo, streak: null },
        { ...duo, courses: null },
    ])('keeps the dated Duolingo snapshot for errors or missing data', async data => {
        fetchMock.mockResolvedValue(response(data))
        expect(await api.refreshStats('duolingo')).toEqual({ ...api.initialStats('duolingo'), status: 'unavailable' })
    })

    it('allows a real zero-day streak without treating a missing streak as zero', async () => {
        fetchMock.mockResolvedValue(response({ ...duo, streak: 0 }))
        const result = await api.refreshStats('duolingo')
        expect(result.status).toBe('current')
        expect(result.snapshot.stats[0]).toEqual({ label: 'Day streak', value: '0' })
    })

    it('uses public GitHub counters and derives the account year', async () => {
        fetchMock.mockResolvedValue(response(github))
        const result = await api.refreshStats('github')
        expect(result.status).toBe('current')
        expect(result.snapshot.stats).toEqual([
            { label: 'Public repos', value: '86' },
            { label: 'Followers', value: '26' },
            { label: 'Since', value: '2017' },
        ])
    })

    it('labels the highest puzzle rating and allows missing unrated chess modes', async () => {
        fetchMock.mockResolvedValue(
            response({ chess_rapid: { last: { rating: 800 } }, tactics: { highest: { rating: 1600 } } })
        )
        expect((await api.refreshStats('chess')).snapshot.stats).toEqual([
            { label: 'Rapid', value: '800' },
            { label: 'Best puzzle', value: '1600' },
        ])
    })

    it('uses the OGS overall rating rather than its unrelated ranking field', async () => {
        fetchMock.mockResolvedValue(response({ id: 622443, ranking: 27.3, ratings: { overall: { rating: 1707.55 } } }))
        expect((await api.refreshStats('ogs')).snapshot.stats).toEqual([{ label: 'Overall rating', value: '1708' }])
    })

    it('counts unique published blog articles and excludes index pages', async () => {
        fetchMock.mockResolvedValue(
            response([
                { url: '/blogs/2026/10/18/first.html' },
                { url: '/blogs/2026/10/18/first.html' },
                { url: '/blogs/2026/10/19/second.html' },
                { url: '/blogs/about/' },
            ])
        )
        expect((await api.refreshStats('blog')).snapshot.stats).toEqual([{ label: 'Articles', value: '2' }])
    })

    it('counts gallery photos once and ignores thumbnails and unrelated images', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            text: async () => `
            <a href="images/fulls/1.jpg"><img src="images/thumbs/1.jpg"></a>
            <a class="image" href="images/fulls/2.jpg"></a>
            <a href="images/fulls/1.jpg"></a><img src="avatar.jpg">`,
        })
        expect((await api.refreshStats('gallery')).snapshot.stats).toEqual([{ label: 'Photos', value: '2' }])
    })

    it('accepts an empty article index but never treats an error payload as zero', async () => {
        fetchMock.mockResolvedValueOnce(response([]))
        expect((await api.refreshStats('blog')).snapshot.stats[0].value).toBe('0')
        vi.advanceTimersByTime(2 * 60 * 60 * 1000)
        fetchMock.mockResolvedValueOnce(response({ message: 'Service unavailable' }))
        const result = await api.refreshStats('blog')
        expect(result.status).toBe('unavailable')
        expect(result.snapshot.stats[0].value).toBe('0')
        expect(result.snapshot.checkedAt).toBe(testNow.toISOString())
    })

    it('keeps the last successful values and timestamp on failure and backs off', async () => {
        fetchMock.mockResolvedValueOnce(response(github))
        const first = await api.refreshStats('github')
        vi.advanceTimersByTime(2 * 60 * 60 * 1000)
        fetchMock.mockResolvedValue({ ok: false, status: 429 })
        const failed = await api.refreshStats('github')
        expect(failed).toEqual({ status: 'unavailable', snapshot: first.snapshot })
        await api.refreshStats('github')
        expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('reuses a fresh persistent cache after a page reload', async () => {
        fetchMock.mockResolvedValue(response(github))
        const first = await api.refreshStats('github')
        vi.resetModules()
        const reloaded = await import('./profileStats')
        expect(await reloaded.refreshStats('github')).toEqual(first)
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('does not let an older browser cache replace a newly verified snapshot', async () => {
        const snapshot = api.initialStats('github').snapshot
        const checked = Date.parse(snapshot.checkedAt)
        vi.setSystemTime(checked + 5 * 60 * 1000)
        saved.set(
            'teozeng:profile-stats:v1:github',
            JSON.stringify({
                checkedAt: new Date(checked - 5 * 60 * 1000).toISOString(),
                stats: [{ label: 'Followers', value: '1' }],
            })
        )
        fetchMock.mockResolvedValue({ ok: false, status: 429 })
        expect(await api.refreshStats('github')).toEqual({ snapshot, status: 'unavailable' })
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('deduplicates requests while a card is reopened', async () => {
        let finish!: (value: ReturnType<typeof response>) => void
        fetchMock.mockImplementation(
            () =>
                new Promise(resolve => {
                    finish = resolve
                })
        )
        const first = api.refreshStats('github')
        const second = api.refreshStats('github')
        expect(first).toBe(second)
        finish(response(github))
        await first
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('rejects corrupt local storage and malformed API counters', async () => {
        saved.set('teozeng:profile-stats:v1:github', '{broken')
        fetchMock.mockResolvedValue(response({ ...github, followers: -1 }))
        expect(await api.refreshStats('github')).toEqual({ ...api.initialStats('github'), status: 'unavailable' })
    })

    it('still displays fresh data if browser storage is unavailable', async () => {
        vi.stubGlobal('localStorage', {
            getItem() {
                throw new Error('Disabled')
            },
            setItem() {
                throw new Error('Full')
            },
        })
        fetchMock.mockResolvedValue(response(github))
        expect((await api.refreshStats('github')).status).toBe('current')
    })

    it('times out a stalled service without discarding the fallback', async () => {
        fetchMock.mockImplementation(
            (_url, options) =>
                new Promise((_resolve, reject) => {
                    options.signal.addEventListener('abort', () => reject(new Error('Aborted')))
                })
        )
        const pending = api.refreshStats('github')
        await vi.advanceTimersByTimeAsync(8000)
        expect(await pending).toEqual({ ...api.initialStats('github'), status: 'unavailable' })
    })

    it('keeps Genshin explicitly snapshot-only without attempting a blocked request', async () => {
        expect(api.canRefreshStats('genshin')).toBe(false)
        expect(await api.refreshStats('genshin')).toEqual(api.initialStats('genshin'))
        expect(fetchMock).not.toHaveBeenCalled()
    })
})
