import { useState, useEffect } from 'react';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { Plus, Trash2 } from 'lucide-react';

const FacultyManagement = () => {
    const [faculties, setFaculties] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/faculty', formData);
            fetchFaculties();
            setIsModalOpen(false);
            setFormData({ name: '', username: '', email: '', password: '' });
        } catch (error) {
            console.error('Error adding faculty:', error);
            alert(error.response?.data?.message || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (faculty) => {
        if (window.confirm('Are you sure you want to delete this faculty?')) {
            try {
                await api.delete(`/faculty/${faculty._id}`);
                fetchFaculties();
            } catch (error) {
                console.error('Error deleting faculty:', error);
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
                    onClick={() => setIsModalOpen(true)}
                    className="w-full md:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 whitespace-nowrap"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Faculty
                </button>
            </div>

            <DataTable
                columns={columns}
                data={currentItems}
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
                onClose={() => setIsModalOpen(false)}
                title="Add New Faculty"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input type="text" name="name" required className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" value={formData.name} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input type="text" name="username" required className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" value={formData.username} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" required className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" value={formData.email} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" name="password" required className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" value={formData.password} onChange={handleChange} />
                    </div>
                    <div className="flex justify-end space-x-3 pt-6">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                        <button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:bg-indigo-400 transition-colors shadow-lg shadow-indigo-100 active:scale-95">
                            {loading ? 'Saving...' : 'Save Faculty'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default FacultyManagement;

