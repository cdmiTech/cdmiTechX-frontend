import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { Plus, X, GripVertical, Edit, Trash2 } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableTopicRow = ({ topic, idx, onEdit, onDelete, isSortingEnabled }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: topic._id, disabled: !isSortingEnabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
        position: 'relative'
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            {...(isSortingEnabled ? { ...attributes, ...listeners } : {})}
            className={`hover:bg-indigo-50/30 transition-colors group ${isDragging ? 'bg-indigo-50 shadow-md ring-1 ring-indigo-200' : ''} ${isSortingEnabled ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >
            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{topic.name}</span>
                </div>
            </td>
            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {topic.languageId?.name || '-'}
            </td>
            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(topic); }}
                        className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded-md transition-all relative z-10"
                        title="Edit"
                    >
                        <Edit className="w-4 h-4" />
                        <span className="sr-only">Edit</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(topic); }}
                        className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-100 rounded-md transition-all relative z-10"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Delete</span>
                    </button>
                </div>
            </td>
        </tr>
    );
};

const Topics = () => {
    const [topics, setTopics] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTopic, setCurrentTopic] = useState(null);
    const [formData, setFormData] = useState({ name: '', languageId: '' });
    const [loading, setLoading] = useState(false);
    const [filterLanguage, setFilterLanguage] = useState('');
    const [lastSelectedLanguage, setLastSelectedLanguage] = useState('');
    const [topicQuery, setTopicQuery] = useState('');

    // Inline Multiple Add State
    const [isAddingMultiple, setIsAddingMultiple] = useState(false);
    const [newTopics, setNewTopics] = useState([{ name: '', languageId: '' }]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 100; // Increased to allow easier sorting across many topics

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchData = async () => {
        try {
            const [topicsRes, languagesRes] = await Promise.all([
                api.get('/topics'),
                api.get('/languages')
            ]);
            setTopics(topicsRes.data);
            setLanguages(languagesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (currentTopic) {
                await api.put(`/topics/${currentTopic._id}`, formData);
            } else {
                await api.post('/topics', formData);
            }
            fetchData();
            toast.success(currentTopic ? 'Topic updated successfully!' : 'Topic added successfully!');
            closeModal();
        } catch (error) {
            console.error('Error saving topic:', error);
            toast.error(error.response?.data?.message || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkSubmit = async () => {
        setLoading(true);
        try {
            const validTopics = newTopics.filter(t => t.name.trim() !== '' && t.languageId !== '');
            if (validTopics.length === 0) {
                toast.warning('Please enter at least one topic name and select a language for each.');
                setLoading(false);
                return;
            }

            await Promise.all(
                validTopics.map(t => api.post('/topics', { name: t.name.trim(), languageId: t.languageId }))
            );

            fetchData();
            // setLastSelectedLanguage(''); <- removed
            setNewTopics([{ name: '', languageId: lastSelectedLanguage }]);
            toast.success('Topics added successfully!');
        } catch (error) {
            console.error('Error saving topics:', error);
            toast.error(error.response?.data?.message || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    const removeNewTopicRow = (index) => {
        const updated = [...newTopics];
        updated.splice(index, 1);
        setNewTopics(updated);
        if (updated.length === 0) {
            setIsAddingMultiple(false);
            setLastSelectedLanguage('');
            setNewTopics([{ name: '', languageId: '' }]);
        }
    };

    const handleDelete = async (topic) => {
        if (window.confirm('Are you sure you want to delete this topic?')) {
            try {
                await api.delete(`/topics/${topic._id}`);
                fetchData();
                toast.success('Topic deleted successfully!');
            } catch (error) {
                console.error('Error deleting topic:', error);
                toast.error(error.response?.data?.message || 'Error deleting topic');
            }
        }
    };

    const openModal = (topic = null) => {
        if (topic) {
            setCurrentTopic(topic);
            setFormData({
                name: topic.name,
                languageId: topic.languageId?._id || topic.languageId
            });
        } else {
            setCurrentTopic(null);
            setFormData({ name: '', languageId: lastSelectedLanguage });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentTopic(null);
        setFormData({ name: '', languageId: '' });
    };

    const filteredTopics = topics.filter(topic => {
        const matchesLanguage = filterLanguage ? (topic.languageId?._id || topic.languageId) === filterLanguage : true;
        const matchesName = topic.name.toLowerCase().includes(topicQuery.toLowerCase());
        return matchesLanguage && matchesName;
    });

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTopics.slice(indexOfFirstItem, indexOfLastItem);

    const handleSearchChange = (e) => {
        setTopicQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleLanguageFilterChange = (e) => {
        setFilterLanguage(e.target.value);
        setCurrentPage(1);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = filteredTopics.findIndex((i) => i._id === active.id);
            const newIndex = filteredTopics.findIndex((i) => i._id === over.id);

            const reorderedTopics = arrayMove(filteredTopics, oldIndex, newIndex);

            // Update local state by mapping through main topics array
            const updatedTopics = topics.map(t => {
                const isFiltered = (t.languageId?._id || t.languageId) === filterLanguage;
                if (isFiltered) {
                    const idx = reorderedTopics.findIndex(rt => rt._id === t._id);
                    if (idx !== -1) {
                        return reorderedTopics[idx];
                    }
                }
                return t;
            });

            // Rebuild topics array to preserve order for the specific language
            const otherLanguageTopics = topics.filter(t => (t.languageId?._id || t.languageId) !== filterLanguage);
            setTopics([...otherLanguageTopics, ...reorderedTopics].sort((a, b) => {
                if ((a.languageId?._id || a.languageId) === filterLanguage && (b.languageId?._id || b.languageId) === filterLanguage) {
                    return reorderedTopics.indexOf(a) - reorderedTopics.indexOf(b);
                }
                return 0; // Keep others as is
            }));

            // Persist to DB
            const orderedIds = reorderedTopics.map((item, index) => ({
                _id: item._id,
                order: index
            }));

            try {
                await api.patch('/topics/reorder', { topics: orderedIds });
                toast.success('Order updated successfully');
            } catch (err) {
                console.error('Failed to update order:', err);
                toast.error('Failed to save new order');
                fetchData();
            }
        }
    };

    const columns = [
        { header: 'Topic Name', accessor: 'name' },
        { header: 'Language', render: (row) => row.languageId?.name || '-' }
    ];

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Topic Management</h1>
                    <p className="text-gray-500 mt-1">Organize questions into logical learning units.</p>
                </div>
                <button
                    onClick={() => {
                        if (!isAddingMultiple) {
                            setIsAddingMultiple(true);
                            if (newTopics.length === 0) {
                                setNewTopics([{ name: '', languageId: lastSelectedLanguage }]);
                            }
                        }
                    }}
                    className="w-full md:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 whitespace-nowrap"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Topic
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search topics..."
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                        value={topicQuery}
                        onChange={handleSearchChange}
                    />
                </div>
                <div className="relative w-full sm:w-64">
                    <select
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm appearance-none cursor-pointer"
                        value={filterLanguage}
                        onChange={handleLanguageFilterChange}
                    >
                        <option value="">All Languages</option>
                        {languages.map(lang => (
                            <option key={lang._id} value={lang._id}>{lang.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {isAddingMultiple && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Topics</h3>
                    <div className="space-y-4">
                        {newTopics.map((topic, index) => (
                            <div key={index} className="flex flex-col sm:flex-row items-center gap-3">
                                <select
                                    required
                                    className="w-full sm:w-1/3 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm appearance-none cursor-pointer"
                                    value={topic.languageId}
                                    onChange={(e) => {
                                        const updated = [...newTopics];
                                        updated[index].languageId = e.target.value;
                                        setNewTopics(updated);
                                        setLastSelectedLanguage(e.target.value);
                                    }}
                                >
                                    <option value="">Select Language</option>
                                    {languages.map(lang => (
                                        <option key={lang._id} value={lang._id}>{lang.name}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Enter topic name..."
                                    className="flex-1 w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    value={topic.name}
                                    onChange={(e) => {
                                        const updated = [...newTopics];
                                        updated[index].name = e.target.value;
                                        setNewTopics(updated);
                                    }}
                                    autoFocus={index === newTopics.length - 1}
                                />
                                <button
                                    onClick={() => removeNewTopicRow(index)}
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
                                setLastSelectedLanguage('');
                                setNewTopics([{ name: '', languageId: '' }]);
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
                                'Submit Topics'
                            )}
                        </button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-100 custom-scrollbar">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-4 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">Topic Name</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">Language</th>
                                <th className="px-4 sm:px-6 py-4 text-right text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <SortableContext
                            items={filteredTopics.map(t => t._id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-4 sm:px-6 py-8 text-center text-gray-400 italic">No data available</td>
                                    </tr>
                                ) : (
                                    currentItems.map((topic, idx) => (
                                        <SortableTopicRow
                                            key={topic._id}
                                            topic={topic}
                                            idx={idx}
                                            onEdit={openModal}
                                            onDelete={handleDelete}
                                            isSortingEnabled={!!filterLanguage && !topicQuery}
                                        />
                                    ))
                                )}
                            </tbody>
                        </SortableContext>
                    </table>
                </DndContext>
            </div>

            <Pagination
                totalItems={filteredTopics.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={currentTopic ? 'Edit Topic' : 'Add Topic'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Language</label>
                        <select
                            name="languageId"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            value={formData.languageId}
                            onChange={(e) => {
                                setFormData({ ...formData, languageId: e.target.value });
                                setLastSelectedLanguage(e.target.value);
                            }}
                        >
                            <option value="">Select Language</option>
                            {languages.map(lang => (
                                <option key={lang._id} value={lang._id}>{lang.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Topic Name</label>
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

export default Topics;

