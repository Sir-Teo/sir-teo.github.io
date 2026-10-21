'use client'

import PreviewFilm from './PreviewFilm'

const films = {
    crown: { name: 'crown', title: 'Deploying troops in a Crown & Clan raid' },
    rift: { name: 'rift', title: 'Ashe attacking and casting Volley in Summoner’s Rift' },
    postcard: { name: 'gta', title: 'Exploring San Andreas' },
}

export default function GamePreview({ scene, reducedMotion }: { scene: keyof typeof films; reducedMotion: boolean }) {
    const film = films[scene]
    return (
        <div className="game-film">
            <PreviewFilm
                clip={`/previews/game-${film.name}.mp4`}
                image={`/previews/game-${film.name}.webp`}
                title={film.title}
                reducedMotion={reducedMotion}
            />
        </div>
    )
}
