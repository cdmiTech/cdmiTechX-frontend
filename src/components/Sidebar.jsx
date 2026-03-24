import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import {
    LayoutDashboard,
    BookOpen,
    Users,
    Languages,
    FileQuestion,
    Book,
    Upload,
    User,
    LogOut,
    Shield,
    FileText,
    Library,
    Files,
    X
} from 'lucide-react';

const facultyLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/faculty-management', label: 'Faculty', icon: Shield },
    { path: '/courses', label: 'Courses', icon: BookOpen },
    { path: '/languages', label: 'Languages', icon: Languages },
    { path: '/topics', label: 'Topics', icon: Book },
    { path: '/questions', label: 'Questions', icon: FileQuestion },
    { path: '/students', label: 'Students', icon: Users },
    { path: '/workbooks', label: 'Workbooks', icon: Book },
    { path: '/materials', label: 'Materials', icon: FileText },
    { path: '/submissions', label: 'Submissions', icon: Upload },
    { path: '/reports', label: 'Reports', icon: FileText },
];

const studentLinks = [
    { path: '/my-workbook', label: 'My Workbook', icon: BookOpen },
    { path: '/my-materials', label: 'Materials', icon: Files },
    { path: '/report', label: 'Report', icon: FileText },
    { path: '/cpc', label: 'CPC', icon: FileText },
    { path: '/profile', label: 'My Profile', icon: User },
    // { path: '/submissions/my', label: 'My Submissions', icon: Upload },
];

const adminLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/faculty-management', label: 'Faculty Management', icon: Shield },
    { path: '/students', label: 'All Students', icon: Users }, // To assign faculty
    { path: '/submissions', label: 'Submissions', icon: Upload },
    { path: '/reports', label: 'Reports', icon: FileText },
];

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useContext(AuthContext);

    if (!user) return null;

    let links = [];
    if (user.role === 'admin') {
        links = adminLinks;
    } else if (user.role === 'faculty') {
        links = facultyLinks.filter(link => {
            if (link.label === 'Faculty' && user.email !== 'krushi@gmail.com') {
                return false;
            }
            return true;
        });
    } else {
        links = studentLinks;
    }

    return (
        <aside
            className={`
                fixed inset-y-0 left-0 bg-gray-900 text-white w-64 flex flex-col z-50 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
        >
            <div className="p-4 text-2xl font-bold border-b border-gray-700 flex items-center justify-between">
                <span>CDMI TechX</span>
                <button
                    onClick={onClose}
                    className="lg:hidden p-1 rounded-md hover:bg-gray-800 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                {links.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        onClick={() => {
                            if (window.innerWidth < 1024) onClose();
                        }}
                        className={({ isActive }) =>
                            `flex items-center p-3 rounded-lg transition-all duration-200 group ${isActive
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <link.icon className={`w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-400'
                                    }`} />
                                <span className="font-medium">{link.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-700 bg-gray-900/50 backdrop-blur-md">
                <div className="flex items-center space-x-3 mb-4 p-2 rounded-lg bg-gray-800/50">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold ring-2 ring-gray-700">
                        {user.username?.[0]?.toUpperCase() || user.role[0].toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold truncate">{user.username || user.email}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{user.role}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex w-full items-center p-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all duration-200 font-medium group"
                >
                    <LogOut className="w-5 h-5 mr-3 transition-transform group-hover:-translate-x-0.5" />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
