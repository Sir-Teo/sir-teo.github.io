'use client'

import PreviewFilm from './PreviewFilm'

const films = {
    crown: { name: 'game-crown', title: 'Deploying troops in a Crown & Clan raid' },
    rift: { name: 'game-rift', title: 'Ashe attacking and casting Volley in Summoner’s Rift' },
    postcard: { name: 'game-gta', title: 'Exploring San Andreas' },
    finos: { name: 'finos-app', title: 'Opening a recorded FinOS research report and reviewing its sources' },
}

export default function GamePreview({ scene, reducedMotion }: { scene: keyof typeof films; reducedMotion: boolean }) {
    const film = films[scene]
    return (
        <div className="game-film">
            <PreviewFilm
                clip={`/previews/${film.name}.mp4`}
                image={`/previews/${film.name}.webp`}
                title={film.title}
                reducedMotion={reducedMotion}
            />
        </div>
    )
}
