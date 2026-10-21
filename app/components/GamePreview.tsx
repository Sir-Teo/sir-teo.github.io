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
    nitro,
    pause,
    project,
    start,
    step,
    unproject,
    volley,
    WIDTH,
    type Game,
    type Input,
    type Mode,
} from '../lib/game-previews/simulation'

const sessions: Partial<Record<Mode, Game>> = {}
const copy = {
    crown: {
        name: 'Village raid',
        title: 'A little conquest.',
        goal: 'Eight troops. One lightning spell.',
        start: 'Raid',
        hint: 'Choose a troop, then tap outside the walls.',
        win: 'Three stars. All yours.',
    },
    rift: {
        name: 'Skillshot lab',
        title: 'Make a little magic.',
        goal: 'Ashe or Lux. Aim. Cast. Repeat.',
        start: 'Cast',
        hint: 'Drag to aim, release to cast. Try both champions.',
        win: 'That was a highlight reel.',
    },
    postcard: {
        name: 'Coast run',
        title: 'One more sunset.',
        goal: 'A short drive. A little too much nitro.',
        start: 'Drive',
        hint: 'Drag to steer. Arrows work too; Space boosts.',
        win: 'See you at the coast.',
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
    const description = useId(),
        text = copy[scene]

    useEffect(() => {
        const surface = canvas.current,
            context = surface?.getContext('2d', { alpha: false })
        if (!surface || !context) {
            setSupported(false)
            return
        }
        let frame = 0,
            previous = 0,
            lastUI = 0,
            alive = true
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
            const r = surface.getBoundingClientRect(),
                density = Math.min(window.devicePixelRatio || 1, 2)
            surface.width = Math.max(1, Math.round(r.width * density))
            surface.height = Math.max(1, Math.round(r.height * density))
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
        const selected = game.selected
        if (deploy(game, game.cursor)) {
            setNotice(selected === 'spell' ? 'Lightning stuns defenses and damages buildings.' : '')
            if (selected === 'spell' || !game.army[selected])
                game.selected = game.army.barbarian ? 'barbarian' : game.army.archer ? 'archer' : 'spell'
        } else
            setNotice(
                selected === 'spell' ? 'Aim the spell at a building.' : 'Deploy outside the walls, by the + marks.'
            )
        refresh()
    }
    const aim = (event: PointerEvent<HTMLCanvasElement>) => {
        const r = event.currentTarget.getBoundingClientRect()
        const p = { x: ((event.clientX - r.left) / r.width) * WIDTH, y: ((event.clientY - r.top) / r.height) * HEIGHT }
        game.cursor =
            game.mode === 'crown' ? unproject(p) : { x: clamp(p.x, 8, WIDTH - 8), y: clamp(p.y, 8, HEIGHT - 8) }
        if (game.mode === 'crown' && game.selected === 'spell') {
            // A finger lands on the roof/body, above the building's ground point.
            const target = game.buildings
                .filter(b => b.hp > 0)
                .map(b => {
                    const screen = project(b)
                    return {
                        building: b,
                        gap: Math.hypot(screen.x - p.x, screen.y - (b.kind === 'hall' ? 27 : 13) - p.y),
                    }
                })
                .sort((a, b) => a.gap - b.gap)[0]
            if (target && target.gap < 37) game.cursor = { x: target.building.x, y: target.building.y }
        }
        if (game.mode === 'postcard') game.target = clamp((p.x - WIDTH / 2) / (WIDTH * 0.4), -1, 1)
    }
    const pointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
        if (game.phase !== 'running' || !event.isPrimary) return
        event.preventDefault()
        event.currentTarget.focus({ preventScroll: true })
        aim(event)
        if (game.mode === 'crown') place()
        else {
            event.currentTarget.setPointerCapture(event.pointerId)
            if (game.mode === 'rift') game.aiming = true
            refresh()
        }
    }
    const release = (event: PointerEvent<HTMLCanvasElement>, cast = true) => {
        if (!event.isPrimary) return
        if (game.mode === 'rift' && game.aiming) {
            if (cast) {
                aim(event)
                volley(game)
            }
            game.aiming = false
        }
        if (game.mode === 'postcard') game.target = null
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
        const key = event.key.length === 1 ? event.key.toLowerCase() : event.key,
            dir = direction(key)
        if (key === 'Escape') {
            event.preventDefault()
            stop()
            return
        }
        if (game.mode === 'rift' && ['q', 'w', 'r', ' ', 'Enter'].includes(key)) {
            event.preventDefault()
            if (!event.repeat) {
                if (key === 'r') game.ability = 'ultimate'
                else if (key === 'q' || key === 'w') game.ability = 'basic'
                volley(game)
                refresh()
            }
        } else if (game.mode === 'postcard' && [' ', 'Enter', 'w', 'ArrowUp'].includes(key)) {
            event.preventDefault()
            if (!event.repeat) {
                nitro(game)
                refresh()
            }
        } else if ((game.mode === 'crown' || (game.mode === 'rift' && key.startsWith('Arrow'))) && dir) {
            event.preventDefault()
            game.cursor.x = clamp(game.cursor.x + (dir === 'right' ? 16 : dir === 'left' ? -16 : 0), 12, 348)
            game.cursor.y = clamp(game.cursor.y + (dir === 'down' ? 16 : dir === 'up' ? -16 : 0), 12, 268)
            engine.current.paint()
        } else if (game.mode === 'crown' && [' ', 'Enter'].includes(key)) {
            event.preventDefault()
            if (!event.repeat) place()
        } else if (dir) {
            event.preventDefault()
            input.current[dir] = true
        }
    }
    const control = (dir: keyof Input, label: string, glyph: string) => (
        <button
            type="button"
            className="mini-control"
            aria-label={label}
            disabled={game.phase !== 'running'}
            onPointerDown={e => {
                if (game.phase !== 'running') return
                e.preventDefault()
                e.currentTarget.setPointerCapture(e.pointerId)
                input.current[dir] = true
                refresh()
            }}
            onPointerUp={e => {
                input.current[dir] = false
                if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
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
            onKeyDown={e => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault()
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
    const running = game.phase === 'running'
    return (
        <div
            className={`mini-game mini-game-${scene}`}
            data-phase={game.phase}
            onBlur={e => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) stop()
            }}
        >
            <div className="mini-stage">
                <canvas
                    ref={canvas}
                    tabIndex={running ? 0 : -1}
                    role="application"
                    aria-label={`${text.name} playable scene`}
                    aria-describedby={description}
                    onKeyDown={keyDown}
                    onKeyUp={e => {
                        const dir = direction(e.key.length === 1 ? e.key.toLowerCase() : e.key)
                        if (dir) {
                            e.preventDefault()
                            input.current[dir] = false
                        }
                    }}
                    onPointerDown={pointerDown}
                    onPointerMove={e => {
                        if (!running || !e.isPrimary) return
                        if (
                            game.mode === 'postcard'
                                ? e.currentTarget.hasPointerCapture(e.pointerId)
                                : e.pointerType !== 'touch' || (game.mode === 'rift' && game.aiming)
                        ) {
                            aim(e)
                            engine.current.paint()
                        }
                    }}
                    onPointerUp={e => release(e)}
                    onPointerCancel={e => release(e, false)}
                    onLostPointerCapture={e => release(e, false)}
                >
                    Use the full game link below if canvas is unavailable.
                </canvas>
                {(!running || !supported) && (
                    <div className="mini-overlay" data-ready={game.phase === 'ready'}>
                        <div>
                            <span className="mini-eyebrow">
                                {game.phase === 'ready'
                                    ? text.name
                                    : game.phase === 'paused'
                                    ? 'PAUSED'
                                    : game.phase === 'won'
                                    ? 'NICELY PLAYED'
                                    : 'ONE MORE TRY'}
                            </span>
                            <strong>
                                {!supported
                                    ? 'Open the full game below'
                                    : game.phase === 'ready'
                                    ? text.title
                                    : game.phase === 'paused'
                                    ? 'Pick up where you left off.'
                                    : game.phase === 'won'
                                    ? text.win
                                    : 'A different strategy?'}
                            </strong>
                            <p>
                                {game.phase === 'ready'
                                    ? text.goal
                                    : game.mode === 'postcard' && game.phase === 'won'
                                    ? `${game.overtakes} overtakes · ${game.near} close calls`
                                    : headline(game)}
                            </p>
                        </div>
                        {supported && (
                            <button type="button" className="mini-start" onClick={play}>
                                {game.phase === 'ready' ? text.start : game.phase === 'paused' ? 'Resume' : 'Replay'}{' '}
                                <span aria-hidden="true">↗</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
            <div className="mini-toolbar">
                <div className="mini-score">
                    <output aria-live={game.mode === 'postcard' ? 'off' : 'polite'}>{headline(game)}</output>
                    <span>
                        {game.mode === 'postcard'
                            ? `${Math.round(game.car.speed)} km/h · ${game.overtakes} passes`
                            : game.mode === 'rift'
                            ? game.champion === 'ashe'
                                ? 'FROST & FOCUS'
                                : 'A LITTLE BRILLIANCE'
                            : `${game.army.barbarian + game.army.archer} troops · ${game.spells} spell`}
                    </span>
                </div>
                <div className="mini-tools">
                    <button
                        type="button"
                        onClick={running ? stop : play}
                        disabled={game.phase === 'ready' || !supported}
                        aria-label={`${
                            running ? 'Pause' : game.phase === 'won' || game.phase === 'lost' ? 'Replay' : 'Resume'
                        } ${text.name}`}
                    >
                        {running ? 'Ⅱ' : '▷'}
                    </button>
                    <button
                        type="button"
                        onClick={reset}
                        disabled={game.phase === 'ready' || !supported}
                        aria-label={`Restart ${text.name}`}
                    >
                        ↶
                    </button>
                </div>
            </div>
            <div className="mini-controls" role="group" aria-label={`${text.name} controls`}>
                {game.mode === 'crown' ? (
                    <>
                        {(['barbarian', 'archer', 'spell'] as const).map(kind => (
                            <button
                                type="button"
                                key={kind}
                                aria-pressed={game.selected === kind}
                                disabled={!running || !(kind === 'spell' ? game.spells : game.army[kind])}
                                onClick={() => {
                                    game.selected = kind
                                    setNotice('')
                                    refresh()
                                }}
                            >
                                <span className={`mini-unit mini-unit-${kind}`} aria-hidden="true">
                                    {kind === 'archer' ? '➶' : kind === 'spell' ? 'ϟ' : '⚔'}
                                </span>
                                <span>
                                    {kind === 'archer' ? 'Archers' : kind === 'spell' ? 'Lightning' : 'Barbs'}
                                    <small>×{kind === 'spell' ? game.spells : game.army[kind]}</small>
                                </span>
                            </button>
                        ))}
                    </>
                ) : game.mode === 'rift' ? (
                    <>
                        <div className="mini-champions" role="group" aria-label="Champion">
                            {(['ashe', 'lux'] as const).map(hero => (
                                <button
                                    type="button"
                                    key={hero}
                                    aria-pressed={game.champion === hero}
                                    disabled={!running}
                                    onClick={() => {
                                        game.champion = hero
                                        game.arrows = []
                                        game.ability = 'basic'
                                        game.minions.forEach(m => (m.frozen = 0))
                                        refresh()
                                    }}
                                >
                                    {hero === 'ashe' ? 'Ashe' : 'Lux'}
                                </button>
                            ))}
                        </div>
                        {(['basic', 'ultimate'] as const).map(ability => {
                            const remaining = ability === 'basic' ? game.cooldown : game.ultimateCooldown
                            const name =
                                ability === 'ultimate'
                                    ? game.champion === 'ashe'
                                        ? 'Crystal'
                                        : 'Spark'
                                    : game.champion === 'ashe'
                                    ? 'Volley'
                                    : 'Binding'
                            return (
                                <button
                                    type="button"
                                    key={ability}
                                    className="mini-ability"
                                    aria-label={`Cast ${name}`}
                                    aria-pressed={game.ability === ability}
                                    disabled={!running}
                                    aria-disabled={remaining > 0}
                                    onClick={() => {
                                        game.ability = ability
                                        volley(game)
                                        refresh()
                                    }}
                                >
                                    <b>
                                        {remaining > 0
                                            ? remaining.toFixed(1)
                                            : ability === 'ultimate'
                                            ? 'R'
                                            : game.champion === 'ashe'
                                            ? 'W'
                                            : 'Q'}
                                    </b>
                                    <span>{name}</span>
                                </button>
                            )
                        })}
                    </>
                ) : (
                    <>
                        {control('left', 'Steer left', '←')}
                        <button
                            type="button"
                            className="mini-boost"
                            aria-label="Nitro boost"
                            disabled={!running}
                            aria-disabled={game.fuel < 0.98}
                            onClick={() => {
                                nitro(game)
                                refresh()
                            }}
                        >
                            <span aria-hidden="true">ϟ</span>
                            <span>
                                {game.boost > 0 ? 'BOOSTING' : 'NITRO'}
                                <small>{game.fuel < 0.98 ? `${Math.round(game.fuel * 100)}%` : 'READY'}</small>
                            </span>
                            <i style={{ width: `${game.fuel * 100}%` }} />
                        </button>
                        {control('right', 'Steer right', '→')}
                    </>
                )}
            </div>
            <p id={description} className="mini-instruction">
                {notice || text.hint}
                {scene === 'crown' && (
                    <span className="sr-only"> Use arrow keys to position, and Enter to deploy.</span>
                )}
                {scene === 'rift' && (
                    <span className="sr-only">
                        {' '}
                        Arrow keys aim; A and D move; W or Q casts the basic ability; R casts the ultimate.
                    </span>
                )}
            </p>
        </div>
    )
}
