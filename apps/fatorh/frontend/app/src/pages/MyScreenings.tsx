import { Play, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import PageHeader from "@/components/PageHeader"

type JobStatus = "Encerrado" | "Em andamento" | "Aguardando"

interface Job {
    id: string
    title: string
    company: string
    status: JobStatus
    statusMessage: string
    submittedAt: string
    participations: Participation[]
}

interface Participation {
    id: string
    date: string
    stages: Stage[]
    feedback?: string
}

interface Stage {
    id: string
    number: number
    question: string
    audioUrl?: string
}

const mockJob: Job = {
    id: "1",
    title: "[Job 25923] Senior Front End React Developer, Brasil",
    company: "CI&T",
    status: "Encerrado",
    statusMessage: "Esta vaga foi preenchida e o processo seletivo encerrado.",
    submittedAt: "11/19/2025, 9:05:07 AM",
    participations: [
        {
            id: "1",
            date: "11/19/2025, 9:05:07 AM",
            stages: [
                {
                    id: "1",
                    number: 1,
                    question:
                        "Conte sobre uma situação em que você liderou o desenvolvimento de uma aplicação web envolvendo React e Next.js em um ambiente colaborativo e multifuncional. Quais foram os maiores desafios técnicos e de colaboração enfrentados? Como você solucionou esses desafios e quais foram os resultados alcançados?",
                },
                {
                    id: "2",
                    number: 2,
                    question:
                        "Explique como você implementaria uma solução de Server-Side Rendering (SSR) usando Next.js para uma aplicação no setor financeiro, considerando requisitos de performance, SEO e segurança.",
                },
                {
                    id: "3",
                    number: 3,
                    question:
                        "Descreva como você integraria uma aplicação frontend em React/Next.js com serviços do Google Cloud Platform, como Cloud Functions e Cloud Storage, para garantir escalabilidade e alta disponibilidade.",
                },
                {
                    id: "4",
                    number: 4,
                    question:
                        "Cite os principais cuidados e estratégias que você utilizaria ao desenvolver APIs robustas com NestJS para suportar uma aplicação frontend, considerando manutenibilidade, performance e segurança.",
                },
            ],
            feedback:
                "Você demonstrou uma boa percepção sobre a importância da padronização e da colaboração em equipes grandes, especialmente ao mencionar a criação de design system para manter a consistência entre componentes, a organização do core e a possibilidade de trabalhar tanto com monorepo quanto com abordagens de microserviços; também mostrou pensamento cuidadoso sobre desempenho, SEO e segurança ao discutir SSR com Next.js, uso de JSON-LD e a necessidade de manter o que fica no servidor, além de considerar pipelines para auditar código; na integração com Google Cloud Platform você evidenciou compreender as opções serverless e a ideia de desacoplar o frontend do backend para escalabilidade, bem como a utilidade de SDKs e padrões REST; em relação ao NestJS você mostrou apreciação por uma arquitetura mais estruturada e pela ênfase em manter o código limpo com princípios de Clean Code e DI, o que favorece manutenção. Sugestão de melhoria para próximas entrevistas: tente estruturar cada resposta com uma breve delimitação de situação, tarefa, ação e resultado, incluindo um exemplo concreto, mesmo que qualitativo, para facilitar a compreensão.",
        },
    ],
}

export default function MyScreenings() {
    const getStatusColor = (status: JobStatus) => {
        switch (status) {
            case "Encerrado":
                return "bg-red-500"
            case "Em andamento":
                return "bg-yellow-500"
            case "Aguardando":
                return "bg-yellow-500"
            default:
                return "bg-gray-500"
        }
    }

    return (
        <div className="min-h-full p-8 md:p-10 lg:p-12 pb-20">
            <PageHeader title="Minhas Triagens" />
            <details open className="mb-4">
                <summary className="cursor-pointer list-none">
                    <div className="border border-red-500 rounded-lg p-6 md:p-8 bg-white shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex-1 w-full md:w-auto">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">
                                    {mockJob.title}
                                </h2>
                                <h3 className="text-lg text-gray-700 mb-4">{mockJob.company}</h3>
                                <div className="flex items-center gap-2 mb-2">
                                    <span
                                        className={`w-3 h-3 rounded-full ${getStatusColor(mockJob.status)}`}
                                    />
                                    <span className="text-red-600 font-medium">
                                        {mockJob.status}
                                    </span>
                                </div>
                                <div className="mb-2">
                                    <p className="text-sm text-gray-600">Participação Enviada:</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {mockJob.submittedAt}
                                    </p>
                                </div>
                                <p className="text-sm text-gray-600">{mockJob.statusMessage}</p>
                            </div>
                            <div className="flex md:hidden items-center justify-end mt-2">
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Participação Enviada:</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {mockJob.submittedAt}
                                    </p>
                                </div>
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="mt-2"
                                >
                                    <path
                                        d="M12 5V19"
                                        stroke="black"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M19 12L12 19L5 12"
                                        stroke="black"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </summary>
                <div className="mt-4 pl-2 md:pl-6 lg:pl-8">
                    {mockJob.participations.map((participation) => (
                        <details key={participation.id} open className="mb-4">
                            <summary className="cursor-pointer list-none">
                                <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold text-gray-900">
                                                Participação {participation.id}
                                            </h4>
                                            <span className="text-sm text-gray-600">
                                                {participation.date}
                                            </span>
                                        </div>
                                        <svg
                                            width="27"
                                            height="28"
                                            viewBox="0 0 27 28"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M6.75 10.5L13.5 17.5L20.25 10.5"
                                                stroke="black"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </summary>
                            <div className="space-y-4 mt-4 pl-2 md:pl-6 lg:pl-8">
                                {participation.stages.map((stage) => (
                                    <div
                                        key={stage.id}
                                        className="bg-white border-l-4 border-green-500 rounded p-4 md:p-6 shadow-sm"
                                    >
                                        <div className="mb-2">
                                            <h5 className="font-semibold text-gray-900 mb-2">
                                                {stage.number} - Etapa
                                            </h5>
                                            <p className="text-gray-700 italic mb-4 pl-4 border-l-2 border-green-500">
                                                {stage.question}
                                            </p>
                                            <Button variant="ghost" className="text-yellow-600 p-0 h-auto">
                                                <span className="mr-2">Ouvir resposta:</span>
                                                <Play className="h-6 w-6 text-yellow-600" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {participation.feedback && (
                                    <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm">
                                        <h5 className="font-semibold text-gray-900 mb-2">
                                            Feedback IA:
                                        </h5>
                                        <p className="text-gray-700">{participation.feedback}</p>
                                    </div>
                                )}
                            </div>
                        </details>
                    ))}
                </div>
            </details>
        </div>
    )
}

