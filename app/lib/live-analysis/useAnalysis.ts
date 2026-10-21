'use client'

import { useEffect, useRef, useState } from 'react'
import { createEngine, engineName, type Analysis, type Engine } from './engines'
import type { Position } from './game'

export function useAnalysis(position: Position) {
    const [analysis, setAnalysis] = useState<Analysis>({
        phase: 'loading',
        status: `Loading ${engineName(position.scene)}…`,
        suggestions: [],
    })
    const [attempt, setAttempt] = useState(0)
    const current = useRef(position)
    const engine = useRef<Engine | null>(null)
    current.current = position
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>
        let active = true
        const visibility = () => {
            clearTimeout(timer)
            engine.current?.dispose()
            engine.current = null
            if (document.hidden) {
                setAnalysis({ phase: 'paused', status: 'Paused while this page is hidden', suggestions: [] })
                return
            }
            setAnalysis({ phase: 'loading', status: `Loading ${engineName(position.scene)}…`, suggestions: [] })
            timer = setTimeout(() => {
                if (!active) return
                engine.current = createEngine(position.scene, state => {
                    if (active) setAnalysis(state)
                })
                engine.current.analyze(current.current)
            }, 300)
        }
        visibility()
        document.addEventListener('visibilitychange', visibility)
        return () => {
            active = false
            clearTimeout(timer)
            engine.current?.dispose()
            engine.current = null
            document.removeEventListener('visibilitychange', visibility)
        }
    }, [position.scene, attempt])
    useEffect(() => {
        engine.current?.analyze(position)
    }, [position])
    // Filter in render too: useEffect runs after paint, so old results must never
    // be clickable in the frame immediately following a move or undo.
    const fresh = analysis.key === position.key
    return { ...analysis, suggestions: fresh ? analysis.suggestions : [], retry: () => setAttempt(n => n + 1) }
}
