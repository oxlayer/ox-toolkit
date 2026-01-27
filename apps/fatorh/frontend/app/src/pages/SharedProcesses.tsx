import { ArrowUpDown, Filter } from "lucide-react"
import PageHeader from "@/components/PageHeader"

export default function SharedProcesses() {
    return (
        <div className="min-h-full p-8 md:p-10 lg:p-12 pb-20">
            <PageHeader title="Processos compartilhados" />
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="flex items-center gap-2">
                                    Título
                                    <ArrowUpDown className="h-4 w-4 text-gray-400" />
                                    <Filter className="h-4 w-4 text-gray-400" />
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="flex items-center gap-2">
                                    Compartilhado por
                                    <ArrowUpDown className="h-4 w-4 text-gray-400" />
                                    <Filter className="h-4 w-4 text-gray-400" />
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="flex items-center gap-2">
                                    Data de compartilhamento
                                    <ArrowUpDown className="h-4 w-4 text-gray-400" />
                                    <Filter className="h-4 w-4 text-gray-400" />
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="flex items-center gap-2">
                                    Status
                                    <ArrowUpDown className="h-4 w-4 text-gray-400" />
                                    <Filter className="h-4 w-4 text-gray-400" />
                                </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ver resultados
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center">
                                <p className="text-gray-500">
                                    Ainda não há processos compartilhados.
                                </p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}

