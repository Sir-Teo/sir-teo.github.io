'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { draw } from '../lib/game-previews/draw'
import {
    clamp,
    createGame,
    deploy,
    emptyInput,
    headline,
    HEIGHT,
    pause,
    start,
    step,
    volley,
    WIDTH,
    type Game,
    type Input,
    type Mode,
} from '../lib/game-previews/simulation'

const sessions: Partial<Record<Mode, Game>> = {}
const copy = {
    crown: {
        name: 'Pocket raid',
        title: 'Raid the village',
        goal: 'Eight troops. Three stars. Your strategy.',
        start: 'Try a raid',
        hint: 'Tap the edge to deploy. Arrows + Enter work too.',
    },
    rift: {
        name: 'Volley practice',
        title: 'Find your angle',
        goal: 'Aim a frost volley. Clear six moving targets.',
        start: 'Take aim',
        hint: 'Drag & release to aim. W fires; ← → move.',
    },
    postcard: {
        name: 'Sunset drive',
        title: 'Back on Grove Street',
        goal: 'Four checkpoints. Take the scenic route.',
        start: 'Take the wheel',
        hint: 'Hold the controls, or use arrows / WASD.',
    },
}

export default function GamePreview({ scene, reducedMotion }: { scene: Mode; reducedMotion: boolean }) {
    const [game] = useState(() => sessions[scene] ?? (sessions[scene] = createGame(scene)))
    const [, render] = useState(0)
    const [notice, setNotice] = useState('')
    const [supported, setSupported] = useState(true)
    const canvas = useRef<HTMLCanvasElement>(null)
    const input = useRef<Input>(emptyInput())
    const engine = useRef({ refresh: () => {}, paint: () => {} })
    const description = useId()
    const text = copy[scene]

    useEffect(() => {
        const surface = canvas.current
        const context = surface?.getContext('2d', { alpha: false })
        if (!surface || !context) {
            setSupported(false)
            return
        }
        let frame = 0,
            previous = 0,
            lastUI = 0
        let alive = true
        const paint = () => draw(context, game, reducedMotion)
        const tick = (time: number) => {
            frame = 0
            if (!alive || game.phase !== 'running' || document.hidden) return
            if (!previous) previous = time
            if (time - previous >= 32) {
                step(game, (time - previous) / 1000, input.current)
                previous = time
                paint()
                if (time - lastUI >= 120 || game.phase !== 'running') {
                    render(n => n + 1)
                    lastUI = time
                }
            }
            if (game.phase === 'running') frame = requestAnimationFrame(tick)
        }
        const refresh = () => {
            if (!alive) return
            paint()
            render(n => n + 1)
            if (game.phase === 'running' && !document.hidden && !frame) {
                previous = 0
                frame = requestAnimationFrame(tick)
            } else if (game.phase !== 'running' && frame) {
                cancelAnimationFrame(frame)
                frame = 0
            }
        }
        const resize = () => {
            const bounds = surface.getBoundingClientRect()
            const density = Math.min(window.devicePixelRatio || 1, 2)
            surface.width = Math.max(1, Math.round(bounds.width * density))
            surface.height = Math.max(1, Math.round(bounds.height * density))
            paint()
        }
        const suspend = () => {
            input.current = emptyInput()
            pause(game)
            refresh()
        }
        const visibility = () => {
            if (document.hidden) suspend()
        }
        engine.current = { paint, refresh }
        const observer = new ResizeObserver(resize)
        observer.observe(surface)
        window.addEventListener('blur', suspend)
        document.addEventListener('visibilitychange', visibility)
        resize()
        refresh()
        return () => {
            alive = false
            cancelAnimationFrame(frame)
            observer.disconnect()
            window.removeEventListener('blur', suspend)
            document.removeEventListener('visibilitychange', visibility)
            input.current = emptyInput()
            pause(game)
            engine.current = { paint: () => {}, refresh: () => {} }
        }
    }, [game, reducedMotion])

    const refresh = () => engine.current.refresh()
    const reset = () => {
        Object.assign(game, createGame(scene))
        input.current = emptyInput()
        setNotice('')
        start(game)
        canvas.current?.focus({ preventScroll: true })
        refresh()
    }
    const play = () => {
        if (game.phase === 'won' || game.phase === 'lost') {
            reset()
            return
        }
        start(game)
        canvas.current?.focus({ preventScroll: true })
        refresh()
    }
    const stop = () => {
        pause(game)
        input.current = emptyInput()
        refresh()
    }
    const place = () => {
        if (game.mode !== 'crown') return
        if (deploy(game, game.cursor)) {
            setNotice(`${game.selected === 'archer' ? 'Archer' : 'Barbarian'} deployed.`)
            if (!game.army[game.selected]) game.selected = game.selected === 'archer' ? 'barbarian' : 'archer'
        } else setNotice('Deploy in the grass outside the dotted border.')
        refresh()
    }
    const aim = (event: PointerEvent<HTMLCanvasElement>) => {
        const r = event.currentTarget.getBoundingClientRect()
        game.cursor = {
            x: clamp(((event.clientX - r.left) / r.width) * WIDTH, 12, WIDTH - 12),
            y: clamp(((event.clientY - r.top) / r.height) * HEIGHT, 12, HEIGHT - 12),
        }
    }
    const pointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
        if (game.phase !== 'running') return
        event.preventDefault()
        event.currentTarget.focus({ preventScroll: true })
        aim(event)
        if (game.mode === 'crown') place()
        else if (game.mode === 'rift') {
            event.currentTarget.setPointerCapture(event.pointerId)
            game.aiming = true
            refresh()
        }
    }
    const pointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
        if (game.mode !== 'rift' || !game.aiming) return
        aim(event)
        volley(game)
        game.aiming = false
        if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId)
        refresh()
    }
    const direction = (key: string): keyof Input | undefined =>
        ((
            {
                ArrowLeft: 'left',
                a: 'left',
                ArrowRight: 'right',
                d: 'right',
                ArrowUp: 'up',
                w: 'up',
                ArrowDown: 'down',
                s: 'down',
            } as Record<string, keyof Input>
        )[key])
    const keyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
        if (game.phase !== 'running') return
        const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
        if (scene === 'crown' && direction(key)) {
            event.preventDefault()
            const dir = direction(key)
            game.cursor.x = clamp(game.cursor.x + (dir === 'right' ? 16 : dir === 'left' ? -16 : 0), 12, 348)
            game.cursor.y = clamp(game.cursor.y + (dir === 'down' ? 16 : dir === 'up' ? -16 : 0), 12, 248)
            engine.current.paint()
        } else if (
            (scene === 'rift' && ['w', ' ', 'Enter'].includes(key)) ||
            (scene === 'crown' && [' ', 'Enter'].includes(key))
        ) {
            event.preventDefault()
            if (event.repeat) return
            if (game.mode === 'crown') place()
            else if (game.mode === 'rift') {
                volley(game)
                refresh()
            }
        } else if (direction(key)) {
            event.preventDefault()
            input.current[direction(key)!] = true
        }
    }
    const control = (dir: keyof Input, label: string, glyph: string) => (
        <button
            type="button"
            className="mini-control"
            aria-label={label}
            disabled={game.phase !== 'running'}
            onPointerDown={event => {
                if (game.phase !== 'running') return
                event.preventDefault()
                event.currentTarget.setPointerCapture(event.pointerId)
                input.current[dir] = true
                refresh()
            }}
            onPointerUp={event => {
                input.current[dir] = false
                if (event.currentTarget.hasPointerCapture(event.pointerId))
                    event.currentTarget.releasePointerCapture(event.pointerId)
                refresh()
            }}
            onPointerCancel={() => {
                input.current[dir] = false
                refresh()
            }}
            onLostPointerCapture={() => {
                input.current[dir] = false
                refresh()
            }}
            onKeyDown={event => {
                if (event.key === ' ' || event.key === 'Enter') {
                    event.preventDefault()
                    input.current[dir] = true
                    refresh()
                }
            }}
            onKeyUp={() => {
                input.current[dir] = false
                refresh()
            }}
            onBlur={() => {
                input.current[dir] = false
                refresh()
            }}
            data-held={input.current[dir]}
        >
            <span aria-hidden="true">{glyph}</span>
            <small>{label}</small>
        </button>
    )

    return (
        <div
            className={`mini-game mini-game-${scene}`}
            onBlur={event => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) stop()
            }}
        >
            <div className="mini-toolbar">
                <span>
                    <i />
                    {text.name}
                </span>
                <div>
                    <button
                        type="button"
                        onClick={stop}
                        disabled={game.phase !== 'running'}
                        aria-label={`Pause ${text.name}`}
                    >
                        Ⅱ Pause
                    </button>
                    <button
                        type="button"
                        onClick={reset}
                        disabled={game.phase === 'ready' || !supported}
                        aria-label={`Restart ${text.name}`}
                    >
                        ↶ Reset
                    </button>
                </div>
            </div>
            <div className="mini-stage">
                <canvas
                    ref={canvas}
                    tabIndex={game.phase === 'running' ? 0 : -1}
                    role="application"
                    aria-label={`${text.name} playable scene`}
                    aria-describedby={description}
                    onKeyDown={keyDown}
                    onKeyUp={event => {
                        const dir = direction(event.key.length === 1 ? event.key.toLowerCase() : event.key)
                        if (dir) {
                            event.preventDefault()
                            input.current[dir] = false
                        }
                    }}
                    onPointerDown={pointerDown}
                    onPointerMove={event => {
                        if (game.phase !== 'running') return
                        if (event.pointerType !== 'touch' || (game.mode === 'rift' && game.aiming)) {
                            aim(event)
                            engine.current.paint()
                        }
                    }}
                    onPointerUp={pointerUp}
                    onPointerCancel={() => {
                        if (game.mode === 'rift') game.aiming = false
                        input.current = emptyInput()
                        refresh()
                    }}
                    onLostPointerCapture={() => {
                        if (game.mode === 'rift') game.aiming = false
                        engine.current.paint()
                    }}
                >
                    Use the full game link below if canvas is unavailable.
                </canvas>
                {(game.phase !== 'running' || !supported) && (
                    <div className="mini-overlay">
                        <div>
                            <span className="mini-eyebrow">
                                {game.phase === 'ready'
                                    ? 'A LITTLE PLAY BREAK'
                                    : game.phase === 'paused'
                                    ? 'TAKE YOUR TIME'
                                    : game.phase === 'won'
                                    ? 'NICELY DONE'
                                    : 'ONE MORE TRY'}
                            </span>
                            <strong>
                                {!supported
                                    ? 'Open the full game below'
                                    : game.phase === 'ready'
                                    ? text.title
                                    : game.phase === 'paused'
                                    ? 'Right where you left off.'
                                    : game.phase === 'won'
                                    ? scene === 'crown'
                                        ? 'A three-star raid.'
                                        : scene === 'rift'
                                        ? 'Six down. Ice cold.'
                                        : 'Home before dark.'
                                    : 'Try a different approach.'}
                            </strong>
                            <p>{game.phase === 'ready' ? text.goal : headline(game)}</p>
                            {supported && (
                                <button type="button" className="mini-start" onClick={play}>
                                    {game.phase === 'ready'
                                        ? text.start
                                        : game.phase === 'paused'
                                        ? 'Resume'
                                        : 'Play again'}{' '}
                                    <span aria-hidden="true">↗</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="mini-score">
                <output aria-live="polite">{headline(game)}</output>
                <span>
                    {game.phase === 'paused'
                        ? 'Paused'
                        : game.phase === 'won'
                        ? 'Complete'
                        : game.phase === 'lost'
                        ? 'Try again'
                        : game.mode === 'rift'
                        ? game.cooldown > 0
                            ? 'Recharging…'
                            : 'Volley ready'
                        : game.mode === 'postcard'
                        ? `${Math.round(Math.abs(game.car.speed) * 0.7)} km/h`
                        : game.army.barbarian + game.army.archer
                        ? 'Choose your troops'
                        : 'Raid in progress'}
                </span>
            </div>
            <div className="mini-controls" role="group" aria-label={`${text.name} controls`}>
                {game.mode === 'crown' ? (
                    <>
                        {(['barbarian', 'archer'] as const).map(kind => (
                            <button
                                type="button"
                                key={kind}
                                aria-pressed={game.selected === kind}
                                disabled={!game.army[kind] || game.phase !== 'running'}
                                onClick={() => {
                                    game.selected = kind
                                    setNotice('')
                                    refresh()
                                }}
                            >
                                <span className={`mini-unit mini-unit-${kind}`} aria-hidden="true">
                                    {kind === 'archer' ? '➶' : '⚔'}
                                </span>
                                <span>{kind === 'archer' ? 'Archers' : 'Barbarians'}</span>
                                <b>{game.army[kind]}</b>
                            </button>
                        ))}
                    </>
                ) : game.mode === 'rift' ? (
                    <>
                        {control('left', 'Move left', '←')}
                        <button
                            type="button"
                            className="mini-volley"
                            disabled={game.phase !== 'running'}
                            aria-disabled={game.cooldown > 0}
                            onClick={() => {
                                volley(game)
                                refresh()
                            }}
                        >
                            <span aria-hidden="true">↟</span> W · Volley
                        </button>
                        {control('right', 'Move right', '→')}
                    </>
                ) : (
                    <>
                        {control('left', 'Steer left', '←')}
                        {control('up', 'Gas', '↑')}
                        {control('down', 'Reverse', '↓')}
                        {control('right', 'Steer right', '→')}
                    </>
                )}
            </div>
            <p id={description} className="mini-instruction">
                {notice || text.hint}
            </p>
        </div>
    )
}
