import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const CreateWorkbook = () => {
    const [courses, setCourses] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedLanguages, setSelectedLanguages] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [coursesRes, languagesRes] = await Promise.all([
                    api.get('/courses'),
                    api.get('/languages')
                ]);
                setCourses(coursesRes.data);
                setLanguages(languagesRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, []);

    const handleLanguageToggle = (langId) => {
        if (selectedLanguages.includes(langId)) {
            setSelectedLanguages(selectedLanguages.filter(id => id !== langId));
        } else {
            setSelectedLanguages([...selectedLanguages, langId]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/workbooks', {
                courseId: selectedCourse,
                languages: selectedLanguages
            });
            navigate('/workbooks'); // Redirect to view workbooks
        } catch (error) {
            console.error('Error creating workbook:', error);
            alert(error.response?.data?.message || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">Create Workbook</h1>
            <p className="text-gray-500 mb-8">Select a course and the languages you want to include in this workbook.</p>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Select Course</label>
                    <select
                        required
                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm appearance-none cursor-pointer"
                        value={selectedCourse}
                        onChange={(e) => {
                            setSelectedCourse(e.target.value);
                            setSelectedLanguages([]); // Reset languages when course changes
                        }}
                    >
                        <option value="">-- Select Course --</option>
                        {courses.map(course => (
                            <option key={course._id} value={course._id}>{course.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                        <span>Select Languages for Workbook</span>
                        {!selectedCourse && <span className="text-rose-500 normal-case tracking-normal">(Please select a course first)</span>}
                    </label>
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-5 border border-gray-100 rounded-xl bg-gray-50/30 ${!selectedCourse ? 'opacity-60 pointer-events-none' : ''}`}>
                        {languages
                            .filter(lang => {
                                if (!selectedCourse) return false;
                                const course = courses.find(c => c._id === selectedCourse);
                                return course?.allowedLanguageIds?.some(al => (al._id || al) === lang._id);
                            })
                            .map(lang => (
                                <label key={lang._id} className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all shadow-sm">
                                    <input
                                        type="checkbox"
                                        disabled={!selectedCourse}
                                        checked={selectedLanguages.includes(lang._id)}
                                        onChange={() => handleLanguageToggle(lang._id)}
                                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                                    />
                                    <span className="text-gray-700 font-medium">{lang.name}</span>
                                </label>
                            ))}
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={loading || !selectedCourse || selectedLanguages.length === 0}
                        className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-indigo-400 transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Creating...' : 'Create Workbook'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateWorkbook;
