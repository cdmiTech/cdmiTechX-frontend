import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { BookOpen } from 'lucide-react';

const CPCSelection = () => {
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get('/students/me');
                setStudentData(data);
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const allowedLanguages = studentData?.allowedLanguageIds || [];

    return (
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-indigo-600" />
                    Course Progress Card (CPC)
                </h1>
                <p className="text-gray-500 mb-8 ml-11">Select a language to view your progress table.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {allowedLanguages.length === 0 ? (
                        <div className="col-span-full bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100">
                            <p className="text-gray-500 italic">No languages assigned yet.</p>
                        </div>
                    ) : (
                        allowedLanguages.map(lang => (
                            <div
                                key={lang._id}
                                onClick={() => navigate(`/cpc/${lang._id}`)}
                                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer border border-gray-100 hover:border-indigo-300 group relative overflow-hidden active:scale-95"
                            >

                                <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 relative z-10">{lang.name}</h3>
                                <div className="mt-4 flex items-center text-sm text-indigo-500 font-semibold group-hover:translate-x-1 transition-transform relative z-10">
                                    View Progress Table →
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CPCSelection;
