import { Menu } from "lucide-react"
import { useLayout } from "@/contexts/LayoutContext"

interface PageHeaderProps {
    title: string
}

export default function PageHeader({ title }: PageHeaderProps) {
    const { toggleSidebar, isMobile } = useLayout()

    return (
        <div className="flex items-center gap-2 mb-6">
            {isMobile && (
                <button
                    onClick={toggleSidebar}
                    className="p-2 self-start bg-white rounded-md shadow-lg border border-yellow-400 hover:bg-yellow-400/10 transition-colors"
                    aria-label="Open sidebar"
                >
                    <Menu className="w-6 h-6 text-yellow-400" />
                </button>
            )}
            <h1 className="text-2xl font-bold text-gray-900">
                {title}
            </h1>
        </div>
    )
}

