import { goCoordinate, type Position, type Scene } from './game'
import { UciQueue } from './uci'

export type Suggestion = { move: string; score: string; detail: string }
export type Analysis = {
    key?: string
    phase: 'loading' | 'thinking' | 'ready' | 'error' | 'paused'
    status: string
    suggestions: Suggestion[]
}
export type Engine = { analyze: (position: Position) => void; dispose: () => void }
export const engineName = (scene: Scene) =>
    scene === 'chess' ? 'Stockfish' : scene === 'xiangqi' ? 'Pikafish' : 'Neural Go'

// Only assets are shared with the full apps. Each open card owns one worker,
// with bounded searches and no worker or downloads surviving its disposal.
export function createEngine(scene: Scene, publish: (analysis: Analysis) => void): Engine {
    let disposed = false
    let worker: Worker | undefined
    let blob: string | undefined
    let bootTimer: ReturnType<typeof setTimeout> | undefined
    let searchTimer: ReturnType<typeof setTimeout> | undefined
    let queue: UciQueue | undefined
    let position: Position | undefined
    let ready = false
    let goId = 0
    const label = engineName(scene)
    const emit = (state: Analysis) => {
        if (!disposed) publish(state)
    }
    const dispose = () => {
        disposed = true
        clearTimeout(bootTimer)
        clearTimeout(searchTimer)
        queue?.dispose()
        if (worker) {
            worker.onmessage = null
            worker.onerror = event => event.preventDefault()
            worker.terminate()
        }
        if (blob) URL.revokeObjectURL(blob)
    }
    const fail = () => {
        if (disposed) return
        emit({
            key: position?.key,
            phase: 'error',
            status: `${label} couldn’t load. Retry or open the full app.`,
            suggestions: [],
        })
        dispose()
    }
    const send = (message: unknown) => {
        if (!disposed) worker?.postMessage(message)
    }
    const watchdog = () => {
        clearTimeout(searchTimer)
        searchTimer = setTimeout(fail, 30000)
    }
    const modelUrl = typeof location === 'undefined' ? '' : new URL('/live-engines/go/model.bin.gz', location.href).href
    const startGo = () => {
        if (!ready || !position || position.terminal || disposed) return
        const boards = position.goBoards!
        watchdog()
        send({
            type: 'katago:analyze',
            id: goId,
            analysisGroup: 'interactive',
            positionId: position.key,
            modelUrl,
            backend: 'wasm',
            board: boards[boards.length - 1],
            previousBoard: boards[boards.length - 2],
            previousPreviousBoard: boards[boards.length - 3],
            currentPlayer: position.turn === 0 ? 'black' : 'white',
            moveHistory: position.goHistory,
            komi: 6.5,
            rules: 'japanese',
            topK: 3,
            analysisPvLen: 5,
            visits: 64,
            maxTimeMs: 1600,
            batchSize: 4,
            maxChildren: 16,
            reportDuringSearchEveryMs: 150,
            ownershipMode: 'none',
            reuseTree: false,
            nnRandomize: false,
        })
    }
    const analyze = (next: Position) => {
        if (disposed) return
        if (scene === 'go') send({ type: 'katago:cancel', id: goId, analysisGroup: 'interactive' })
        goId++
        position = next
        clearTimeout(searchTimer)
        emit({
            key: next.key,
            phase: ready ? (next.terminal ? 'ready' : 'thinking') : 'loading',
            status: next.terminal ?? (ready ? 'Finding moves…' : `Loading ${label}…`),
            suggestions: [],
        })
        if (next.terminal) {
            queue?.cancel()
            return
        }
        if (scene === 'go') startGo()
        else {
            if (ready) watchdog()
            queue?.request({
                key: next.key,
                lineCount: Math.min(3, next.legal.length),
                command: `position startpos${next.moves.length ? ` moves ${next.moves.join(' ')}` : ''}`,
            })
        }
    }
    emit({ phase: 'loading', status: `Loading ${label}…`, suggestions: [] })
    bootTimer = setTimeout(fail, 120000)
    try {
        if (scene === 'go') {
            worker = new Worker('/live-engines/go/worker.js')
            worker.onmessage = ({ data }) => {
                if (disposed) return
                if (data.type === 'katago:init_result') {
                    if (!data.ok) {
                        fail()
                        return
                    }
                    clearTimeout(bootTimer)
                    ready = true
                    if (position) analyze(position)
                } else if (
                    (data.type === 'katago:analyze_result' || data.type === 'katago:analyze_update') &&
                    data.id === goId &&
                    position
                ) {
                    if (data.canceled) return
                    if (!data.ok || !data.analysis) {
                        fail()
                        return
                    }
                    const done = data.type === 'katago:analyze_result'
                    if (done) clearTimeout(searchTimer)
                    const analysis = data.analysis as {
                        rootVisits: number
                        moves: { x: number; y: number; scoreLead: number; winRate: number; pv: string[] }[]
                    }
                    emit({
                        key: position.key,
                        phase: done ? 'ready' : 'thinking',
                        status: `${analysis.rootVisits} visits · small model`,
                        suggestions: analysis.moves
                            .slice(0, 3)
                            .map(move => ({
                                move: goCoordinate(move.x, move.y),
                                score: `${move.scoreLead >= 0 ? 'B' : 'W'} +${Math.abs(move.scoreLead).toFixed(1)}`,
                                detail: `Black win estimate ${Math.round(
                                    move.winRate * 100
                                )}%. Quick hint from a small model.`,
                            }))
                            .filter(move => position!.legal.includes(move.move)),
                    })
                }
            }
            send({ type: 'katago:init', modelUrl, backend: 'wasm' })
        } else {
            const base = `https://teozeng.dev/${scene === 'chess' ? 'web-chess/engine/' : 'web-xiangqi/'}`
            const script = `${base}${scene === 'chess' ? 'stockfish-18-lite-single.js' : 'pikafish.js'}`
            blob = URL.createObjectURL(
                new Blob(
                    [
                        `${scene === 'chess' ? 'self.window=self;' : ''}
                self.addEventListener('unhandledrejection',()=>self.postMessage('__BOOT_ERROR__'));
                try{importScripts(${JSON.stringify(script)})}catch(e){self.postMessage('__BOOT_ERROR__')}`,
                    ],
                    { type: 'application/javascript' }
                )
            )
            worker = new Worker(
                blob + (scene === 'chess' ? `#${encodeURIComponent(base + 'stockfish-18-lite-single.wasm')}` : '')
            )
            queue = new UciQueue(
                send,
                (key, lines, done) => {
                    if (!position || position.key !== key) return
                    if (done) clearTimeout(searchTimer)
                    const side = position.turn === 0 ? (scene === 'chess' ? 'White' : 'Red') : 'Black'
                    emit({
                        key,
                        phase: done ? 'ready' : 'thinking',
                        status: `Depth ${Math.max(0, ...lines.map(line => line.depth))} · ${side}’s view`,
                        suggestions: lines
                            .filter(line => position!.legal.includes(line.move))
                            .slice(0, 3)
                            .map(line => ({
                                move: line.move,
                                score: line.mate
                                    ? `M${line.score}`
                                    : `${line.score >= 0 ? '+' : ''}${(line.score / 100).toFixed(2)}`,
                                detail: line.mate
                                    ? `${side} ${line.score >= 0 ? 'mates' : 'is mated'} in ${Math.abs(line.score)}`
                                    : `Evaluation for ${side}: ${(line.score / 100).toFixed(2)} pawns`,
                            })),
                    })
                },
                () => {
                    ready = true
                    clearTimeout(bootTimer)
                    if (position && !position.terminal) {
                        watchdog()
                        emit({ key: position.key, phase: 'thinking', status: 'Finding moves…', suggestions: [] })
                    }
                }
            )
            worker.onmessage = ({ data }) => {
                if (disposed) return
                if (typeof data === 'string') {
                    if (data.startsWith('__BOOT_ERROR__')) fail()
                    else queue?.receive(data)
                } else if (data?.type === 'inited') queue?.boot()
                else if (data?.type === 'error') fail()
                else if (data?.type === 'assetProgress') {
                    emit({
                        key: position?.key,
                        phase: 'loading',
                        status: data.done
                            ? 'Starting Pikafish…'
                            : `Loading Pikafish · ${(data.loaded / 1048576).toFixed(0)}${
                                  data.total ? ` / ${(data.total / 1048576).toFixed(0)}` : ''
                              } MB`,
                        suggestions: [],
                    })
                }
            }
            if (scene === 'chess') queue.boot()
            else
                send({
                    type: 'init',
                    basePath: base,
                    nnuePath: base + 'pikafish.nnue',
                    variant: 'single',
                    bootstrapVariant: 'single',
                    allowSIMD: false,
                    autoLoadNNUE: true,
                    autoTune: false,
                    autoHashMB: false,
                    threads: 1,
                    hashMB: 16,
                    reportAssetProgress: true,
                    coreScript: base + 'pikafish-core-single.js',
                })
        }
        worker.onerror = event => {
            event.preventDefault()
            fail()
        }
        worker.onmessageerror = fail
    } catch {
        fail()
    }
    return { analyze, dispose }
}
