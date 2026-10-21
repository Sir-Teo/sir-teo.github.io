'use client'

import { useEffect, useId, useState } from 'react'
import type { ReviewGame, ReviewFrame, ReviewScene } from '../lib/review'
import { evaluationText, graphPath } from '../lib/review'

const cache = new Map<ReviewScene, Promise<ReviewGame>>()
const positions: Partial<Record<ReviewScene, number>> = {}
const glyphs: Record<string, string> = {
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

export default function ReviewPreview({ scene }: { scene: ReviewScene }) {
    const [game, setGame] = useState<ReviewGame | null>(null)
    const [error, setError] = useState(false)
    const [retry, setRetry] = useState(0)
    useEffect(() => {
        let active = true
        setError(false)
        if (!cache.has(scene)) {
            cache.set(
                scene,
                fetch(`/previews/reviews/${scene}.json`)
                    .then(response => {
                        if (!response.ok) throw new Error('Review unavailable')
                        return response.json()
                    })
                    .catch(error => {
                        cache.delete(scene)
                        throw error
                    })
            )
        }
        void cache
            .get(scene)!
            .then(data => {
                if (active) setGame(data)
            })
            .catch(() => {
                if (active) setError(true)
            })
        return () => {
            active = false
        }
    }, [scene, retry])
    if (error)
        return (
            <div className="preview-loading review-loading">
                <button onClick={() => setRetry(n => n + 1)}>Retry game review</button>
            </div>
        )
    if (!game)
        return (
            <div className="preview-loading review-loading" role="status">
                Opening the game…
            </div>
        )
    return <GameReview game={game} />
}

function GameReview({ game }: { game: ReviewGame }) {
    const [step, setStep] = useState(positions[game.scene] ?? game.start)
    const [playing, setPlaying] = useState(false)
    const [selected, setSelected] = useState(0)
    const last = game.frames.length - 1
    const frame = game.frames[step]
    const line = frame.lines[selected]
    const firstSide = game.scene === 'chess' ? 'White' : game.scene === 'xiangqi' ? 'Red' : 'Black'
    const choose = (next: number) => {
        setPlaying(false)
        setSelected(0)
        setStep(Math.max(0, Math.min(last, next)))
    }
    useEffect(() => {
        positions[game.scene] = step
    }, [game.scene, step])
    useEffect(() => {
        const hide = () => {
            if (document.hidden) setPlaying(false)
        }
        document.addEventListener('visibilitychange', hide)
        return () => document.removeEventListener('visibilitychange', hide)
    }, [])
    useEffect(() => {
        if (!playing) return
        if (step === last) {
            setPlaying(false)
            return
        }
        const timer = window.setTimeout(() => {
            setSelected(0)
            setStep(step + 1)
        }, 1100)
        return () => window.clearTimeout(timer)
    }, [playing, step, last])

    return (
        <div
            className="recorded-review"
            role="group"
            aria-label={`${game.title} game review`}
            onKeyDown={event => {
                if (event.target instanceof HTMLInputElement) return
                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                    event.preventDefault()
                    choose(step + (event.key === 'ArrowLeft' ? -1 : 1))
                } else if (event.key === 'Home' || event.key === 'End') {
                    event.preventDefault()
                    choose(event.key === 'Home' ? 0 : last)
                }
            }}
        >
            <div className="review-layout">
                <div className="review-stage">
                    <p className="review-game-title">{game.title}</p>
                    <ReviewBoard scene={game.scene} frame={frame} line={line} />
                </div>
                <div className="review-inspector">
                    <div className="review-move" aria-live={playing ? 'off' : 'polite'}>
                        <strong>{frame.label}</strong>
                        {frame.quality && (
                            <span data-quality={frame.quality}>{frame.planted ? 'Planted slip' : frame.quality}</span>
                        )}
                    </div>
                    <div className="review-evaluation">
                        <strong>{evaluationText(game.scene, frame)}</strong>
                        <span>{step === last ? 'Game over' : `${frame.turn} to move`}</span>
                    </div>
                    <div className="review-graph">
                        <svg viewBox="0 0 320 44" preserveAspectRatio="none" aria-hidden="true">
                            <path d="M4 22H316" className="review-zero" />
                            <path d={graphPath(game.frames)} className="review-curve" />
                            <path d={`M${4 + (312 * step) / last} 2V42`} className="review-cursor" />
                            <circle cx={4 + (312 * step) / last} cy={40 - frame.balance * 0.36} r="3.5" />
                        </svg>
                        <input
                            type="range"
                            min={0}
                            max={last}
                            step={1}
                            value={step}
                            aria-label="Game move"
                            aria-valuetext={`${frame.label}. ${evaluationText(game.scene, frame)}`}
                            title={`${firstSide} winning-chance curve. Drag to explore the game.`}
                            onChange={event => choose(Number(event.target.value))}
                        />
                    </div>
                    <div className="review-transport">
                        <button
                            type="button"
                            aria-label="Previous move"
                            aria-keyshortcuts="ArrowLeft"
                            title="Previous move (←)"
                            disabled={step === 0}
                            onClick={() => choose(step - 1)}
                        >
                            <ControlIcon name="previous" />
                        </button>
                        <button
                            type="button"
                            aria-label={playing ? 'Pause game replay' : 'Play game replay'}
                            className="review-play"
                            data-playing={playing}
                            title={playing ? 'Pause replay' : step === last ? 'Replay from the start' : 'Play the game'}
                            onClick={() => {
                                if (!playing && step === last) {
                                    setSelected(0)
                                    setStep(0)
                                }
                                setPlaying(!playing)
                            }}
                        >
                            <ControlIcon name={playing ? 'pause' : 'play'} />
                        </button>
                        <button
                            type="button"
                            aria-label="Next move"
                            aria-keyshortcuts="ArrowRight"
                            title="Next move (→)"
                            disabled={step === last}
                            onClick={() => choose(step + 1)}
                        >
                            <ControlIcon name="next" />
                        </button>
                        <span title="Position in the recorded game">
                            {step} / {last}
                        </span>
                    </div>
                    <div className="review-lines" role="group" aria-label="Recorded engine suggestions">
                        {frame.lines.map((candidate, index) => (
                            <button
                                key={index}
                                type="button"
                                aria-pressed={selected === index}
                                aria-label={`Show line ${index + 1}: ${candidate.text}. ${evaluationText(
                                    game.scene,
                                    candidate
                                )}`}
                                title={`${candidate.text} · ${evaluationText(game.scene, candidate)}`}
                                onPointerEnter={event => {
                                    if (event.pointerType !== 'touch') {
                                        setPlaying(false)
                                        setSelected(index)
                                    }
                                }}
                                onFocus={() => {
                                    setPlaying(false)
                                    setSelected(index)
                                }}
                                onClick={() => {
                                    setPlaying(false)
                                    setSelected(index)
                                }}
                            >
                                <strong>{candidate.label}</strong>
                                <span>{evaluationText(game.scene, candidate, true)}</span>
                            </button>
                        ))}
                        {!frame.lines.length && <span className="review-end">End of the game</span>}
                    </div>
                    <p className="review-continuation" aria-live={playing ? 'off' : 'polite'} title={line?.text}>
                        {line ? line.text : 'Drag the curve to revisit a move.'}
                    </p>
                    <p className="review-source">{game.engine}</p>
                </div>
            </div>
        </div>
    )
}

