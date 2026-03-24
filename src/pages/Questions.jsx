import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { Plus, X, Upload, GripVertical, Edit, Trash2 } from 'lucide-react';
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

const SortableRow = ({ row, columns, onEdit, onDelete, actionLabel }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: row._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : 0,
        position: 'relative'
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={`hover:bg-indigo-50/30 transition-colors group ${isDragging ? 'bg-indigo-100 shadow-lg' : ''}`}
        >
            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-400 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
                <GripVertical className="w-4 h-4" />
            </td>
            {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {col.render ? col.render(row) : row[col.accessor]}
                </td>
            ))}
            {(onEdit || onDelete) && (
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                        {onEdit && (
                            <button
                                onClick={() => onEdit(row)}
                                className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded-md transition-all"
                                title="Edit"
                            >
                                <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => onDelete(row)}
                                className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-100 rounded-md transition-all"
                                title="Delete"
                            >
                                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        )}
                    </div>
                </td>
            )}
        </tr>
    );
};

const Questions = () => {
    const [questions, setQuestions] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [topics, setTopics] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [formData, setFormData] = useState({
        question: '',
        languageId: '',
        topicId: '',
        image: null
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [fullScreenImage, setFullScreenImage] = useState(null); // Full screen preview state
    const [loading, setLoading] = useState(false);
    const [filterLanguage, setFilterLanguage] = useState('');
    const [filterTopic, setFilterTopic] = useState('');

    // Inline Add State
    const [isAdding, setIsAdding] = useState(false);
    const [lastSelectedLanguage, setLastSelectedLanguage] = useState('');
    const [lastSelectedTopic, setLastSelectedTopic] = useState('');
    const [newQuestion, setNewQuestion] = useState({
        question: '',
        languageId: '',
        topicId: '',
        image: null
    });
    const [newQuestionImagePreview, setNewQuestionImagePreview] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setQuestions((items) => {
                const oldIndex = items.findIndex((i) => i._id === active.id);
                const newIndex = items.findIndex((i) => i._id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update order in background
                const orderedIds = newItems.map((item, index) => ({
                    _id: item._id,
                    order: index
                }));

                api.patch('/questions/reorder', { questions: orderedIds }).catch(err => {
                    console.error('Failed to update order:', err);
                    toast.error('Failed to update question order');
                    fetchData(); // Restore if fails
                });

                return newItems;
            });
        }
    };

    const fetchData = async () => {
        try {
            const [questionsRes, languagesRes, topicsRes] = await Promise.all([
                api.get('/questions'),
                api.get('/languages'),
                api.get('/topics')
            ]);
            setQuestions(questionsRes.data);
            setLanguages(languagesRes.data);
            setTopics(topicsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Derived state for available topics in form based on selected language
    const formTopics = topics.filter(t => {
        const tLangId = t.languageId?._id || t.languageId;
        return tLangId === formData.languageId;
    });

    const newFormTopics = topics.filter(t => {
        const tLangId = t.languageId?._id || t.languageId;
        return tLangId === newQuestion.languageId;
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.question && !formData.image && (!currentQuestion || !currentQuestion.imageUrl)) {
            toast.warning('Please provide either question text or an image.');
            return;
        }

        setLoading(true);

        const data = new FormData();
        data.append('question', formData.question);
        data.append('languageId', formData.languageId);
        data.append('topicId', formData.topicId);
        if (formData.image) {
            data.append('image', formData.image);
        }

        try {
            if (currentQuestion) {
                await api.put(`/questions/${currentQuestion._id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/questions', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            fetchData();
            toast.success(currentQuestion ? 'Question updated successfully!' : 'Question added successfully!');
            closeModal();
        } catch (error) {
            console.error('Error saving question:', error);
            toast.error(error.response?.data?.message || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleInlineSubmit = async () => {
        if (!newQuestion.question && !newQuestion.image) {
            toast.warning('Please provide either question text or an image.');
            return;
        }
        if (!newQuestion.languageId || !newQuestion.topicId) {
            toast.warning('Please select a language and topic.');
            return;
        }

        setLoading(true);

        const data = new FormData();
        data.append('question', newQuestion.question);
        data.append('languageId', newQuestion.languageId);
        data.append('topicId', newQuestion.topicId);
        if (newQuestion.image) {
            data.append('image', newQuestion.image);
        }

        try {
            await api.post('/questions', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            fetchData();
            toast.success('Question added successfully!');

            // Retain language/topic, clear question/image
            setNewQuestion({
                ...newQuestion,
                question: '',
                image: null
            });
            setNewQuestionImagePreview(null);

        } catch (error) {
            console.error('Error saving question:', error);
            toast.error(error.response?.data?.message || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (question) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            try {
                await api.delete(`/questions/${question._id}`);
                fetchData();
                toast.success('Question deleted successfully!');
            } catch (error) {
                console.error('Error deleting question:', error);
                toast.error(error.response?.data?.message || 'Error deleting question');
            }
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.warning('File size exceeds 5MB limit.');
                return;
            }
            setFormData({ ...formData, image: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleInlineFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.warning('File size exceeds 5MB limit.');
                return;
            }
            setNewQuestion({ ...newQuestion, image: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewQuestionImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const openModal = (question = null) => {
        if (question) {
            const langId = question.languageId?._id || question.languageId;
            setCurrentQuestion(question);
            setFormData({
                question: question.question || '',
                languageId: langId,
                topicId: question.topicId?._id || question.topicId,
                image: null
            });
            setImagePreview(question.imageUrl);
        } else {
            setCurrentQuestion(null);
            setFormData({ question: '', languageId: '', topicId: '', image: null });
            setImagePreview(null);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentQuestion(null);
        setFormData({ question: '', languageId: '', topicId: '', image: null });
        setImagePreview(null);
    };

    const filteredQuestions = questions.filter(q => {
        const qLangId = q.languageId?._id || q.languageId;
        const qTopicId = q.topicId?._id || q.topicId;
        const matchesLanguage = filterLanguage ? qLangId === filterLanguage : true;
        const matchesTopic = filterTopic ? qTopicId === filterTopic : true;
        return matchesLanguage && matchesTopic;
    });

    // Filter topics for the filter dropdown
    const filterTopics = filterLanguage
        ? topics.filter(t => (t.languageId?._id || t.languageId) === filterLanguage)
        : [];

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredQuestions.slice(indexOfFirstItem, indexOfLastItem);

    const handleLanguageFilterChange = (e) => {
        setFilterLanguage(e.target.value);
        setFilterTopic(''); // Reset topic filter on language change
        setCurrentPage(1);
    };

    const handleTopicFilterChange = (e) => {
        setFilterTopic(e.target.value);
        setCurrentPage(1);
    };

    const columns = [
        {
            header: 'Question',
            render: (row) => (
                <div className="flex flex-col gap-1">
                    {row.question && <p className="line-clamp-2">{row.question}</p>}
                    {row.imageUrl && (
                        <img
                            src={row.imageUrl}
                            alt="Question"
                            className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setFullScreenImage(row.imageUrl)}
                        />
                    )}
                </div>
            )
        },
        { header: 'Language', render: (row) => row.languageId?.name || '-' },
        { header: 'Topic', render: (row) => row.topicId?.name || '-' }
    ];

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Question Management</h1>
                    <p className="text-gray-500 mt-1">Create and manage your question bank.</p>
                </div>
                <button
                    onClick={() => {
                        if (!isAdding) {
                            setIsAdding(true);
                            if (!newQuestion.languageId) {
                                setNewQuestion({ ...newQuestion, languageId: lastSelectedLanguage, topicId: lastSelectedTopic });
                            }
                        }
                    }}
                    className="w-full md:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 whitespace-nowrap"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Question
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
                <div className="relative w-full sm:w-64">
                    <select
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm appearance-none cursor-pointer disabled:bg-gray-50 disabled:text-gray-400"
                        value={filterTopic}
                        onChange={handleTopicFilterChange}
                        disabled={!filterLanguage}
                    >
                        <option value="">All Topics</option>
                        {filterTopics.map(topic => (
                            <option key={topic._id} value={topic._id}>{topic.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Question</h3>
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="w-full sm:w-1/2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm appearance-none cursor-pointer"
                                    value={newQuestion.languageId}
                                    onChange={(e) => {
                                        setNewQuestion({ ...newQuestion, languageId: e.target.value, topicId: '' });
                                        setLastSelectedLanguage(e.target.value);
                                        setLastSelectedTopic('');
                                    }}
                                >
                                    <option value="">Select Language</option>
                                    {languages.map(lang => (
                                        <option key={lang._id} value={lang._id}>{lang.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-full sm:w-1/2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                                <select
                                    required
                                    disabled={!newQuestion.languageId}
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm appearance-none cursor-pointer disabled:bg-gray-50 disabled:text-gray-400"
                                    value={newQuestion.topicId}
                                    onChange={(e) => {
                                        setNewQuestion({ ...newQuestion, topicId: e.target.value });
                                        setLastSelectedTopic(e.target.value);
                                    }}
                                >
                                    <option value="">Select Topic</option>
                                    {newFormTopics.map(topic => (
                                        <option key={topic._id} value={topic._id}>{topic.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                            <textarea
                                rows="3"
                                placeholder="Type question text here..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-y"
                                value={newQuestion.question}
                                onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question Image (Optional)</label>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="inlineUpload"
                                        accept="image/png, image/jpeg, image/jpg"
                                        onChange={handleInlineFileChange}
                                        className="sr-only"
                                    />
                                    <label
                                        htmlFor="inlineUpload"
                                        className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm gap-2"
                                    >
                                        <Upload className="w-4 h-4 text-gray-500" />
                                        <span>Choose Image</span>
                                    </label>
                                </div>
                                {newQuestionImagePreview && (
                                    <div className="relative inline-block group">
                                        <img
                                            src={newQuestionImagePreview}
                                            alt="Preview"
                                            className="h-12 w-12 object-cover rounded-md border shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => setFullScreenImage(newQuestionImagePreview)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewQuestion({ ...newQuestion, image: null });
                                                setNewQuestionImagePreview(null);
                                            }}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                                            title="Remove image"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                {!newQuestionImagePreview && (
                                    <span className="text-sm text-gray-500">No image chosen (Max 5MB)</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                        <button
                            onClick={() => {
                                setIsAdding(false);
                                setLastSelectedLanguage('');
                                setLastSelectedTopic('');
                                setNewQuestion({ question: '', languageId: '', topicId: '', image: null });
                                setNewQuestionImagePreview(null);
                            }}
                            className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleInlineSubmit}
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
                                'Submit Question'
                            )}
                        </button>
                    </div>
                </div>
            )}

            {filterTopic ? (
                <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-100 custom-scrollbar">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-4 sm:px-6 py-4 w-10"></th>
                                {columns.map((col, index) => (
                                    <th key={index} className="px-4 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        {col.header}
                                    </th>
                                ))}
                                <th className="px-4 sm:px-6 py-4 text-right text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={currentItems.map(i => i._id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentItems.map((row) => (
                                        <SortableRow
                                            key={row._id}
                                            row={row}
                                            columns={columns}
                                            onEdit={openModal}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                    {currentItems.length === 0 && (
                                        <tr>
                                            <td colSpan={columns.length + 2} className="px-4 sm:px-6 py-8 text-center text-gray-400 italic">
                                                No data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </SortableContext>
                        </DndContext>
                    </table>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={currentItems}
                    onEdit={openModal}
                    onDelete={handleDelete}
                />
            )}

            <Pagination
                totalItems={filteredQuestions.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={currentQuestion ? 'Edit Question' : 'Add Question'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Language</label>
                        <select
                            name="languageId"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            value={formData.languageId}
                            onChange={(e) => setFormData({
                                ...formData,
                                languageId: e.target.value,
                                topicId: '' // Reset topic on language change
                            })}
                        >
                            <option value="">Select Language</option>
                            {languages.map(lang => (
                                <option key={lang._id} value={lang._id}>{lang.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Topic</label>
                        <select
                            name="topicId"
                            required
                            disabled={!formData.languageId}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                            value={formData.topicId}
                            onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
                        >
                            <option value="">Select Topic</option>
                            {formTopics.map(topic => (
                                <option key={topic._id} value={topic._id}>{topic.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Question Text</label>
                        <textarea
                            rows="3"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            value={formData.question}
                            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                            placeholder="Type question text here..."
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Question Image</label>
                        <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={handleFileChange}
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        {imagePreview && (
                            <div className="mt-2 relative">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="max-h-40 rounded border"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData({ ...formData, image: null });
                                        setImagePreview(currentQuestion?.imageUrl || null);
                                    }}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Allowed: JPG, JPEG, PNG (Max 5MB). Either text or image is required.</p>
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

            {/* Full Screen Image Preview Modal */}
            {fullScreenImage && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200"
                    onClick={() => setFullScreenImage(null)}
                >
                    <div className="relative max-w-4xl w-full flex items-center justify-center">
                        <button
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors bg-white/10 rounded-full p-2"
                            onClick={() => setFullScreenImage(null)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <img
                            src={fullScreenImage}
                            alt="Full screen preview"
                            className="max-h-[85vh] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Questions;

