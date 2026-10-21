'use client'

import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import {
    buildPosition,
    legalFrom,
    moveLabel,
    moveTarget,
    ownPiece,
    pieceName,
    squareName,
    type Scene,
} from '../lib/live-analysis/game'
import { useAnalysis } from '../lib/live-analysis/useAnalysis'
import { engineName } from '../lib/live-analysis/engines'

// Retain a visitor's game across incidental hover closures, for this page only.
const sessions: Record<Scene, string[]> = { chess: [], xiangqi: [], go: [] }
const chessGlyph: Record<string, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
const xiangqiGlyph: Record<string, string> = {
    R: '車',
    N: '馬',
    B: '相',
    A: '仕',
    K: '帥',
    C: '炮',
    P: '兵',
    r: '車',
    n: '馬',
    b: '象',
    a: '士',
    k: '將',
    c: '砲',
    p: '卒',
}

export default function StudyPreview({ scene }: { scene: Scene }) {
    const [moves, setMoves] = useState(() => sessions[scene])
    const [selected, setSelected] = useState<string | null>(null)
    const [promotion, setPromotion] = useState<string[]>([])
    const [highlight, setHighlight] = useState<string | null>(null)
    const [focused, setFocused] = useState(scene === 'chess' ? 52 : scene === 'xiangqi' ? 70 : 40)
    const [notice, setNotice] = useState('')
    const boardRef = useRef<HTMLDivElement>(null)
    const position = useMemo(() => buildPosition(scene, moves), [scene, moves])
    const analysis = useAnalysis(position)
    const width = scene === 'chess' ? 8 : 9
    const height = scene === 'xiangqi' ? 10 : width
    const targets = selected ? legalFrom(position, selected).map(move => move.slice(2, 4)) : []
    const suggested = highlight ? moveTarget(scene, highlight) : null
    const last = moves.length ? moveTarget(scene, moves[moves.length - 1]) : null
    const update = (next: string[]) => {
        sessions[scene] = next
        setMoves(next)
        setSelected(null)
        setPromotion([])
        setHighlight(null)
        setNotice('')
    }
    const play = (move: string) => {
        if (position.terminal || !position.legal.includes(move)) return
        const label = moveLabel(position, move)
        update([...moves, move])
        setNotice(`${label} played.`)
    }
    const choose = (x: number, y: number) => {
        if (position.terminal) return
        const square = squareName(scene, x, y)
        if (scene === 'go') {
            if (position.legal.includes(square)) play(square)
            else setNotice('That point is not a legal move.')
            return
        }
        if (square === selected) {
            setSelected(null)
            setPromotion([])
            return
        }
        if (selected) {
            const options = position.legal.filter(move => move.startsWith(selected + square))
            if (options.length === 1) {
                play(options[0])
                return
            }
            if (options.length > 1) {
                setPromotion(options)
                return
            }
        }
        setPromotion([])
        if (ownPiece(position, position.board[y][x])) {
            setSelected(square)
            setNotice('')
        } else {
            setSelected(null)
            setNotice('Choose one of your pieces, then a marked square.')
        }
    }
    const navigate = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
        const x = index % width
        const y = Math.floor(index / width)
        const next =
            event.key === 'ArrowRight'
                ? y * width + Math.min(width - 1, x + 1)
                : event.key === 'ArrowLeft'
                ? y * width + Math.max(0, x - 1)
                : event.key === 'ArrowDown'
                ? Math.min(height - 1, y + 1) * width + x
                : event.key === 'ArrowUp'
                ? Math.max(0, y - 1) * width + x
                : event.key === 'Home'
                ? y * width
                : event.key === 'End'
                ? (y + 1) * width - 1
                : null
        if (next === null) return
        event.preventDefault()
        setFocused(next)
        boardRef.current?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus()
    }
    return (
        <div className={`live-study live-study-${scene}`}>
            <div className="live-toolbar">
                <span>{position.terminal ? 'Game finished' : position.turnLabel}</span>
                <div role="group" aria-label="Board controls">
                    {scene === 'go' && (
                        <button type="button" onClick={() => play('pass')} disabled={!!position.terminal}>
                            Pass
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => update(moves.slice(0, -1))}
                        disabled={!moves.length}
                        aria-label="Undo last move"
                    >
                        ↶ Undo
                    </button>
                    <button type="button" onClick={() => update([])} disabled={!moves.length}>
                        Reset
                    </button>
                </div>
            </div>
            <div className="live-board-wrap">
                <div
                    ref={boardRef}
                    className="live-board"
                    role="group"
                    aria-label={`${
                        scene === 'go' ? '9 by 9 Go' : scene === 'chess' ? 'Chess' : 'Xiangqi'
                    } board. Arrow keys move between squares; Enter plays.`}
                    style={{ '--board-columns': width, '--board-rows': height } as CSSProperties}
                >
                    {scene !== 'chess' && <BoardLines scene={scene} />}
                    {scene !== 'chess' && (
                        <div
                            className="live-ranks"
                            aria-hidden="true"
                            style={{ gridTemplateRows: `repeat(${height}, 1fr)` }}
                        >
                            {Array.from({ length: height }, (_, y) => (
                                <span key={y}>{9 - y}</span>
                            ))}
                        </div>
                    )}
                    {position.board.flatMap((row, y) =>
                        row.map((piece, x) => {
                            const square = squareName(scene, x, y)
                            const index = y * width + x
                            const target = targets.includes(square)
                            const marked = suggested?.[0] === x && suggested?.[1] === y
                            const isLast = last?.[0] === x && last?.[1] === y
                            return (
                                <button
                                    key={square}
                                    type="button"
                                    className="live-square"
                                    tabIndex={focused === index ? 0 : -1}
                                    aria-label={`${square}: ${pieceName(scene, piece)}${
                                        target ? ', legal destination' : ''
                                    }${isLast ? ', last move' : ''}`}
                                    aria-pressed={scene !== 'go' ? selected === square : undefined}
                                    data-dark={(x + y) % 2 === 1}
                                    data-target={target}
                                    data-hint={marked}
                                    data-last={isLast}
                                    onFocus={() => setFocused(index)}
                                    onKeyDown={event => navigate(event, index)}
                                    onClick={() => choose(x, y)}
                                >
                                    {piece && (
                                        <span
                                            className="live-piece"
                                            data-side={
                                                scene === 'go'
                                                    ? piece === 'B'
                                                        ? 'first'
                                                        : 'second'
                                                    : piece === piece.toUpperCase()
                                                    ? 'first'
                                                    : 'second'
                                            }
                                            aria-hidden="true"
                                        >
                                            {scene === 'chess'
                                                ? chessGlyph[piece.toLowerCase()]
                                                : scene === 'xiangqi'
                                                ? xiangqiGlyph[piece]
                                                : ''}
                                        </span>
                                    )}
                                    {scene === 'chess' && (x === 0 || y === 7) && (
                                        <small aria-hidden="true">{x === 0 && y !== 7 ? 8 - y : square[0]}</small>
                                    )}
                                </button>
                            )
                        })
                    )}
                </div>
                {scene !== 'chess' && (
                    <div className="live-files" aria-hidden="true">
                        {(scene === 'go' ? 'ABCDEFGHJ' : 'abcdefghi').split('').map(file => (
                            <span key={file}>{file}</span>
                        ))}
                    </div>
                )}
            </div>
            {promotion.length > 0 && (
                <div className="live-promotion" role="group" aria-label="Choose promotion piece">
                    <span>Promote to</span>
                    {['q', 'r', 'b', 'n'].map(piece => (
                        <button
                            key={piece}
                            type="button"
                            onClick={() => play(promotion.find(move => move[4] === piece)!)}
                            aria-label={`Promote to ${pieceName('chess', piece).split(' ')[1]}`}
                        >
                            {chessGlyph[piece]}
                        </button>
                    ))}
                </div>
            )}
            <div className="live-analysis" aria-busy={analysis.phase === 'loading' || analysis.phase === 'thinking'}>
                <div className="live-engine-label">
                    <strong>
                        <i data-phase={analysis.phase} />
                        {engineName(scene)} <span>live</span>
                    </strong>
                    <span>{scene === 'go' ? 'Quick hints · 9×9' : 'Try a move'}</span>
                </div>
                <div className="live-suggestions" role="group" aria-label="Engine suggestions">
                    {analysis.suggestions.map((suggestion, index) => (
                        <button
                            key={suggestion.move}
                            type="button"
                            title={suggestion.detail}
                            aria-label={`Play ${moveLabel(position, suggestion.move)}. ${suggestion.detail}`}
                            onPointerEnter={event => {
                                if (event.pointerType !== 'touch') setHighlight(suggestion.move)
                            }}
                            onPointerLeave={() => setHighlight(null)}
                            onFocus={() => setHighlight(suggestion.move)}
                            onBlur={() => setHighlight(null)}
                            onClick={() => play(suggestion.move)}
                        >
                            <span>
                                <small>{index + 1}</small>
                                <strong>{moveLabel(position, suggestion.move)}</strong>
                                <span aria-hidden="true">↗</span>
                            </span>
                            <em>{suggestion.score}</em>
                        </button>
                    ))}
                    {!analysis.suggestions.length && (
                        <p>
                            {position.terminal ??
                                (analysis.phase === 'error'
                                    ? 'Your board still works.'
                                    : analysis.phase === 'loading'
                                    ? 'Warming up the engine…'
                                    : 'Reading your position…')}
                        </p>
                    )}
                </div>
                <div className="live-analysis-status">
                    <span role="status">{position.terminal ?? analysis.status}</span>
                    {analysis.phase === 'error' && (
                        <button type="button" onClick={analysis.retry}>
                            Retry
                        </button>
                    )}
                </div>
                <p className="live-instruction">
                    {scene === 'go'
                        ? 'Place a stone. Or play an engine hint.'
                        : 'Pick a piece, then a square. Or play a hint.'}
                </p>
            </div>
            <span className="sr-only" aria-live="polite">
                {notice} {position.terminal ?? position.turnLabel}
            </span>
        </div>
    )
}

