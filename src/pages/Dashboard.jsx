import { useEffect, useState } from 'react';
import api from '../utils/api';
import { Users, BookOpen, Languages, ListTree, HelpCircle, FileText } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalCourses: 0,
        totalLanguages: 0,
        totalTopics: 0,
        totalQuestions: 0,
        totalWorkbooks: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/dashboard/stats');
                setStats(data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'bg-blue-500' },
        { label: 'Total Courses', value: stats.totalCourses, icon: BookOpen, color: 'bg-green-500' },
        { label: 'Total Languages', value: stats.totalLanguages, icon: Languages, color: 'bg-yellow-500' },
        { label: 'Total Topics', value: stats.totalTopics, icon: ListTree, color: 'bg-purple-500' },
        { label: 'Total Questions', value: stats.totalQuestions, icon: HelpCircle, color: 'bg-red-500' },
        { label: 'Total Workbooks', value: stats.totalWorkbooks, icon: FileText, color: 'bg-indigo-500' },
    ];

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
                <p className="text-gray-500 mt-1">Quick summary of your workbook system performance.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {statCards.map((card, index) => (
                    <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 flex items-center hover:shadow-md transition-all group">
                        <div className={`p-3.5 sm:p-4 rounded-xl ${card.color} text-white mr-4 shadow-lg shadow-${card.color.split('-')[1]}-100 transition-transform group-hover:scale-105`}>
                            <card.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">{card.value.toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
