export type ReviewScene = 'chess' | 'xiangqi' | 'go'
export type ReviewLine = {
    label: string
    text: string
    score: number
    mate: number | null
    moves: (number[] | null)[]
}
export type ReviewFrame = {
    board: string[]
    turn: string
    label: string
    last: number[] | null
    score: number
    mate: number | null
    balance: number
    quality: string
    planted?: boolean
    lines: ReviewLine[]
}
export type ReviewGame = {
    scene: ReviewScene
    title: string
    engine: string
    start: number
    frames: ReviewFrame[]
}

export function evaluationText(scene: ReviewScene, value: Pick<ReviewFrame, 'score' | 'mate'>, compact = false) {
    const first = scene === 'chess' ? 'White' : scene === 'xiangqi' ? 'Red' : 'Black'
    const second = scene === 'go' ? 'White' : 'Black'
    const { score, mate } = value
    if (mate !== null) {
        const winner = (mate === 0 ? score >= 0 : mate > 0) ? first : second
        if (mate === 0) return `${winner} wins`
        return compact ? `${winner[0]} M${Math.abs(mate)}` : `${winner} mate in ${Math.abs(mate)}`
    }
    const points = Math.abs(score).toFixed(scene === 'go' ? 1 : 2)
    if (compact) return `${(score < 0 ? second : first)[0]} +${points}`
    return `${score < 0 ? second : first} +${points}${scene === 'go' ? ' points' : ''}`
}

export function graphPath(frames: ReviewFrame[]) {
    return frames
        .map(
            (frame, i) =>
                `${i ? 'L' : 'M'}${(4 + (312 * i) / (frames.length - 1)).toFixed(2)} ${(
                    40 -
                    frame.balance * 0.36
                ).toFixed(2)}`
        )
        .join(' ')
}