function BoardLines({ scene }: { scene: 'xiangqi' | 'go' }) {
    const rows = scene === 'xiangqi' ? 10 : 9
    return (
        <svg className="live-board-lines" viewBox={`0 0 9 ${rows}`} preserveAspectRatio="none" aria-hidden="true">
            <g stroke="currentColor" strokeWidth=".025" fill="none">
                {Array.from({ length: rows }, (_, y) => (
                    <path key={`h${y}`} d={`M.5 ${y + 0.5}H8.5`} />
                ))}
                {Array.from({ length: 9 }, (_, x) => (
                    <path
                        key={`v${x}`}
                        d={
                            scene === 'go' || x === 0 || x === 8
                                ? `M${x + 0.5} .5V${rows - 0.5}`
                                : `M${x + 0.5} .5V4.5M${x + 0.5} 5.5V9.5`
                        }
                    />
                ))}
                {scene === 'xiangqi' && <path d="M3.5 .5 5.5 2.5M5.5 .5 3.5 2.5M3.5 7.5 5.5 9.5M5.5 7.5 3.5 9.5" />}
            </g>
            {scene === 'go' ? (
                [
                    [2, 2],
                    [6, 2],
                    [4, 4],
                    [2, 6],
                    [6, 6],
                ].map(([x, y]) => <circle key={`${x},${y}`} cx={x + 0.5} cy={y + 0.5} r=".075" fill="currentColor" />)
            ) : (
                <text x="4.5" y="5.15" textAnchor="middle" fontSize=".38" fill="currentColor" letterSpacing=".4">
                    楚 河　漢 界
                </text>
            )}
        </svg>
    )
}
