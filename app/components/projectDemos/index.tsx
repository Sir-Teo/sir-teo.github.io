import type { ProjectDemoId } from '../../data/profile'
import Chess from './Chess'
import City from './City'
import Fourier from './Fourier'
import Go from './Go'
import Rift from './Rift'
import Village from './Village'
import Xiangqi from './Xiangqi'

const demos = { chess: Chess, city: City, fourier: Fourier, go: Go, rift: Rift, village: Village, xiangqi: Xiangqi }

export default function ProjectDemo({ id }: { id: ProjectDemoId }) {
    const Demo = demos[id]
    return <Demo />
}
