'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import './finos-preview.css'

const phases = ['Research', 'Debate', 'Plan', 'Risk', 'Decision']
const stepStyle = (step: number) => ({ '--step': step } as CSSProperties)

function Glyph({ kind }: { kind: 'chart' | 'news' | 'social' | 'filing' | 'shield' | 'check' }) {
    const paths = {
        chart: 'M4 4v16h16M7 15l4-5 4 3 5-8',
        news: 'M5 4h14v16H5zM8 8h8M8 12h8M8 16h5',
        social: 'M4 5h16v11h-9l-5 4v-4H4zM8 9h8M8 12h5',
        filing: 'M5 20h14M7 20V9h10v11M5 9l7-5 7 5M10 12v5M14 12v5',
        shield: 'M12 3l8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6zM8 12l3 3 5-6',
        check: 'M5 12l4 4L19 6',
    }
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d={paths[kind]} />
        </svg>
    )
}

function Ink({ count = 3 }: { count?: number }) {
    return (
        <div className="finos-ink">
            {Array.from({ length: count }, (_, i) => (
                <span key={i} />
            ))}
        </div>
    )
}

// A schematic of the real TradingAgents stages, not fabricated live research or trade signals.
// CSS owns the timeline, so pausing and hiding the tab preserve its exact position.
export default function FinosPreview({ reducedMotion }: { reducedMotion: boolean }) {
    const [intent, setIntent] = useState<boolean | null>(null)
    const [visible, setVisible] = useState(true)
    useEffect(() => {
        const update = () => setVisible(!document.hidden)
        update()
        document.addEventListener('visibilitychange', update)
        return () => document.removeEventListener('visibilitychange', update)
    }, [])
    const playing = (intent ?? !reducedMotion) && visible

    return (
        <div className="finos-preview">
            <div className="finos-workflow" data-playing={playing}>
                <div
                    className="finos-visual"
                    role="img"
                    aria-label="FinOS research workflow illustration: market, news, social and fundamentals analysts produce reports; bull and bear researchers debate; a trader builds a plan; three risk perspectives review it; the final decision is ready for human review."
                >
                    <div className="finos-desk-label" aria-hidden="true">
                        <span /> AGENT RESEARCH DESK
                    </div>
                    <div className="finos-scenes" aria-hidden="true">
                        <section className="finos-scene" style={stepStyle(0)}>
                            <h4>Four analysts. One company.</h4>
                            <div className="finos-analysts">
                                {(['Market', 'News', 'Social', 'Fundamentals'] as const).map((name, i) => (
                                    <div className="finos-agent" key={name}>
                                        <Glyph kind={(['chart', 'news', 'social', 'filing'] as const)[i]} />
                                        <span>{name}</span>
                                        <Ink count={2} />
                                    </div>
                                ))}
                            </div>
                        </section>
                        <section className="finos-scene" style={stepStyle(1)}>
                            <h4>Challenge the thesis.</h4>
                            <div className="finos-debate">
                                <div className="finos-voice">
                                    <span className="finos-voice-label">
                                        Bull case <b>↗</b>
                                    </span>
                                    <Ink />
                                </div>
                                <div className="finos-voice">
                                    <span className="finos-voice-label">
                                        Bear case <b>↘</b>
                                    </span>
                                    <Ink />
                                </div>
                            </div>
                            <div className="finos-merge">
                                <span />
                                Research manager
                                <span />
                            </div>
                        </section>
                        <section className="finos-scene" style={stepStyle(2)}>
                            <h4>Turn evidence into a plan.</h4>
                            <div className="finos-paper">
                                <div className="finos-paper-title">
                                    <Glyph kind="news" />
                                    Trader’s plan
                                </div>
                                {['Entry', 'Position', 'Exit'].map(name => (
                                    <div className="finos-plan-row" key={name}>
                                        <span>{name}</span>
                                        <Ink count={1} />
                                    </div>
                                ))}
                            </div>
                        </section>
                        <section className="finos-scene" style={stepStyle(3)}>
                            <h4>Put the plan under pressure.</h4>
                            <div className="finos-risk">
                                {['Aggressive', 'Neutral', 'Conservative'].map(name => (
                                    <div className="finos-agent" key={name}>
                                        <Glyph kind="shield" />
                                        <span>{name}</span>
                                        <Ink count={2} />
                                    </div>
                                ))}
                            </div>
                            <div className="finos-merge">
                                <span />
                                Risk review
                                <span />
                            </div>
                        </section>
                        <section className="finos-scene" style={stepStyle(4)}>
                            <h4>A decision you can inspect.</h4>
                            <div className="finos-paper finos-decision">
                                <div className="finos-paper-title">
                                    <Glyph kind="filing" />
                                    Decision & rationale
                                </div>
                                <div className="finos-evidence">
                                    {['Evidence', 'Plan', 'Risk'].map(name => (
                                        <span key={name}>
                                            <Glyph kind="check" />
                                            {name}
                                        </span>
                                    ))}
                                </div>
                                <div className="finos-human">
                                    Ready for your review<span>→</span>
                                </div>
                            </div>
                        </section>
                    </div>
                    <div className="finos-steps" aria-hidden="true">
                        {phases.map((phase, i) => (
                            <span key={phase} style={stepStyle(i)}>
                                <i />
                                {phase}
                            </span>
                        ))}
                    </div>
                </div>
                <button
                    type="button"
                    className="finos-playback"
                    onClick={() => setIntent(!playing)}
                    aria-label={playing ? 'Pause workflow preview' : 'Play workflow preview'}
                    title={playing ? 'Pause preview' : 'Play preview'}
                >
                    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" fill="currentColor">
                        {playing ? <path d="M4 3h3v10H4zm5 0h3v10H9z" /> : <path d="m5 2 8 6-8 6Z" />}
                    </svg>
                </button>
            </div>
        </div>
    )
}
