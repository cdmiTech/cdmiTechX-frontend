import { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { Eye, Search, Calendar, X, Clock, User, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const FacultyReport = () => {
    const [stats, setStats] = useState({ submitted: [], notSubmitted: [] });
    const [loading, setLoading] = useState(false);

    // Filters
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');

    const { user } = useContext(AuthContext);

    // Modal
    const [selectedReport, setSelectedReport] = useState(null);

    // Faculty Filter
    const [faculties, setFaculties] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState(user?._id || '');

    // Pagination states
    const [submittedPage, setSubmittedPage] = useState(1);
    const [notSubmittedPage, setNotSubmittedPage] = useState(1);
    const itemsPerPage = 10;

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

    const fetchReports = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/reports/faculty?date=${date}&studentName=${searchQuery}&facultyId=${selectedFaculty === 'all' ? '' : selectedFaculty}`);
            setStats(data);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setSubmittedPage(1);
        setNotSubmittedPage(1);

        const timer = setTimeout(() => {
            fetchReports();
        }, 500);
        return () => clearTimeout(timer);
    }, [date, searchQuery, selectedFaculty]);

    const handleViewReport = (report) => {
        setSelectedReport(report);
    };

    // Pagination logic
    const submittedLastIndex = submittedPage * itemsPerPage;
    const submittedFirstIndex = submittedLastIndex - itemsPerPage;
    const currentSubmitted = stats.submitted.slice(submittedFirstIndex, submittedLastIndex);

    const notSubmittedLastIndex = notSubmittedPage * itemsPerPage;
    const notSubmittedFirstIndex = notSubmittedLastIndex - itemsPerPage;
    const currentNotSubmitted = stats.notSubmitted.slice(notSubmittedFirstIndex, notSubmittedLastIndex);

    return (
        <div className="space-y-6 pb-10 p-4 sm:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <FileText className="w-8 h-8 text-indigo-600" />
                        Daily Reports Dashboard
                    </h1>
                    <p className="text-gray-500 mt-1">Track student daily activity and progress reports.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Report Date</label>
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
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl w-full focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Faculty Filter</label>
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

            <div className="grid grid-cols-1 gap-8">
                {/* Not Submitted Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-rose-50/50 px-6 py-4 border-b border-rose-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-rose-600" />
                            <h2 className="text-lg font-bold text-rose-900">Report Not Submitted</h2>
                        </div>
                        <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold">
                            {stats.notSubmitted.length} Students
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/50 text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4 text-left">Student Name</th>
                                    <th className="px-6 py-4 text-left">Batch Time</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="3" className="text-center py-8">Loading...</td></tr>
                                ) : currentNotSubmitted.length === 0 ? (
                                    <tr><td colSpan="3" className="text-center py-8 text-gray-500">No students found or everyone submitted.</td></tr>
                                ) : (
                                    currentNotSubmitted.map((student) => (
                                        <tr key={student._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">{student.name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 font-medium">{student.batchTime}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-rose-100">
                                                    Missing
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {stats.notSubmitted.length > itemsPerPage && (
                        <div className="px-6 py-3 border-t bg-gray-50/30">
                            <Pagination
                                totalItems={stats.notSubmitted.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={notSubmittedPage}
                                onPageChange={setNotSubmittedPage}
                            />
                        </div>
                    )}
                </div>

                {/* Submitted Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-emerald-50/50 px-6 py-4 border-b border-emerald-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                            <h2 className="text-lg font-bold text-emerald-900">Report Submitted</h2>
                        </div>
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                            {stats.submitted.length} Students
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/50 text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4 text-left">Student Name</th>
                                    <th className="px-6 py-4 text-left">Batch Time</th>
                                    <th className="px-6 py-4 text-left">Details</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="4" className="text-center py-8">Loading...</td></tr>
                                ) : currentSubmitted.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-8 text-gray-500">No reports submitted for this date.</td></tr>
                                ) : (
                                    currentSubmitted.map((report) => (
                                        <tr key={report._id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">{report.studentId?.name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 font-medium">{report.studentId?.batchTime}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs space-y-1">
                                                    <p className="font-bold text-indigo-600 uppercase tracking-tighter">
                                                        {report.languageIds && report.languageIds.length > 0 
                                                            ? report.languageIds.map(l => l?.name).filter(Boolean).join(', ')
                                                            : (report.languageId?.name || '-')}
                                                    </p>
                                                    <p className="text-gray-400 italic">
                                                        {Array.isArray(report.topicIds)
                                                            ? report.topicIds.map(t => t?.name).filter(Boolean).join(', ')
                                                            : report.topicIds?.name || '-'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center" style={{ display: 'flex', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => handleViewReport(report)}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm hover:shadow-indigo-100"
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
                    {stats.submitted.length > itemsPerPage && (
                        <div className="px-6 py-3 border-t bg-gray-50/30">
                            <Pagination
                                totalItems={stats.submitted.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={submittedPage}
                                onPageChange={setSubmittedPage}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* View Report Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 transition-all animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-gray-100 bg-white flex justify-between items-center sticky top-0">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Student Report Details</h2>
                                <p className="text-indigo-600 font-medium text-sm mt-1 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {new Date(selectedReport.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto space-y-8 flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Student Name</span>
                                    <p className="text-lg font-bold text-gray-800">{selectedReport.studentId?.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Batch Time</span>
                                    <p className="text-lg font-bold text-gray-800">{selectedReport.studentId?.batchTime}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Language(s)</span>
                                    <p className="text-lg font-bold text-indigo-600">
                                        {selectedReport.languageIds && selectedReport.languageIds.length > 0 
                                            ? selectedReport.languageIds.map(l => l?.name).filter(Boolean).join(', ')
                                            : (selectedReport.languageId?.name || '-')}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Topic</span>
                                    <p className="text-lg font-bold text-gray-800">
                                        {Array.isArray(selectedReport.topicIds)
                                            ? selectedReport.topicIds.map(t => t?.name).filter(Boolean).join(', ')
                                            : selectedReport.topicIds?.name || '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-500" />
                                    <h3 className="font-bold text-gray-800">Learning Description</h3>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[150px]">
                                    {selectedReport.description}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        {/* <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
                            >
                                Close View
                            </button>
                        </div> */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyReport;
