'use client'

import { useEffect, useState } from 'react'

export default function StravaSummary({ src }: { src: string }) {
    const [status, setStatus] = useState<'loading' | 'loaded' | 'unavailable'>('loading')

    useEffect(() => {
        if (status !== 'loading') return
        const timeout = window.setTimeout(() => setStatus('unavailable'), 10000)
        return () => window.clearTimeout(timeout)
    }, [status])

    return (
        <div className="profile-strava-summary" aria-busy={status === 'loading'}>
            {status !== 'loaded' && (
                <p className="profile-embed-message" role="status">
                    {status === 'loading' ? 'Loading…' : 'Summary unavailable'}
                </p>
            )}
            {/* Strava renders the stats in HTML. Script-free sandboxing keeps its analytics,
                cookie banner and application bundles out of this compact, read-only widget. */}
            <iframe
                src={src}
                title="Teo’s weekly Strava activity summary"
                width="300"
                height="160"
                loading="lazy"
                referrerPolicy="no-referrer"
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
                scrolling="no"
                onLoad={() => setStatus('loaded')}
                onError={() => setStatus('unavailable')}
                style={{ visibility: status === 'loaded' ? 'visible' : 'hidden' }}
            />
        </div>
    )
}
