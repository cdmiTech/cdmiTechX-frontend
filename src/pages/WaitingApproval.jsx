import React, { useEffect, useContext } from 'react';
import { Clock, ShieldCheck, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const WaitingApproval = () => {
    const navigate = useNavigate();
    const { user, logout, refreshUserStatus } = useContext(AuthContext);

    useEffect(() => {
        // If already approved (e.g. user navigates here manually), redirect away
        if (user && user.status === 'Approved') {
            navigate('/my-workbook');
            return;
        }

        // Polling interval: check status every 5 seconds
        const interval = setInterval(async () => {
            const data = await refreshUserStatus();
            if (data && data.status === 'Approved') {
                navigate('/my-workbook');
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [user, refreshUserStatus, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="w-full max-w-lg">
                <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-xl shadow-indigo-100/40 p-10 sm:p-12 text-center transform transition-all animate-in fade-in zoom-in duration-500">
                    <div className="mb-8 relative inline-block">
                        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100 animate-pulse transition-all duration-1000">
                            <Clock className="w-10 h-10 text-indigo-600" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center border border-indigo-100 shadow-sm">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        </div>
                    </div>

                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-3">
                        Cdmi <span className="text-indigo-600">TechX</span>
                    </h1>

                    <div className="space-y-4 mb-10">
                        <p className="text-gray-600 text-lg leading-relaxed">
                            Welcome, <span className="text-indigo-600 font-semibold">{user?.name}</span>
                        </p>
                        <div className="inline-flex items-center px-5 py-2.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 font-bold animate-pulse">
                            Pending CDMI Approval
                        </div>
                        <p className="text-gray-500 text-xs font-medium">
                            Your dashboard will unlock automatically once approved.
                        </p>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleLogout}
                            className="group flex items-center justify-center gap-2 w-full py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 hover:text-gray-900 border border-transparent transition-all active:scale-[0.98]"
                        >
                            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Sign Out
                        </button>
                    </div>
                </div>

                <p className="text-center mt-10 text-gray-400 text-[10px] uppercase tracking-[0.3em] font-bold">
                    © 2026 CDMI TECHX
                </p>
            </div>
        </div>
    );
};

export default WaitingApproval;
