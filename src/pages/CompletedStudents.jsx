import { useState, useEffect } from 'react';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { Eye, Briefcase, List, CheckCircle2, Trophy } from 'lucide-react';
import StudentDetailModal from '../components/StudentDetailModal';
import { toast } from 'react-toastify';

// Helper: get the logged-in user's data from sessionStorage
const getLoggedInUser = () => {
    try {
        const user = sessionStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
};

const CompletedStudents = () => {
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterName, setFilterName] = useState('');
    const [filterFacultyId, setFilterFacultyId] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Detail modal state
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [detailStudent, setDetailStudent] = useState(null);
    const [isLangModalOpen, setIsLangModalOpen] = useState(false);
    const [selectedAllowedLanguages, setSelectedAllowedLanguages] = useState([]);

    const fetchCompletedStudents = async (facultyId) => {
        try {
            setLoading(true);
            const params = facultyId ? `&facultyId=${facultyId}` : '';
            const { data } = await api.get(`/students?completed=true${params}`);
            setStudents(data);
        } catch (error) {
            console.error('Error fetching completed students:', error);
            toast.error('Failed to load completed students');
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async () => {
        const loggedInUser = getLoggedInUser();
        const defaultFacultyId = loggedInUser?._id || '';
        setFilterFacultyId(defaultFacultyId);
        fetchCompletedStudents(defaultFacultyId);

        // Fetch Courses
        try {
            const { data } = await api.get('/courses');
            setCourses(data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }

        // Fetch Languages
        try {
            const { data } = await api.get('/languages');
            setLanguages(data);
        } catch (error) {
            console.error('Error fetching languages:', error);
        }

        // Fetch Faculties
        try {
            const { data } = await api.get('/faculty');
            setFaculties(data);
        } catch (error) {
            console.error('Error fetching faculties:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFacultyFilterChange = (e) => {
        const fid = e.target.value;
        setFilterFacultyId(fid);
        setCurrentPage(1);
        fetchCompletedStudents(fid);
    };

    // Filter students by name
    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(filterName.toLowerCase())
    );

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

    const handleFilterNameChange = async (e) => {
        const name = e.target.value;
        setFilterName(name);
        setCurrentPage(1);
        if (name.trim()) {
            // Fetch completed across all faculties
            try {
                const { data } = await api.get(`/students?completed=true`);
                setStudents(data);
            } catch (err) {
                console.error(err);
            }
        } else {
            await fetchCompletedStudents(filterFacultyId);
        }
    };

    const openDetailModal = (student) => {
        setDetailStudent(student);
        setIsDetailModalOpen(true);
    };

    const handleJobDone = async (student) => {
        if (window.confirm(`Are you sure you want to mark ${student.name}'s Placement as JOB DONE? This will fully disable the student's portal access.`)) {
            try {
                await api.put(`/students/${student._id}/job-done`);
                toast.success('Placement Process Completed! Student account disabled.');
                fetchCompletedStudents(filterFacultyId);
            } catch (error) {
                console.error('Error marking job done:', error);
                toast.error(error.response?.data?.message || 'Error processing request');
            }
        }
    };

    const columns = [
        { header: 'Name', accessor: 'name' },
        { header: 'Email', accessor: 'email' },
        {
            header: 'Placement Status',
            render: (row) => (
                <span className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 w-max ${row.jobDone
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-indigo-100 text-indigo-800 animate-pulse'
                    }`}>
                    <Briefcase className="w-3.5 h-3.5" />
                    {row.jobDone ? 'Job Done (Disabled)' : 'In Placement'}
                </span>
            )
        },
        { header: 'Batch Time', accessor: 'batchTime' },
        { header: 'Course', render: (row) => row.courseId?.name || '-' },
        {
            header: 'Allowed Languages',
            render: (row) => (
                <div className="flex justify-center items-center">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAllowedLanguages(row.allowedLanguageIds || []);
                            setIsLangModalOpen(true);
                        }}
                        title="View allowed languages"
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-700"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            )
        },
        {
            header: 'Actions',
            render: (row) => (
                <div className="flex justify-center items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); openDetailModal(row); }}
                        title="View Student Details & History"
                        className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    {!row.jobDone ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleJobDone(row); }}
                            title="Mark Job Done & Disable Portal"
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors"
                        >
                            <Trophy className="w-4 h-4" />
                        </button>
                    ) : (
                        <span className="p-1.5 text-gray-400" title="Account Deactivated">
                            <CheckCircle2 className="w-4 h-4" />
                        </span>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Completed Students</h1>
                    <p className="text-gray-500 mt-1">View course completed alumni and manage placement status.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    {/* Faculty Filter */}
                    <div className="relative w-full sm:w-48">
                        <select
                            className="px-4 py-2.5 border border-gray-200 rounded-xl w-full focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-white text-gray-700 text-sm font-medium"
                            value={filterFacultyId}
                            onChange={handleFacultyFilterChange}
                        >
                            <option value="">All Faculties</option>
                            {faculties.map(f => (
                                <option key={f._id} value={f._id}>{f.name}</option>
                            ))}
                        </select>
                    </div>
                    {/* Name Filter */}
                    <div className="relative w-full sm:w-56">
                        <input
                            type="text"
                            placeholder="Filter by Name..."
                            className="px-4 py-2.5 border border-gray-200 rounded-xl w-full focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                            value={filterName}
                            onChange={handleFilterNameChange}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <>
                    <DataTable
                        columns={columns}
                        data={currentItems}
                        onRowClick={openDetailModal}
                    />

                    {filteredStudents.length > itemsPerPage && (
                        <div className="mt-6 flex justify-end">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(filteredStudents.length / itemsPerPage)}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Allowed Languages Modal */}
            <Modal
                isOpen={isLangModalOpen}
                onClose={() => setIsLangModalOpen(false)}
                title="Allowed Languages"
            >
                <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar p-1">
                    {selectedAllowedLanguages.length === 0 ? (
                        <p className="text-gray-500 italic text-center py-4">No languages allowed yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {selectedAllowedLanguages.map((lang, idx) => (
                                <div
                                    key={lang._id || idx}
                                    className="flex items-center gap-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                        {idx + 1}
                                    </div>
                                    <span className="font-semibold text-gray-800">{lang.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Student Detail Modal */}
            {isDetailModalOpen && detailStudent && (
                <StudentDetailModal
                    student={detailStudent}
                    onClose={() => {
                        setIsDetailModalOpen(false);
                        setDetailStudent(null);
                    }}
                />
            )}
        </div>
    );
};

export default CompletedStudents;