function ControlIcon({ name }: { name: 'previous' | 'next' | 'play' | 'pause' }) {
    return (
        <svg
            viewBox="0 0 20 20"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
        >
            {name === 'previous' ? (
                <path d="m12 5-5 5 5 5" />
            ) : name === 'next' ? (
                <path d="m8 5 5 5-5 5" />
            ) : name === 'pause' ? (
                <path d="M7 5v10M13 5v10" />
            ) : (
                <path d="m7 4 9 6-9 6Z" fill="currentColor" stroke="none" />
            )}
        </svg>
    )
}

function ReviewBoard({
    scene,
    frame,
    line,
}: {
    scene: ReviewScene
    frame: ReviewFrame
    line?: ReviewFrame['lines'][number]
}) {
    const id = useId().replace(/:/g, '')
    const width = scene === 'chess' ? 8 : 9
    const height = scene === 'xiangqi' ? 10 : width
    const chess = scene === 'chess'
    const go = scene === 'go'
    const arrows = line?.moves ?? []
    const grid = Array.from({ length: width }, (_, x) => x)
    return (
        <svg
            className={`review-board review-board-${scene}`}
            viewBox={`-.38 ${scene === 'xiangqi' ? '-.38' : '-.08'} ${width + 0.46} ${
                height + (scene === 'xiangqi' ? 0.76 : 0.46)
            }`}
            role="img"
            aria-label={`${scene === 'go' ? 'Go' : scene === 'chess' ? 'Chess' : 'Xiangqi'} board after ${frame.label}${
                line ? `. Suggested line: ${line.text}` : ''
            }`}
        >
            <defs>
                <clipPath id={`${id}-board`}>
                    <rect width={width} height={height} rx=".12" />
                </clipPath>
                <marker id={id} markerWidth="3" markerHeight="3" refX="2.3" refY="1.5" orient="auto">
                    <path d="M0 0 3 1.5 0 3Z" fill="currentColor" />
                </marker>
            </defs>
            <g className="review-coordinates" aria-hidden="true">
                {grid.map(x => (
                    <text key={`file${x}`} x={x + 0.5} y={height + 0.22}>
                        {chess ? 'abcdefgh'[x] : go ? 'ABCDEFGHJ'[x] : '九八七六五四三二一'[x]}
                    </text>
                ))}
                {scene === 'xiangqi'
                    ? grid.map(x => (
                          <text key={`opponent${x}`} x={x + 0.5} y="-.19">
                              {x + 1}
                          </text>
                      ))
                    : Array.from({ length: height }, (_, y) => (
                          <text key={`rank${y}`} x="-.22" y={y + 0.52}>
                              {height - y}
                          </text>
                      ))}
            </g>
            <g clipPath={`url(#${id}-board)`}>
                <rect width={width} height={height} rx=".12" fill={chess ? '#f0d9b5' : '#e6c38b'} />
                {chess ? (
                    frame.board.flatMap((row, y) =>
                        row
                            .split('')
                            .map((_, x) =>
                                (x + y) % 2 ? (
                                    <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#b58863" />
                                ) : null
                            )
                    )
                ) : (
                    <g stroke="#855f36" strokeWidth=".024" fill="none">
                        {Array.from({ length: height }, (_, y) => (
                            <path key={`h${y}`} d={`M.5 ${y + 0.5}H${width - 0.5}`} />
                        ))}
                        {grid.map(x => (
                            <path
                                key={`v${x}`}
                                d={
                                    go || x === 0 || x === 8
                                        ? `M${x + 0.5} .5V${height - 0.5}`
                                        : `M${x + 0.5} .5V4.5M${x + 0.5} 5.5V9.5`
                                }
                            />
                        ))}
                        {!go && <path d="m3.5 .5 2 2m-2 0 2-2m-2 7 2 2m-2 0 2-2" />}
                    </g>
                )}
                {scene === 'xiangqi' && (
                    <g className="review-river" fill="#855f36">
                        <text x="2.5" y="5">
                            楚 河
                        </text>
                        <text x="6.5" y="5">
                            漢 界
                        </text>
                    </g>
                )}
                {go &&
                    [
                        [2, 2],
                        [6, 2],
                        [4, 4],
                        [2, 6],
                        [6, 6],
                    ].map(([x, y]) => <circle key={`${x}-${y}`} cx={x + 0.5} cy={y + 0.5} r=".055" fill="#6b482b" />)}
                {frame.last && (
                    <rect
                        x={frame.last[0] + 0.03}
                        y={frame.last[1] + 0.03}
                        width=".94"
                        height=".94"
                        rx={go ? '.45' : '.08'}
                        fill="#eec849"
                        opacity=".55"
                    />
                )}
                <g>
                    {frame.board.flatMap((row, y) =>
                        row.split('').map((piece, x) => {
                            if (piece === '.') return null
                            const first = go ? piece === 'x' : piece === piece.toUpperCase()
                            if (chess)
                                return (
                                    <use
                                        key={`${x}-${y}`}
                                        href={`/previews/reviews/chess-pieces.svg#${
                                            first ? 'w' : 'b'
                                        }${piece.toUpperCase()}`}
                                        x={x + 0.035}
                                        y={y + 0.035}
                                        width=".93"
                                        height=".93"
                                    />
                                )
                            return (
                                <g key={`${x}-${y}`}>
                                    <circle
                                        cx={x + 0.5}
                                        cy={y + 0.5}
                                        r={go ? '.43' : '.41'}
                                        fill={go ? (first ? '#22262a' : '#fcfaf4') : '#f9e3b8'}
                                        stroke={go ? (first ? '#111' : '#aaa79e') : first ? '#b82e25' : '#2d3540'}
                                        strokeWidth={go ? '.025' : '.03'}
                                    />
                                    {!go && (
                                        <text
                                            x={x + 0.5}
                                            y={y + 0.52}
                                            className="review-xiangqi-piece"
                                            fill={first ? '#b82e25' : '#2d3540'}
                                        >
                                            {glyphs[piece]}
                                        </text>
                                    )}
                                    {go && frame.last?.[0] === x && frame.last?.[1] === y && (
                                        <circle cx={x + 0.5} cy={y + 0.5} r=".095" fill="#ddab32" />
                                    )}
                                </g>
                            )
                        })
                    )}
                </g>
                {go ? (
                    arrows.map((move, i) => {
                        if (!move || frame.board[move[1]][move[0]] !== '.') return null
                        const black = (frame.turn === 'Black') === (i % 2 === 0)
                        return (
                            <g key={i} opacity=".9">
                                <circle
                                    cx={move[0] + 0.5}
                                    cy={move[1] + 0.5}
                                    r=".38"
                                    fill={black ? '#252b31' : '#fff'}
                                    stroke="#31977a"
                                    strokeWidth=".055"
                                />
                                <text
                                    className="review-go-number"
                                    x={move[0] + 0.5}
                                    y={move[1] + 0.52}
                                    fill={black ? '#fff' : '#252b31'}
                                >
                                    {i + 1}
                                </text>
                            </g>
                        )
                    })
                ) : (
                    <g
                        className="review-arrows"
                        stroke="currentColor"
                        strokeWidth=".13"
                        fill="none"
                        strokeLinecap="round"
                    >
                        {arrows.map(
                            (move, i) =>
                                move && (
                                    <path
                                        key={i}
                                        opacity={i === 0 ? '.85' : '.45'}
                                        d={`M${move[0] + 0.5} ${move[1] + 0.5}L${move[2] + 0.5} ${move[3] + 0.5}`}
                                        markerEnd={`url(#${id})`}
                                    />
                                )
                        )}
                    </g>
                )}
            </g>
        </svg>
    )
}
