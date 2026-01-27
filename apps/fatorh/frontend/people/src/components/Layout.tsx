import { useState, useEffect } from "react"
import { Outlet } from "react-router"
import Sidebar from "./Sidebar"
import { useSidebar } from "@/contexts/SidebarContext"
import { LayoutProvider } from "@/contexts/LayoutContext"

export default function Layout() {
    const [collapsed, setCollapsed] = useState(true)
    const [isMobile, setIsMobile] = useState(false)
    const { isPinned } = useSidebar()

    useEffect(() => {
        const checkIsMobile = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)

            // Auto-collapse sidebar on mobile
            if (mobile) {
                setCollapsed(true)
            }
        }

        // Initial check
        checkIsMobile()

        // Listen for window resize events
        window.addEventListener("resize", checkIsMobile)

        // Cleanup
        return () => {
            window.removeEventListener("resize", checkIsMobile)
        }
    }, [])

    const toggleSidebar = () => {
        setCollapsed(!collapsed)
    }

    // Calculate main content margin based on sidebar state
    const sidebarWidth = isMobile
        ? collapsed
            ? 0
            : 208 // w-52 = 13rem = 208px
        : isPinned || !collapsed
            ? 208
            : 48 // w-12 = 3rem = 48px

    return (
        <LayoutProvider toggleSidebar={toggleSidebar} isMobile={isMobile}>
            <div className="flex">
                <Sidebar
                    collapsed={collapsed}
                    toggleSidebar={toggleSidebar}
                    isMobile={isMobile}
                />
                <main
                    className="flex flex-col transition-all duration-300 bg-gray-50 min-h-0 w-full"
                    style={{ marginLeft: `${sidebarWidth}px` }}
                >
                    <Outlet />
                </main>

                {/* Mobile Sidebar Overlay */}
                {isMobile && !collapsed && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={toggleSidebar}
                        onKeyUp={(e) => {
                            if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
                                toggleSidebar()
                            }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label="Close sidebar"
                    />
                )}
            </div>
        </LayoutProvider>
    )
}

