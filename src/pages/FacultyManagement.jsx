import { useState, useEffect } from 'react';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { Plus } from 'lucide-react';
import { toast } from 'react-toastify';

const FacultyManagement = () => {
    const [faculties, setFaculties] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentFaculty, setCurrentFaculty] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchFaculties = async () => {
        try {
            const { data } = await api.get('/faculty');
            setFaculties(data);
        } catch (error) {
            console.error('Error fetching faculties:', error);
        }
    };

    useEffect(() => {
        fetchFaculties();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openModal = (faculty = null) => {
        if (faculty) {
            setCurrentFaculty(faculty);
            setFormData({
                name: faculty.name || '',
                username: faculty.username || '',
                email: faculty.email || '',
                password: '' // Blank on edit
            });
        } else {
            setCurrentFaculty(null);
            setFormData({ name: '', username: '', email: '', password: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentFaculty(null);
        setFormData({ name: '', username: '', email: '', password: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (currentFaculty) {
                const dataToSend = { ...formData };
                if (!dataToSend.password) delete dataToSend.password;

                await api.put(`/faculty/${currentFaculty._id}`, dataToSend);
                toast.success('Faculty updated successfully');
            } else {
                await api.post('/faculty', formData);
                toast.success('Faculty added successfully');
            }
            fetchFaculties();
            closeModal();
        } catch (error) {
            console.error('Error saving faculty:', error);
            toast.error(error.response?.data?.message || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (faculty) => {
        if (window.confirm(`Are you sure you want to disable ${faculty.name}? They will not be able to login, but all their created courses, languages, topics, and student data will remain intact.`)) {
            try {
                await api.delete(`/faculty/${faculty._id}`);
                toast.success('Faculty disabled successfully');
                fetchFaculties();
            } catch (error) {
                console.error('Error deleting faculty:', error);
                toast.error(error.response?.data?.message || 'Error deleting faculty');
            }
        }
    };

    const columns = [
        { header: 'Name', accessor: 'name' },
        { header: 'Username', accessor: 'username' },
        { header: 'Email', accessor: 'email' },
    ];

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = faculties.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Faculty Management</h1>
                    <p className="text-gray-500 mt-1">Manage instructor accounts and access permissions.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="w-full md:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 whitespace-nowrap"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Faculty
                </button>
            </div>

            <DataTable
                columns={columns}
                data={currentItems}
                onEdit={openModal}
                onDelete={handleDelete}
            />

            <Pagination
                totalItems={faculties.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={currentFaculty ? 'Edit Faculty' : 'Add New Faculty'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            name="username"
                            required
                            className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            value={formData.username}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            required
                            className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Password {currentFaculty && <span className="text-gray-400 text-xs font-normal">(Leave blank to keep current)</span>}
                        </label>
                        <input
                            type="password"
                            name="password"
                            required={!currentFaculty}
                            className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="flex justify-end space-x-3 pt-6">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:bg-indigo-400 transition-colors shadow-lg shadow-indigo-100 active:scale-95"
                        >
                            {loading ? 'Saving...' : (currentFaculty ? 'Update Faculty' : 'Save Faculty')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default FacultyManagement;

