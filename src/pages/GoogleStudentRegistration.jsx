import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { ArrowRight } from 'lucide-react';

import AuthContext from '../context/AuthContext';

const GoogleStudentRegistration = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { googleRegister } = useContext(AuthContext);

    // Data passed from the Login page (from Google)
    const { email, name, googleId, googleAccessToken } = location.state || {};

    const [courses, setCourses] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [loading, setLoading] = useState(false);

    const initialFormState = {
        name: name || '',
        email: email || '',
        batchTime: '',
        contact: '',
        courseId: '',
        facultyId: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        // Prevent direct access if no google info passed
        if (!email || !googleId) {
            toast.error("Invalid registration attempt. Please sign in with Google first.");
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                // We use parallel requests since these routes are public or accessible
                // We might need to ensure these backend routes are accessible without token for registration
                // Alternatively, backend needs public endpoints for courses and faculties
                const [coursesRes, facultiesRes] = await Promise.all([
                    api.get('/courses'),
                    api.get('/faculty')
                ]);
                setCourses(coursesRes.data);
                setFaculties(facultiesRes.data);
            } catch (error) {
                console.error('Error fetching registration data:', error);
                toast.error('Failed to load form data. Please try again later.');
            }
        };

        fetchData();
    }, [email, googleId, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataToSubmit = {
                ...formData,
                googleId
            };

            // Call the context google register which handles state
            await googleRegister(dataToSubmit, googleAccessToken);
            toast.success('Registration successful. Waiting for CDMI approval.');
            navigate('/waiting-approval');
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Registration failed';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!email || !googleId) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="w-full max-w-2xl">
                <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-xl shadow-indigo-100/30 p-8 sm:p-12 transform transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
                            Cdmi <span className="text-indigo-600">TechX</span>
                        </h2>
                        <p className="text-gray-500 font-medium text-sm">Complete Your Student Profile</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 text-sm"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    disabled
                                    className="w-full px-5 py-4 bg-gray-100 border border-gray-200 rounded-2xl outline-none text-sm text-gray-400 cursor-not-allowed"
                                    value={formData.email}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Contact Number</label>
                                <input
                                    type="text"
                                    name="contact"
                                    required
                                    pattern="\d{10}"
                                    maxLength="10"
                                    placeholder="10-digit mobile"
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 text-sm"
                                    value={formData.contact}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Batch Time</label>
                                <select
                                    name="batchTime"
                                    required
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 text-sm appearance-none"
                                    value={formData.batchTime}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Batch</option>
                                    <option value="8 to 10">8 to 10</option>
                                    <option value="10 to 12">10 to 12</option>
                                    <option value="12 to 2">12 to 2</option>
                                    <option value="2 to 4">2 to 4</option>
                                    <option value="4 to 6">4 to 6</option>
                                    <option value="6 to 8">6 to 8</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Enrolled Course</label>
                                <select
                                    name="courseId"
                                    required
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 text-sm appearance-none"
                                    value={formData.courseId}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Course</option>
                                    {courses.map(course => (
                                        <option key={course._id} value={course._id}>{course.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Your Faculty</label>
                                <select
                                    name="facultyId"
                                    required
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 text-sm appearance-none"
                                    value={formData.facultyId}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Faculty</option>
                                    {faculties.map(f => (
                                        <option key={f._id} value={f._id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-indigo-100"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
                                    {loading ? 'Processing...' : 'Complete Registration'}
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </button>
                        </div>
                    </form>
                </div>

                <div className="text-center mt-10">
                    <p className="text-gray-400 text-[10px] uppercase tracking-[0.3em] font-bold">
                        © 2026 CDMI TECHX
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GoogleStudentRegistration;
