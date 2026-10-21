export type UciLine = { move: string; pv: string[]; depth: number; score: number; mate: boolean; rank: number }
export function parseUciInfo(line: string): UciLine | null {
    const pv = line
        .match(/\bpv\s+(.+)$/)?.[1]
        .trim()
        .split(/\s+/)
    const score = line.match(/\bscore (cp|mate) (-?\d+)/)
    if (!line.startsWith('info ') || !pv?.length || !score || /\b(upperbound|lowerbound)\b/.test(line)) return null
    return {
        move: pv[0],
        pv,
        depth: Number(line.match(/\bdepth (\d+)/)?.[1] ?? 0),
        score: Number(score[2]),
        mate: score[1] === 'mate',
        rank: Number(line.match(/\bmultipv (\d+)/)?.[1] ?? 1),
    }
}
type Request = { key: string; command: string; lineCount?: number }

// UCI has no request IDs. A canceled search must reach bestmove before another
// position can start, otherwise late info can be shown on the wrong board.
export class UciQueue {
    private ready = false
    private disposed = false
    private active: Request | null = null
    private pending: Request | null = null
    private wanted: string | null = null
    private stopping = false
    private lines = new Map<number, UciLine>()
    private complete: UciLine[] = []
    private depth = -1
    constructor(
        private send: (command: string) => void,
        private update: (key: string, lines: UciLine[], done: boolean) => void,
        private onReady: () => void
    ) {}
    boot() {
        this.send('uci')
    }
    request(request: Request) {
        this.wanted = request.key
        this.pending = request
        if (this.active && !this.stopping) {
            this.stopping = true
            this.send('stop')
        }
        this.start()
    }
    cancel() {
        this.wanted = null
        this.pending = null
        if (this.active && !this.stopping) {
            this.stopping = true
            this.send('stop')
        }
    }
    dispose() {
        this.disposed = true
        this.pending = null
        this.active = null
    }
    private start() {
        if (this.disposed || !this.ready || this.active || !this.pending) return
        this.active = this.pending
        this.pending = null
        this.stopping = false
        this.lines.clear()
        this.complete = []
        this.depth = -1
        this.send(this.active.command)
        this.send('go movetime 900')
    }
    receive(raw: string) {
        if (this.disposed) return
        for (const line of raw.split(/\r?\n/)) {
            if (line.trim() === 'uciok' && !this.ready) {
                this.send('setoption name Threads value 1')
                this.send('setoption name Hash value 16')
                this.send('setoption name MultiPV value 3')
                this.send('isready')
            } else if (line.trim() === 'readyok' && !this.ready) {
                this.ready = true
                this.onReady()
                this.start()
            } else if (line.startsWith('bestmove')) {
                if (this.active && !this.stopping && this.active.key === this.wanted)
                    this.update(this.active.key, this.complete.length ? this.complete : this.currentLines(), true)
                this.active = null
                this.stopping = false
                this.start()
            } else if (this.active && !this.stopping && this.active.key === this.wanted) {
                const info = parseUciInfo(line)
                if (info) {
                    // Rankings can change between depths. Publish a complete
                    // iteration so the same move cannot occupy two slots.
                    if (info.depth > this.depth) {
                        this.depth = info.depth
                        this.lines.clear()
                    }
                    if (info.depth < this.depth) continue
                    this.lines.set(info.rank, info)
                    const lines = this.currentLines()
                    if (lines.length >= (this.active.lineCount ?? 3)) {
                        this.complete = lines
                        this.update(this.active.key, lines, false)
                    }
                }
            }
        }
    }
    private currentLines() {
        const seen = new Set<string>()
        return Array.from(this.lines.values())
            .sort((a, b) => a.rank - b.rank)
            .filter(line => {
                if (seen.has(line.move)) return false
                seen.add(line.move)
                return true
            })
    }
}
