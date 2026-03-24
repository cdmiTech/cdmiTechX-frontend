import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { Plus, X } from 'lucide-react';

const Languages = () => {
    const [languages, setLanguages] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState(null);
    const [formData, setFormData] = useState({ name: '' });
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Inline Multiple Add State
    const [isAddingMultiple, setIsAddingMultiple] = useState(false);
    const [newLanguages, setNewLanguages] = useState([{ name: '' }]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchLanguages = async () => {
        try {
            const { data } = await api.get('/languages');
            setLanguages(data);
        } catch (error) {
            console.error('Error fetching languages:', error);
        }
    };

    useEffect(() => {
        fetchLanguages();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (currentLanguage) {
                await api.put(`/languages/${currentLanguage._id}`, formData);
            } else {
                await api.post('/languages', formData);
            }
            fetchLanguages();
            toast.success(currentLanguage ? 'Language updated successfully!' : 'Language added successfully!');
            closeModal();
        } catch (error) {
            console.error('Error saving language:', error);
            toast.error(error.response?.data?.message || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkSubmit = async () => {
        setLoading(true);
        try {
            const validLanguages = newLanguages.filter(lang => lang.name.trim() !== '');
            if (validLanguages.length === 0) {
                toast.warning('Please enter at least one language name');
                setLoading(false);
                return;
            }

            await Promise.all(
                validLanguages.map(lang => api.post('/languages', { name: lang.name.trim() }))
            );

            fetchLanguages();
            setNewLanguages([{ name: '' }]);
            toast.success('Languages added successfully!');
        } catch (error) {
            console.error('Error saving languages:', error);
            toast.error(error.response?.data?.message || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    const removeNewLanguageRow = (index) => {
        const updated = [...newLanguages];
        updated.splice(index, 1);
        setNewLanguages(updated);
        if (updated.length === 0) {
            setIsAddingMultiple(false);
            setNewLanguages([{ name: '' }]);
        }
    };

    const handleDelete = async (language) => {
        if (window.confirm('Are you sure you want to delete this language?')) {
            try {
                await api.delete(`/languages/${language._id}`);
                fetchLanguages();
                toast.success('Language deleted successfully!');
            } catch (error) {
                console.error('Error deleting language:', error);
                toast.error(error.response?.data?.message || 'Error deleting language');
            }
        }
    };

    const openModal = (language = null) => {
        if (language) {
            setCurrentLanguage(language);
            setFormData({ name: language.name });
        } else {
            setCurrentLanguage(null);
            setFormData({ name: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentLanguage(null);
        setFormData({ name: '' });
    };

    const columns = [
        { header: 'Language Name', accessor: 'name' },
        { header: 'Created At', render: (row) => new Date(row.createdAt).toLocaleDateString() }
    ];

    const filteredLanguages = languages.filter(lang =>
        lang.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredLanguages.slice(indexOfFirstItem, indexOfLastItem);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Language Management</h1>
                    <p className="text-gray-500 mt-1">Configure supported languages for your worksheets.</p>
                </div>
                <button
                    onClick={() => {
                        if (!isAddingMultiple) {
                            setIsAddingMultiple(true);
                            if (newLanguages.length === 0) {
                                setNewLanguages([{ name: '' }]);
                            }
                        }
                    }}
                    className="w-full md:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 whitespace-nowrap"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Language
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Filter by language name..."
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>

            {isAddingMultiple && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Languages</h3>
                    <div className="space-y-4">
                        {newLanguages.map((lang, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <input
                                    type="text"
                                    placeholder="Enter language name..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    value={lang.name}
                                    onChange={(e) => {
                                        const updated = [...newLanguages];
                                        updated[index].name = e.target.value;
                                        setNewLanguages(updated);
                                    }}
                                    autoFocus={index === newLanguages.length - 1}
                                />
                                <button
                                    onClick={() => removeNewLanguageRow(index)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                    title="Remove row"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                        <button
                            onClick={() => {
                                setIsAddingMultiple(false);
                                setNewLanguages([{ name: '' }]);
                            }}
                            className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleBulkSubmit}
                            disabled={loading}
                            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-70 flex items-center"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                'Submit Languages'
                            )}
                        </button>
                    </div>
                </div>
            )}

            <DataTable
                columns={columns}
                data={currentItems}
                onEdit={openModal}
                onDelete={handleDelete}
            />

            <Pagination
                totalItems={filteredLanguages.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={currentLanguage ? 'Edit Language' : 'Add Language'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Language Name</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
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
        </div>
    );
};

export default Languages;

