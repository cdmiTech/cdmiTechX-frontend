import { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { Eye, Search, Calendar, X, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const Submissions = () => {
    const [stats, setStats] = useState({ submitted: [], notSubmitted: [] });
    const [loading, setLoading] = useState(false);

    // Filters
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');

    const { user } = useContext(AuthContext);

    // Modal
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Faculty Filter
    const [faculties, setFaculties] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState(user?._id || '');

    // Pagination states
    const [submittedPage, setSubmittedPage] = useState(1);
    const [notSubmittedPage, setNotSubmittedPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchFaculties = async () => {
            try {
                const { data } = await api.get('/faculty');
                setFaculties(data);
            } catch (error) {
                console.error('Error fetching faculties:', error);
            }
        };
        fetchFaculties();
    }, []);

    useEffect(() => {
        if (user && !selectedFaculty) {
            setSelectedFaculty(user._id);
        }
    }, [user]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/submissions?date=${date}&studentName=${searchQuery}&facultyId=${selectedFaculty}`);
            setStats(data);
        } catch (error) {
            console.error('Error fetching submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Reset pages when filters change
        setSubmittedPage(1);
        setNotSubmittedPage(1);

        // Debounce search
        const timer = setTimeout(() => {
            fetchSubmissions();
        }, 500);
        return () => clearTimeout(timer);
    }, [date, searchQuery, selectedFaculty]);

    const handleViewDetails = (studentData) => {
        setSelectedStudent(studentData);
    };

    // Pagination logic for Submitted
    const submittedLastIndex = submittedPage * itemsPerPage;
    const submittedFirstIndex = submittedLastIndex - itemsPerPage;
    const currentSubmitted = stats.submitted.slice(submittedFirstIndex, submittedLastIndex);

    // Pagination logic for Not Submitted
    const notSubmittedLastIndex = notSubmittedPage * itemsPerPage;
    const notSubmittedFirstIndex = notSubmittedLastIndex - itemsPerPage;
    const currentNotSubmitted = stats.notSubmitted.slice(notSubmittedFirstIndex, notSubmittedLastIndex);

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Daily Submissions</h1>
                    <p className="text-gray-500 mt-1">Monitor student progress and evaluate submissions.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl w-full focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Student Search</label>
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl w-full focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Faculty</label>
                        <select
                            value={selectedFaculty}
                            onChange={(e) => setSelectedFaculty(e.target.value)}
                            className="px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl w-full focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm appearance-none cursor-pointer"
                        >
                            <option value="all">All Faculties</option>
                            {faculties.map((faculty) => (
                                <option key={faculty._id} value={faculty._id}>
                                    {faculty.username} {faculty._id === user?._id ? '(Me)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Content Split */}
            <div className="grid grid-cols-1 gap-6">

                {/* Not Submitted Section — FIRST */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-rose-50/50 px-6 py-4 border-b border-rose-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-rose-600" />
                            <h2 className="text-lg font-bold text-rose-900">Not Submitted</h2>
                        </div>
                        <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold">
                            {stats.notSubmitted.length} Students
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-6 py-3 text-left">Student</th>
                                    <th className="px-6 py-3 text-left">Batch</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan="2" className="text-center py-8">Loading...</td></tr>
                                ) : currentNotSubmitted.length === 0 ? (
                                    <tr><td colSpan="2" className="text-center py-8 text-gray-500">Everyone has submitted!</td></tr>
                                ) : (
                                    currentNotSubmitted.map((student) => (
                                        <tr key={student._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{student.name}</div>
                                                <div className="text-sm text-gray-500">{student.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{student.batchTime}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-3 border-t bg-gray-50">
                        <Pagination
                            totalItems={stats.notSubmitted.length}
                            itemsPerPage={itemsPerPage}
                            currentPage={notSubmittedPage}
                            onPageChange={setNotSubmittedPage}
                        />
                    </div>
                </div>

                {/* Submitted Section — SECOND */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-emerald-50/50 px-6 py-4 border-b border-emerald-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                            <h2 className="text-lg font-bold text-emerald-900">Submitted Work</h2>
                        </div>
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                            {stats.submitted.length} Students
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest font-bold">
                                <tr>
                                    <th className="px-6 py-4 text-left">Student</th>
                                    <th className="px-6 py-4 text-left">Batch</th>
                                    <th className="px-6 py-4 text-center">Questions</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan="4" className="text-center py-8">Loading...</td></tr>
                                ) : currentSubmitted.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-8 text-gray-500">No submissions found for this date.</td></tr>
                                ) : (
                                    currentSubmitted.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{item.student.name}</div>
                                                <div className="text-sm text-gray-500">{item.student.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{item.student.batchTime}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                                                    {item.count} Questions
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center" style={{ display: 'flex', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => handleViewDetails(item)}
                                                    className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-full hover:bg-indigo-100 transition"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-3 border-t bg-gray-50">
                        <Pagination
                            totalItems={stats.submitted.length}
                            itemsPerPage={itemsPerPage}
                            currentPage={submittedPage}
                            onPageChange={setSubmittedPage}
                        />
                    </div>
                </div>
            </div>

            {/* Detail Modal — wide custom modal */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60 shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{selectedStudent?.student?.name}'s Submissions</h3>
                                <div className="flex items-center gap-1.5 mt-1 text-sm text-indigo-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="overflow-y-auto p-6 flex-1 space-y-5">
                            {selectedStudent?.submissions.map((sub, idx) => (
                                <div key={sub._id} className="border border-gray-100 rounded-2xl p-5 hover:border-indigo-200 transition-all bg-white shadow-sm ring-1 ring-gray-100">
                                    {/* Question header */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0">
                                                Q{idx + 1}
                                            </div>
                                            <h3 className="font-bold text-gray-900 leading-tight pt-1">
                                                {sub.questionId?.question || 'Attached Image Question'}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100 shrink-0">
                                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content — dynamic grid based on presence of both text and image */}
                                    <div className={`grid gap-5 ${(sub.answerText && sub.imageUrl) ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                        {sub.answerText && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Student Answer</h4>
                                                </div>
                                                <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed min-h-[100px]">
                                                    {sub.answerText}
                                                </div>
                                            </div>
                                        )}

                                        {sub.imageUrl && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Evidence</h4>
                                                </div>
                                                <a
                                                    href={sub.imageUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block group relative rounded-xl overflow-hidden border border-gray-100 shadow-sm transition-all hover:ring-4 hover:ring-indigo-50"
                                                >
                                                    <img
                                                        src={sub.imageUrl}
                                                        alt="Submission"
                                                        className="w-full h-auto max-h-[500px] object-contain bg-gray-50 group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                                                        <span className="bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                                            Inspect Evidence
                                                        </span>
                                                    </div>
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-4 pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <span className="font-bold text-gray-400">Language:</span>
                                            <span className="px-2 py-0.5 bg-gray-100 rounded-md font-medium text-gray-600">{sub.languageId?.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <span className="font-bold text-gray-400">Topic:</span>
                                            <span className="px-2 py-0.5 bg-gray-100 rounded-md font-medium text-gray-600">{sub.topicId?.name}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default Submissions;

