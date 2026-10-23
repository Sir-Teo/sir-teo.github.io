'use client'

import PreviewFilm from './PreviewFilm'

const films = {
    crown: { name: 'game-crown', title: 'Deploying troops in a Crown & Clan raid' },
    royale: { name: 'game-royale-arena', title: 'A close-up of troops battling across the Clash Royale bridge' },
    rift: { name: 'game-rift', title: 'Ashe attacking and casting Volley in Summoner’s Rift' },
    postcard: { name: 'game-gta', title: 'Exploring San Andreas' },
    finos: { name: 'finos-app', title: 'Opening a recorded FinOS research report and reviewing its sources' },
    ideas: { name: 'ideas-map', title: 'Tracing connections across the main Ideas, Visualized graph' },
}

export default function GamePreview({ scene, reducedMotion }: { scene: keyof typeof films; reducedMotion: boolean }) {
    const film = films[scene]
    return (
        <div className="game-film">
            <PreviewFilm
                clip={`/previews/${film.name}.mp4`}
                image={`/previews/${film.name}.webp`}
                title={film.title}
                height={scene === 'ideas' ? 480 : scene === 'royale' ? 444 : 360}
                reducedMotion={reducedMotion}
            />
        </div>
    )
}
