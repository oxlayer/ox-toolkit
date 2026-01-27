import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import { User, Lock, ChevronUp, ChevronDown, LayoutDashboard, FileText, FileImage, Plus, Settings, Tag as TagIcon, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import AddWorkspaceDialog from "@/components/workspace/AddWorkspaceDialog";
import WorkspaceSettingsDialog from "@/components/workspace/WorkspaceSettingsDialog";

type SidebarItemProps = {
    icon: React.ReactNode;
    label: React.ReactNode;
    collapsed: boolean;
    onClick?: () => void;
    className?: string;
    to?: string;
    isMobile?: boolean;
    toggleSidebar?: () => void;
    matchExact?: boolean;
};

const SidebarItem = ({
    icon,
    label,
    collapsed,
    onClick,
    className = "",
    to,
    isMobile = false,
    toggleSidebar,
    matchExact = false,
}: SidebarItemProps) => {
    const location = useLocation();
    const isActive = (() => {
        if (!to) return false;
        if (matchExact) {
            return location.pathname === to;
        }
        if (to === "/") {
            return location.pathname === "/";
        }
        return location.pathname === to || location.pathname.startsWith(`${to}/`);
    })();

    // Close sidebar on mobile when link is clicked
    const handleClick = () => {
        if (onClick) onClick();
        if (isMobile && toggleSidebar) {
            toggleSidebar();
        }
    };

    return (
        <Link
            to={to || "/"}
            className={cn(
                "flex items-center",
                collapsed ? "justify-center" : "justify-start",
                "p-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 w-full text-left",
                isActive
                    ? "bg-yellow-600/10 text-yellow-400"
                    : "text-[#DCDCDC] hover:text-yellow-400 hover:bg-[#2a2a2d]",
                className
            )}
            onClick={handleClick}
        >
            <div
                className={cn(
                    isActive ? "text-yellow-400" : "text-white",
                    "text-base relative transition-colors duration-200"
                )}
            >
                {icon}
            </div>
            {!collapsed && (
                <span
                    className={cn(
                        "ml-2 transition-all duration-300 whitespace-nowrap text-[13px]",
                        isActive ? "text-yellow-400" : "text-[#DCDCDC]"
                    )}
                >
                    {label}
                </span>
            )}
        </Link>
    );
};

type SidebarProps = {
    collapsed: boolean;
    toggleSidebar: () => void;
    isMobile?: boolean;
};

const Sidebar = ({ collapsed, toggleSidebar, isMobile = false }: SidebarProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showSidebarUserMenu, setShowSidebarUserMenu] = useState(false);
    const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
    const [showAddWorkspaceDialog, setShowAddWorkspaceDialog] = useState(false);
    const [showWorkspaceSettingsDialog, setShowWorkspaceSettingsDialog] = useState(false);
    const { isPinned, togglePin } = useSidebar();
    const { currentWorkspace, workspaces, setCurrentWorkspace, addWorkspace } = useWorkspace();
    const { userInfo, logout } = useAuth();
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const workspaceMenuRef = useRef<HTMLDivElement>(null);
    const workspaceButtonRef = useRef<HTMLButtonElement>(null);

    const toggleSidebarUserMenu = () => {
        setShowSidebarUserMenu(!showSidebarUserMenu);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                buttonRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setShowSidebarUserMenu(false);
            }
            if (
                workspaceMenuRef.current &&
                workspaceButtonRef.current &&
                !workspaceMenuRef.current.contains(event.target as Node) &&
                !workspaceButtonRef.current.contains(event.target as Node)
            ) {
                setShowWorkspaceMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Handle collapsed state change
    useEffect(() => {
        if (collapsed) {
            setShowSidebarUserMenu(false);
            setShowWorkspaceMenu(false);
        }
    }, [collapsed]);

    // Calculate sidebar width considering pinned state
    // On mobile, pinned state should be ineffective
    const isExpanded = isMobile ? !collapsed : (isPinned || !collapsed || isHovered);

    const navigation = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Exames", href: "/exames", icon: FileText },
        { name: "Templates", href: "/templates", icon: FileImage },
        { name: "Tags", href: "/configuracoes/tags", icon: TagIcon },
        { name: "Usuários por Tags", href: "/configuracoes/usuarios-por-tags", icon: Users },
    ];

    const handleAddWorkspace = (data: { name: string; description: string; domainAliases: string[]; rootManagerEmail: string }) => {
        addWorkspace(data);
    };

    // Extract user name and email from Keycloak token
    const userName = userInfo?.name || userInfo?.preferred_username || 'Usuário';
    const userEmail = userInfo?.email || '';

    return (
        <>
            <aside
                className={cn(
                    "fixed top-0 left-0 h-full bg-linear-to-b from-[#0f1011] via-[#151618] to-[#0d0e10] border-r border-[#2b2d2f] transition-all duration-300 ease-in-out flex flex-col z-50 overflow-hidden",
                    isMobile
                        ? collapsed
                            ? "w-16"
                            : "w-52"
                        : isExpanded
                            ? "w-52"
                            : "w-12"
                )}
                onMouseEnter={() => !isMobile && setIsHovered(true)}
                onMouseLeave={() => !isMobile && setIsHovered(false)}
                style={{
                    transform: isMobile && collapsed ? "translateX(-100%)" : "translateX(0)",
                }}
            >
                {/* Header with Logo and Pin Button */}
                <div
                    className={cn(
                        "flex items-center p-3 mb-1 transition-all duration-300",
                        isExpanded && !isMobile ? "justify-between" : "justify-center"
                    )}
                >
                    <div className="flex items-center">
                        {!isExpanded && (
                            <div className="flex items-center p-1 relative">
                                <span>
                                    <svg width="30" height="21" viewBox="0 0 30 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M2.59701 21C1.16272 21 0 19.8373 0 18.403V10.2C0 8.76 0.407962 7.63 1.22388 6.81C2.0597 5.97 3.21393 5.55 4.68657 5.55H7.36298C8.48964 5.55 9.40298 6.46334 9.40298 7.59C9.40298 8.71666 8.48965 9.63 7.36298 9.63H6.26866C5.95025 9.63 5.69154 9.73 5.49254 9.93C5.29353 10.13 5.19403 10.39 5.19403 10.71V18.403C5.19403 19.8373 4.03131 21 2.59701 21Z" fill="white" />
                                        <path d="M14.2239 21C12.6495 21 11.3731 19.7237 11.3731 18.1493V2.85075C11.3731 1.27632 12.6495 0 14.2239 0C15.7983 0 17.0746 1.27632 17.0746 2.85075V4.42806C17.0746 6.42288 18.6917 8.04 20.6866 8.04C22.6814 8.04 24.2985 6.42288 24.2985 4.42806V2.85075C24.2985 1.27632 25.5748 0 27.1493 0C28.7237 0 30 1.27632 30 2.85075V18.1493C30 19.7237 28.7237 21 27.1493 21C25.5748 21 24.2985 19.7237 24.2985 18.1493V16.3019C24.2985 14.3071 22.6814 12.69 20.6866 12.69C18.6917 12.69 17.0746 14.3071 17.0746 16.3019V18.1493C17.0746 19.7237 15.7983 21 14.2239 21Z" fill="#F8EA01" />
                                    </svg>
                                </span>
                                {!isMobile && isPinned && !isExpanded && (
                                    <div className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-400 rounded-full" />
                                )}
                            </div>
                        )}
                        {isExpanded && (
                            <span className="ml-2 text-lg font-bold whitespace-nowrap">
                                <svg width="120" height="27" viewBox="0 0 120 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2 26.5077C0.895428 26.5077 0 25.6123 0 24.5077V7.99018C0 6.47546 0.365642 5.12483 1.09693 3.93829C1.82821 2.72651 2.82427 1.76718 4.08511 1.06031C5.37116 0.353436 6.80851 0 8.39716 0H16.5721C17.6767 0 18.5721 0.895431 18.5721 2V3.86957C18.5721 4.97414 17.6767 5.86957 16.5721 5.86957H9.45627C8.82585 5.86957 8.2963 6.08415 7.86761 6.51333C7.43893 6.9425 7.22459 7.46003 7.22459 8.06592V9.43618C7.22459 10.5408 8.12002 11.4362 9.22459 11.4362H15.3617C16.4663 11.4362 17.3617 12.3316 17.3617 13.4362V15.1921C17.3617 16.2967 16.4663 17.1921 15.3617 17.1921H9.22459C8.12002 17.1921 7.22459 18.0876 7.22459 19.1921V24.5077C7.22459 25.6123 6.32916 26.5077 5.22459 26.5077H2Z" fill="white" />
                                    <path d="M28.7072 27C27.0176 27 25.5172 26.5708 24.206 25.7125C22.8947 24.8541 21.8608 23.6802 21.1043 22.1907C20.373 20.676 20.0074 18.9593 20.0074 17.0407C20.0074 15.021 20.4487 13.216 21.3313 11.6255C22.2391 10.0351 23.4999 8.79804 25.1138 7.91445C26.7276 7.00561 28.6315 6.55119 30.8254 6.55119C32.9688 6.55119 34.8096 6.99299 36.3478 7.87658C37.9113 8.76017 39.1217 9.97195 39.979 11.5119C40.8364 13.0519 41.2651 14.8191 41.2651 16.8135V24.5077C41.2651 25.6123 40.3696 26.5077 39.2651 26.5077H36.463C35.6265 26.5077 34.9483 25.8295 34.9483 24.993V23.5723C34.9483 23.5204 34.9062 23.4783 34.8542 23.4783C34.8191 23.4783 34.7869 23.4979 34.7705 23.529C34.4213 24.19 33.9763 24.779 33.4353 25.2959C32.8805 25.8261 32.2123 26.2426 31.4306 26.5456C30.6741 26.8485 29.7663 27 28.7072 27ZM30.6741 21.2819C31.481 21.2819 32.1745 21.0926 32.7544 20.7139C33.3344 20.31 33.7883 19.7672 34.1161 19.0856C34.444 18.4039 34.6079 17.6339 34.6079 16.7756C34.6079 15.9173 34.444 15.1725 34.1161 14.5414C33.7883 13.885 33.3344 13.3675 32.7544 12.9888C32.1745 12.5849 31.481 12.3829 30.6741 12.3829C29.8923 12.3829 29.1989 12.5849 28.5937 12.9888C28.0137 13.3675 27.5598 13.885 27.232 14.5414C26.9042 15.1725 26.7402 15.9173 26.7402 16.7756C26.7402 17.6339 26.9042 18.4039 27.232 19.0856C27.5598 19.7672 28.0137 20.31 28.5937 20.7139C29.1989 21.0926 29.8923 21.2819 30.6741 21.2819Z" fill="white" />
                                    <path d="M50.2296 26.5077C48.3888 26.5077 46.9388 25.9902 45.8797 24.9551C44.8458 23.8948 44.3289 22.4558 44.3289 20.6381V4.34783C44.3289 3.24326 45.2243 2.34783 46.3289 2.34783H48.8726C49.9772 2.34783 50.8726 3.24326 50.8726 4.34783V20.1459C50.8726 20.4236 50.9735 20.6634 51.1752 20.8654C51.377 21.0421 51.6165 21.1304 51.8939 21.1304H54.1303C55.2349 21.1304 56.1303 22.0259 56.1303 23.1304V24.5077C56.1303 25.6123 55.2349 26.5077 54.1303 26.5077H50.2296ZM43.2651 12.1557C42.1605 12.1557 41.2651 11.2602 41.2651 10.1557V9.00561C41.2651 7.90104 42.1605 7.00561 43.2651 7.00561H54.1303C55.2349 7.00561 56.1303 7.90104 56.1303 9.00561V10.1557C56.1303 11.2602 55.2349 12.1557 54.1303 12.1557H43.2651Z" fill="white" />
                                    <path d="M68.3697 26.9621C66.4028 26.9621 64.6124 26.533 62.9985 25.6746C61.4099 24.791 60.1364 23.5792 59.1782 22.0393C58.22 20.4993 57.7408 18.7321 57.7408 16.7377C57.7408 14.7686 58.22 13.014 59.1782 11.4741C60.1364 9.93408 61.4225 8.73492 63.0363 7.87658C64.6502 6.99299 66.4406 6.55119 68.4075 6.55119C70.3744 6.55119 72.1522 6.99299 73.7408 7.87658C75.3547 8.73492 76.6282 9.93408 77.5612 11.4741C78.5194 13.014 78.9985 14.7686 78.9985 16.7377C78.9985 18.7321 78.5194 20.4993 77.5612 22.0393C76.6282 23.5792 75.3547 24.791 73.7408 25.6746C72.1522 26.533 70.3618 26.9621 68.3697 26.9621ZM68.3697 21.1304C69.1766 21.1304 69.8827 20.9411 70.4879 20.5624C71.1183 20.1837 71.5974 19.6662 71.9252 19.0098C72.2531 18.3282 72.417 17.5708 72.417 16.7377C72.417 15.8794 72.2531 15.122 71.9252 14.4656C71.5974 13.8093 71.1183 13.2917 70.4879 12.913C69.8827 12.5344 69.1766 12.345 68.3697 12.345C67.5627 12.345 66.8567 12.5344 66.2515 12.913C65.6463 13.2917 65.1672 13.8093 64.8141 14.4656C64.4863 15.122 64.3224 15.8794 64.3224 16.7377C64.3224 17.5708 64.4863 18.3282 64.8141 19.0098C65.1672 19.6662 65.6463 20.1837 66.2515 20.5624C66.8567 20.9411 67.5627 21.1304 68.3697 21.1304Z" fill="white" />
                                    <path d="M85.2766 26.5077C83.4591 26.5077 81.9858 25.0344 81.9858 23.2169V12.8752C81.9858 11.0575 82.5028 9.63114 83.5366 8.59607C84.5957 7.53576 86.0583 7.00561 87.9244 7.00561H91.3257C92.7478 7.00561 93.9007 8.15849 93.9007 9.58064C93.9007 11.0028 92.7478 12.1557 91.3257 12.1557H89.9291C89.5256 12.1557 89.1978 12.2819 88.9456 12.5344C88.6935 12.7868 88.5674 13.115 88.5674 13.5189V23.2169C88.5674 25.0344 87.094 26.5077 85.2766 26.5077Z" fill="white" />
                                    <path d="M100.009 26.5077C98.0144 26.5077 96.3972 24.8904 96.3972 22.8954V3.6123C96.3972 1.61728 98.0144 0 100.009 0C102.004 0 103.622 1.61728 103.622 3.6123V5.57184C103.622 8.09955 105.671 10.1487 108.199 10.1487C110.726 10.1487 112.775 8.09955 112.775 5.57184V3.61229C112.775 1.61728 114.393 0 116.388 0C118.383 0 120 1.61728 120 3.6123V22.8954C120 24.8904 118.383 26.5077 116.388 26.5077C114.393 26.5077 112.775 24.8904 112.775 22.8954V20.5951C112.775 18.0673 110.726 16.0182 108.199 16.0182C105.671 16.0182 103.622 18.0673 103.622 20.5951V22.8954C103.622 24.8904 102.004 26.5077 100.009 26.5077Z" fill="#F8EA01" />
                                </svg>
                            </span>
                        )}
                    </div>

                    {/* Pin Button - only show on desktop and when expanded */}
                    {!isMobile && isExpanded && (
                        <button
                            type="button"
                            onClick={togglePin}
                            className="p-1.5 rounded-md hover:bg-[#2a2a2d] transition-colors duration-200 shrink-0"
                            title={isPinned ? "Unpin Sidebar" : "Pin Sidebar"}
                        >
                            <Lock
                                className={cn(
                                    "w-3.5 h-3.5 transition-colors",
                                    isPinned ? "text-yellow-400" : "text-[#DCDCDC] hover:text-yellow-400"
                                )}
                            />
                        </button>
                    )}
                </div>

                {/* Workspace Selector */}
                <div className="px-2 mb-3 relative">
                    <button
                        ref={workspaceButtonRef}
                        type="button"
                        onClick={() => isExpanded && setShowWorkspaceMenu(!showWorkspaceMenu)}
                        className={cn(
                            "w-full flex items-center gap-2 p-2 rounded-md bg-[#1a1b1e] border border-[#2b2d2f] hover:border-yellow-400/50 transition-all duration-200",
                            !isExpanded && "justify-center"
                        )}
                    >
                        <div className="w-6 h-6 rounded bg-yellow-600/20 flex items-center justify-center shrink-0">
                            <span className="text-yellow-400 text-xs font-bold">
                                {currentWorkspace?.name?.charAt(0) || "W"}
                            </span>
                        </div>
                        {isExpanded && (
                            <>
                                <span className="text-[#DCDCDC] text-xs font-medium truncate flex-1 text-left">
                                    {currentWorkspace?.name || "Selecionar Workspace"}
                                </span>
                                <ChevronDown
                                    className={cn(
                                        "w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0",
                                        showWorkspaceMenu && "rotate-180"
                                    )}
                                />
                            </>
                        )}
                    </button>

                    {/* Workspace Dropdown Menu */}
                    {showWorkspaceMenu && isExpanded && (
                        <div
                            ref={workspaceMenuRef}
                            className="absolute top-full left-2 right-2 mt-1 bg-[#1a1b1e] border border-[#2b2d2f] rounded-md overflow-hidden shadow-lg z-20"
                        >
                            <div className="p-2 border-b border-[#2b2d2f] flex items-center justify-between">
                                <span className="text-xs text-gray-500 uppercase tracking-wide">Workspaces</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowWorkspaceMenu(false);
                                        setShowWorkspaceSettingsDialog(true);
                                    }}
                                    className="p-1 hover:bg-[#2a2a2d] rounded transition-colors"
                                    title="Gerenciar Workspaces"
                                >
                                    <Settings className="w-3.5 h-3.5 text-gray-400 hover:text-yellow-400" />
                                </button>
                            </div>

                            {/* Lista de workspaces */}
                            <div className="max-h-[200px] overflow-y-auto">
                                {workspaces.map((workspace) => (
                                    <button
                                        key={workspace.id}
                                        type="button"
                                        onClick={() => {
                                            setCurrentWorkspace(workspace.id);
                                            setShowWorkspaceMenu(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-2 p-2 text-left hover:bg-[#2a2a2d] transition-colors",
                                            currentWorkspace?.id === workspace.id && "bg-yellow-600/10"
                                        )}
                                    >
                                        <div className="w-6 h-6 rounded bg-yellow-600/20 flex items-center justify-center shrink-0">
                                            <span className="text-yellow-400 text-xs font-bold">
                                                {workspace.name.charAt(0)}
                                            </span>
                                        </div>
                                        <span
                                            className={cn(
                                                "text-xs font-medium truncate",
                                                currentWorkspace?.id === workspace.id
                                                    ? "text-yellow-400"
                                                    : "text-[#DCDCDC]"
                                            )}
                                        >
                                            {workspace.name}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Botão criar novo */}
                            <div className="border-t border-[#2b2d2f]">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowWorkspaceMenu(false);
                                        setShowAddWorkspaceDialog(true);
                                    }}
                                    className="w-full flex items-center gap-2 p-2 text-left hover:bg-[#2a2a2d] transition-colors text-yellow-400"
                                >
                                    <div className="w-6 h-6 rounded bg-yellow-600/20 flex items-center justify-center shrink-0">
                                        <Plus className="w-3.5 h-3.5 text-yellow-400" />
                                    </div>
                                    <span className="text-xs font-medium">
                                        Criar Novo Workspace
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-hidden hover:overflow-y-auto">
                    <nav className="space-y-1 px-2">
                        {navigation.map((item) => (
                            <SidebarItem
                                key={item.name}
                                icon={<item.icon className="w-5 h-5" />}
                                label={item.name}
                                collapsed={!isExpanded}
                                to={item.href}
                                isMobile={isMobile}
                                toggleSidebar={toggleSidebar}
                                matchExact={item.href === "/"}
                            />
                        ))}
                    </nav>
                </div>

                {/* Sidebar bottom user section */}
                <div className="shrink-0 mt-auto border-t border-[#2b2d2f] relative">
                    <button
                        type="button"
                        ref={buttonRef}
                        onClick={toggleSidebarUserMenu}
                        className="w-full flex items-center justify-center transition-all duration-300 h-[60px] hover:bg-[#2a2a2d]"
                    >
                        {!isExpanded ? (
                            <div className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center text-white overflow-hidden">
                                <User className="w-5 h-5" />
                            </div>
                        ) : (
                            <div className="flex items-center w-full px-3">
                                <div className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center text-white shrink-0 overflow-hidden">
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="ml-2 text-left overflow-hidden whitespace-nowrap transition-all duration-300">
                                    <p className="text-sm text-[#DCDCDC] font-medium truncate">
                                        {userName}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {userEmail}
                                    </p>
                                </div>
                                <ChevronUp
                                    className={cn(
                                        "w-5 h-5 text-gray-400 transition-transform duration-300 ml-auto",
                                        showSidebarUserMenu ? "rotate-180" : ""
                                    )}
                                />
                            </div>
                        )}
                    </button>

                    {/* User Menu */}
                    {showSidebarUserMenu && (
                        <div
                            ref={menuRef}
                            className="absolute bottom-full left-0 w-full bg-[#1a1b1e] border border-[#2b2d2f] rounded-t-md overflow-hidden shadow-lg transition-all duration-300 z-10"
                        >
                            <button
                                type="button"
                                className="flex items-center gap-2 p-3 py-2 text-sm text-red-400 hover:bg-red-900/20 w-full text-left transition-colors"
                                onClick={async () => {
                                    setShowSidebarUserMenu(false);
                                    try {
                                        await logout();
                                    } catch (error) {
                                        console.error('Logout failed:', error);
                                    }
                                }}
                            >
                                <span>Sair</span>
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Dialogs */}
            <AddWorkspaceDialog
                open={showAddWorkspaceDialog}
                onOpenChange={setShowAddWorkspaceDialog}
                onSave={handleAddWorkspace}
            />

            <WorkspaceSettingsDialog
                open={showWorkspaceSettingsDialog}
                onOpenChange={setShowWorkspaceSettingsDialog}
                onAddWorkspace={() => setShowAddWorkspaceDialog(true)}
            />
        </>
    );
};

export default Sidebar;
