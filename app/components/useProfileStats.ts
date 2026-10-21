'use client'

import { useEffect, useState } from 'react'
import type { StatsId } from '../data/profile'
import { canRefreshStats, initialStats, refreshStats, type StatsState } from '../lib/profileStats'

export default function useProfileStats(id?: StatsId) {
    const [state, setState] = useState<StatsState | undefined>(() => (id ? initialStats(id) : undefined))
    const [checking, setChecking] = useState(Boolean(id && canRefreshStats(id)))

    useEffect(() => {
        if (!id) return
        let active = true
        void refreshStats(id).then(result => {
            if (!active) return
            setState(result)
            setChecking(false)
        })
        return () => {
            active = false
        }
    }, [id])

    const checkedAt = state?.snapshot.checkedAt
    let freshness = 'Profile snapshot'
    if (checkedAt) {
        const date = new Date(checkedAt)
        const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        if (checking) freshness = 'Checking for updates…'
        else if (state?.status === 'current') {
            const age = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
            freshness =
                age < 1 ? 'Checked just now' : age < 60 ? `Checked ${age}m ago` : `Checked ${Math.floor(age / 60)}h ago`
        } else freshness = `Snapshot · ${label}`
    }

    return {
        stats: state?.snapshot.stats,
        freshness,
        checkedAt,
        current: state?.status === 'current',
        unavailable: state?.status === 'unavailable',
    }
}
