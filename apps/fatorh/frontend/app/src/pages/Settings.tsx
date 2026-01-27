import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import PageHeader from "@/components/PageHeader"

export default function Settings() {
    return (
        <div className="p-8 md:p-10 lg:p-12">
            <PageHeader title="Gerenciamento de conta" />

            <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 shadow-sm">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Excluir conta
                        </h2>
                        <p className="text-gray-600 max-w-2xl">
                            Ao excluir sua conta, todos os seus dados serão removidos permanentemente. Empresas não poderão mais acessar seus dados e você será removido de processos seletivos que tenha participado e de possíveis recomendações de processos seletivos. Essa ação não poderá ser desfeita.
                        </p>
                    </div>
                    <Button
                        variant="destructive"
                        className="ml-6 flex items-center gap-2 text-white bg-red-500"
                    >
                        <Trash2 className="h-4 w-4" />
                        Excluir conta
                    </Button>
                </div>
            </div>
        </div>
    )
}

