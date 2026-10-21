import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let api: typeof import('./profileStats')
let saved: Map<string, string>
let fetchMock: ReturnType<typeof vi.fn>
const github = { login: 'Sir-Teo', public_repos: 86, followers: 26, created_at: '2017-10-07T15:39:14Z' }
const response = (data: unknown) => ({ ok: true, json: async () => data })

beforeEach(async () => {
    vi.resetModules()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-21T05:00:00Z'))
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
        expect(result.snapshot.checkedAt).toBe('2026-10-21T05:00:00.000Z')
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
