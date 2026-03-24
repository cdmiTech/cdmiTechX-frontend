import { useState, useEffect } from 'react';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { Plus, Eye, CheckCircle, List } from 'lucide-react';
import StudentDetailModal from '../components/StudentDetailModal';
import { toast } from 'react-toastify';

// Helper: get the logged-in user's data from localStorage
const getLoggedInUser = () => {
    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
};

const Students = () => {
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStudent, setCurrentStudent] = useState(null);
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

    const initialFormState = {
        name: '',
        email: '',
        password: '',
        batchTime: '',
        contact: '',
        courseId: '',
        allowedLanguageIds: []
        // facultyId is NOT in initialFormState intentionally (only shown in edit modal)
    };

    const [formData, setFormData] = useState(initialFormState);

    const fetchStudents = async (facultyId) => {
        try {
            const params = facultyId ? `?facultyId=${facultyId}` : '';
            const { data } = await api.get(`/students${params}`);
            setStudents(data);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchData = async () => {
        // Set default faculty filter to logged-in user
        const loggedInUser = getLoggedInUser();
        const defaultFacultyId = loggedInUser?._id || '';
        setFilterFacultyId(defaultFacultyId);
        fetchStudents(defaultFacultyId);

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
        fetchStudents(fid);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleLanguageToggle = (langId) => {
        const currentAllowed = formData.allowedLanguageIds || [];
        if (currentAllowed.includes(langId)) {
            setFormData({
                ...formData,
                allowedLanguageIds: currentAllowed.filter(id => id !== langId)
            });
        } else {
            setFormData({
                ...formData,
                allowedLanguageIds: [...currentAllowed, langId]
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (currentStudent) {
                // Don't send password if empty (backend handles this check)
                const dataToSend = { ...formData };
                if (!dataToSend.password) delete dataToSend.password;

                await api.put(`/students/${currentStudent._id}`, dataToSend);
            } else {
                await api.post('/students', formData);
            }
            fetchStudents(filterFacultyId);
            closeModal();
        } catch (error) {
            console.error('Error saving student:', error);
            alert(error.response?.data?.message || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (student) => {
        if (window.confirm('Are you sure you want to delete this student?')) {
            try {
                await api.delete(`/students/${student._id}`);
                fetchStudents(filterFacultyId);
            } catch (error) {
                console.error('Error deleting student:', error);
            }
        }
    };

    const openModal = (student = null) => {
        if (student) {
            setCurrentStudent(student);
            setFormData({
                name: student.name,
                email: student.email,
                password: '', // Look blank on edit
                batchTime: student.batchTime,
                contact: student.contact,
                courseId: student.courseId?._id || student.courseId,
                allowedLanguageIds: student.allowedLanguageIds.map(l => l._id || l),
                facultyId: student.facultyId?._id || student.facultyId || ''
            });
        } else {
            setCurrentStudent(null);
            setFormData(initialFormState);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentStudent(null);
        setFormData(initialFormState);
    };

    // Filter students by name (client-side, across all loaded students)
    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(filterName.toLowerCase())
    );

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

    const handleFilterNameChange = async (e) => {
        const name = e.target.value;
        setFilterName(name);
        setCurrentPage(1);
        // When searching by name, load ALL students so search spans all faculties
        if (name.trim()) {
            await fetchStudents(''); // empty = all students
        } else {
            // Restore current faculty filter when search is cleared
            await fetchStudents(filterFacultyId);
        }
    };

    const openDetailModal = (student) => {
        setDetailStudent(student);
        setIsDetailModalOpen(true);
    };

    const handleApprove = async (student) => {
        if (window.confirm('Are you sure you want to approve this student?')) {
            try {
                await api.put(`/students/${student._id}/approve`);
                toast.success('Student approved successfully');
                fetchStudents(filterFacultyId);
            } catch (error) {
                console.error('Error approving student:', error);
                toast.error(error.response?.data?.message || 'Error granting approval');
            }
        }
    };

    const columns = [
        { header: 'Name', accessor: 'name' },
        { header: 'Email', accessor: 'email' },
        {
            header: 'Status',
            render: (row) => (
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${row.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                    {row.status || 'Approved'}
                </span>
            )
        },
        { header: 'Batch Time', accessor: 'batchTime' },
        { header: 'Course', render: (row) => row.courseId?.name || '-' },
        {
            header: 'Allowed Languages',
            render: (row) => (
                <div className="flex justify-center items-center ">
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
                        title="View Student Details"
                        className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    {row.status === 'Pending' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleApprove(row); }}
                            title="Approve Student"
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors flex items-center"
                        >
                            <CheckCircle className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Student Management</h1>
                    <p className="text-gray-500 mt-1">Manage student accounts and access.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    {/* Faculty Filter */}
                    <div className="relative w-full sm:w-48">
                        <select
                            className="px-4 py-2.5 border border-gray-200 rounded-xl w-full focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-white text-gray-700"
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
                            className="px-4 py-2.5 border border-gray-200 rounded-xl w-full focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            value={filterName}
                            onChange={handleFilterNameChange}
                        />
                    </div>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={currentItems}
                onEdit={openModal}
                onDelete={handleDelete}
            />

            <Pagination
                totalItems={filteredStudents.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={currentStudent ? 'Edit Student' : 'Add Student'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Password {currentStudent && <span className="text-gray-400 text-xs">(Leave blank to keep current)</span>}
                        </label>
                        <input
                            type="password"
                            name="password"
                            required={!currentStudent}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Batch Time</label>
                            <select
                                name="batchTime"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.batchTime}
                                onChange={handleChange}
                            >
                                <option value="">Select Batch Time</option>
                                <option value="8 to 10">8 to 10</option>
                                <option value="10 to 12">10 to 12</option>
                                <option value="12 to 2">12 to 2</option>
                                <option value="2 to 4">2 to 4</option>
                                <option value="4 to 6">4 to 6</option>
                                <option value="6 to 8">6 to 8</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Contact</label>
                            <input
                                type="text"
                                name="contact"
                                pattern="\d{10}"
                                maxLength="10"
                                title="Please enter a valid 10-digit contact number."
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.contact}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Course</label>
                        <select
                            name="courseId"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            value={formData.courseId}
                            onChange={handleChange}
                        >
                            <option value="">Select Course</option>
                            {courses.map(course => (
                                <option key={course._id} value={course._id}>{course.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Access Control: Checkboxes for Languages */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Languages</label>
                        <div className="grid grid-cols-2 gap-2 border p-3 rounded-md max-h-40 overflow-y-auto">
                            {languages
                                .filter(lang => {
                                    if (!formData.courseId) return false;
                                    const selectedCourse = courses.find(c => c._id === formData.courseId);
                                    return selectedCourse?.allowedLanguageIds?.some(al => (al._id || al) === lang._id);
                                })
                                .map(lang => (
                                    <label key={lang._id} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={(formData.allowedLanguageIds || []).includes(lang._id)}
                                            onChange={() => handleLanguageToggle(lang._id)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <span className="text-sm text-gray-700">{lang.name}</span>
                                    </label>
                                ))}
                            {formData.courseId && languages.filter(lang =>
                                courses.find(c => c._id === formData.courseId)?.allowedLanguageIds?.some(al => (al._id || al) === lang._id)
                            ).length === 0 && (
                                    <p className="text-xs text-red-500 col-span-2">No languages linked to this course.</p>
                                )}
                            {!formData.courseId && (
                                <p className="text-xs text-gray-500 col-span-2">Select a course to see its languages.</p>
                            )}
                        </div>
                    </div>

                    {/* Faculty select — only shown in Edit mode (or if admin is assigning) */}
                    {(currentStudent || getLoggedInUser()?.role === 'admin') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Your Faculty</label>
                            <select
                                name="facultyId"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.facultyId || ''}
                                onChange={handleChange}
                            >
                                <option value="">Select Faculty</option>
                                {faculties.map(f => (
                                    <option key={f._id} value={f._id}>{f.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:bg-indigo-400"
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </Modal>

            {isDetailModalOpen && (
                <StudentDetailModal
                    student={detailStudent}
                    onClose={() => setIsDetailModalOpen(false)}
                />
            )}

            <Modal
                isOpen={isLangModalOpen}
                onClose={() => setIsLangModalOpen(false)}
                title="Allowed Languages"
            >
                {selectedAllowedLanguages?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {selectedAllowedLanguages.map(lang => (
                            <span
                                key={lang._id || lang}
                                className="inline-flex items-center px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium"
                            >
                                {lang?.name || lang}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No languages are assigned to this student.</p>
                )}
            </Modal>
        </div>
    );
};

export default Students;

