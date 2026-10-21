import { useRef, useState, type ReactNode } from 'react'

// One tab stop per board. Arrow keys move between squares; Enter/Space play.
export default function Board({
    rows,
    columns,
    label,
    initial = 0,
    children,
    cell,
    onPlay,
    className = '',
}: {
    rows: number
    columns: number
    label: string
    initial?: number
    children?: ReactNode
    cell: (index: number) => { label: string; content?: ReactNode; className?: string }
    onPlay: (index: number) => void
    className?: string
}) {
    const [cursor, setCursor] = useState(initial)
    const buttons = useRef<(HTMLButtonElement | null)[]>([])
    return (
        <div
            className={`mini-board ${className}`}
            role="group"
            aria-label={label}
            onKeyDown={event => {
                const directions: Record<string, number> = {
                    ArrowLeft: -1,
                    ArrowRight: 1,
                    ArrowUp: -columns,
                    ArrowDown: columns,
                }
                if (!(event.key in directions)) return
                event.preventDefault()
                event.stopPropagation()
                if (event.key === 'ArrowLeft' && cursor % columns === 0) return
                if (event.key === 'ArrowRight' && cursor % columns === columns - 1) return
                const next = Math.min(rows * columns - 1, Math.max(0, cursor + directions[event.key]))
                buttons.current[next]?.focus()
            }}
        >
            {children}
            <div
                className="mini-board-cells"
                style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
            >
                {Array.from({ length: rows * columns }, (_, index) => {
                    const item = cell(index)
                    return (
                        <button
                            key={index}
                            ref={node => {
                                buttons.current[index] = node
                            }}
                            type="button"
                            tabIndex={index === cursor ? 0 : -1}
                            aria-label={item.label}
                            className={`mini-square ${item.className ?? ''}`}
                            onFocus={() => setCursor(index)}
                            onClick={() => onPlay(index)}
                        >
                            {item.content}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
