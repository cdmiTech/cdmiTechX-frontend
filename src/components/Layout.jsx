import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex bg-gray-100 min-h-screen relative overflow-x-hidden text-gray-900">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-40 shadow-sm">
                <span className="text-xl font-bold text-indigo-600">Workbook App</span>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                    <Menu className="w-6 h-6 text-gray-600" />
                </button>
            </header>

            {/* Sidebar with toggle */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 p-4 lg:p-8 overflow-y-auto h-screen w-full pt-20 lg:pt-8 bg-gray-50/50">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
