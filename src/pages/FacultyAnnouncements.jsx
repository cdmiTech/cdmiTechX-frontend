import { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
    Megaphone,
    Plus,
    Calendar,
    Link as LinkIcon,
    ExternalLink,
    Image as ImageIcon,
    Trash2,
    Edit2,
    Eye,
    Upload,
    Clock,
    CheckCircle2,
    AlertCircle,
    Search,
    X,
    Filter,
    ArrowUpRight,
    ChevronLeft,
    ChevronRight,
    Sparkles
} from 'lucide-react';

const FacultyAnnouncements = () => {
    const { user } = useContext(AuthContext);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, active, expired

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Selected item for preview/edit/delete
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Form states
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        link: '',
        linkButtonText: 'Learn More',
        endDate: '',
        isActive: true
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [filePreviews, setFilePreviews] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/announcements');
            setAnnouncements(data || []);
        } catch (error) {
            console.error('Failed to fetch announcements:', error);
            toast.error(error.response?.data?.message || 'Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newSelectedFiles = [...selectedFiles, ...files];
        setSelectedFiles(newSelectedFiles);

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setFilePreviews(prev => [...prev, ...newPreviews]);
    };

    const removeNewFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        URL.revokeObjectURL(filePreviews[index]);
        setFilePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (index) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const openCreateModal = () => {
        // Default end date to 7 days from now formatted for datetime-local
        const d = new Date();
        d.setDate(d.getDate() + 7);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        const defaultEndDate = d.toISOString().slice(0, 16);

        setFormData({
            title: '',
            description: '',
            link: '',
            linkButtonText: 'Learn More',
            endDate: defaultEndDate,
            isActive: true
        });
        setSelectedFiles([]);
        setFilePreviews([]);
        setExistingImages([]);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (announcement) => {
        setSelectedAnnouncement(announcement);
        const endD = new Date(announcement.endDate);
        endD.setMinutes(endD.getMinutes() - endD.getTimezoneOffset());
        const formattedEndDate = endD.toISOString().slice(0, 16);

        setFormData({
            title: announcement.title || '',
            description: announcement.description || '',
            link: announcement.link || '',
            linkButtonText: announcement.linkButtonText || 'Learn More',
            endDate: formattedEndDate,
            isActive: announcement.isActive !== undefined ? announcement.isActive : true
        });
        setExistingImages(announcement.images || []);
        setSelectedFiles([]);
        setFilePreviews([]);
        setIsEditModalOpen(true);
    };

    const openPreviewModal = (announcement) => {
        setSelectedAnnouncement(announcement);
        setSelectedImageIndex(0);
        setIsPreviewModalOpen(true);
    };

    const openDeleteModal = (announcement) => {
        setSelectedAnnouncement(announcement);
        setIsDeleteModalOpen(true);
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            return toast.error('Please enter a title');
        }
        if (!formData.endDate) {
            return toast.error('Please specify an end date');
        }

        try {
            setSubmitting(true);
            const submitData = new FormData();
            submitData.append('title', formData.title.trim());
            submitData.append('description', formData.description.trim());
            submitData.append('link', formData.link.trim());
            submitData.append('linkButtonText', formData.linkButtonText.trim() || 'Learn More');
            submitData.append('endDate', new Date(formData.endDate).toISOString());
            submitData.append('isActive', formData.isActive);

            selectedFiles.forEach((file) => {
                submitData.append('images', file);
            });

            const { data } = await api.post('/announcements', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Announcement published successfully!');
            setIsCreateModalOpen(false);
            fetchAnnouncements();
        } catch (error) {
            console.error('Error creating announcement:', error);
            toast.error(error.response?.data?.message || 'Failed to create announcement');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            return toast.error('Please enter a title');
        }
        if (!formData.endDate) {
            return toast.error('Please specify an end date');
        }

        try {
            setSubmitting(true);
            const submitData = new FormData();
            submitData.append('title', formData.title.trim());
            submitData.append('description', formData.description.trim());
            submitData.append('link', formData.link.trim());
            submitData.append('linkButtonText', formData.linkButtonText.trim() || 'Learn More');
            submitData.append('endDate', new Date(formData.endDate).toISOString());
            submitData.append('isActive', formData.isActive);
            submitData.append('existingImages', JSON.stringify(existingImages));

            selectedFiles.forEach((file) => {
                submitData.append('images', file);
            });

            await api.put(`/announcements/${selectedAnnouncement._id}`, submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Announcement updated successfully!');
            setIsEditModalOpen(false);
            fetchAnnouncements();
        } catch (error) {
            console.error('Error updating announcement:', error);
            toast.error(error.response?.data?.message || 'Failed to update announcement');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedAnnouncement) return;
        try {
            setSubmitting(true);
            await api.delete(`/announcements/${selectedAnnouncement._id}`);
            toast.success('Announcement deleted successfully');
            setIsDeleteModalOpen(false);
            fetchAnnouncements();
        } catch (error) {
            console.error('Error deleting announcement:', error);
            toast.error(error.response?.data?.message || 'Failed to delete announcement');
        } finally {
            setSubmitting(false);
        }
    };

    // Filter calculations
    const now = new Date();
    const isExpired = (endDate) => new Date(endDate) < now;

    const filteredAnnouncements = announcements.filter(item => {
        const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const expired = isExpired(item.endDate);
        if (filterStatus === 'active') return matchesSearch && !expired && item.isActive;
        if (filterStatus === 'expired') return matchesSearch && (expired || !item.isActive);
        return matchesSearch;
    });

    const activeCount = announcements.filter(a => !isExpired(a.endDate) && a.isActive).length;
    const expiredCount = announcements.filter(a => isExpired(a.endDate) || !a.isActive).length;

    return (
        <div className="space-y-8 animate-in fade-in duration-300 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-6 md:p-8 rounded-3xl text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-xs font-semibold text-indigo-200">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                        Announcement Center
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
                        <Megaphone className="w-8 h-8 text-indigo-300" />
                        Announcements Management
                    </h1>
                    <p className="text-indigo-200/80 text-sm max-w-xl">
                        Publish circulars, deadlines, links, and banners visible directly to all students on their announcement board.
                    </p>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-5 py-3 bg-white text-indigo-950 font-bold rounded-2xl shadow-lg hover:bg-indigo-50 hover:shadow-indigo-500/20 transition-all duration-200 active:scale-95"
                    >
                        <Plus className="w-5 h-5 text-indigo-600" />
                        <span>New Announcement</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                        <Megaphone className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500">Total Announcements</p>
                        <p className="text-2xl font-black text-gray-900">{announcements.length}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500">Active Notices</p>
                        <p className="text-2xl font-black text-emerald-600">{activeCount}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500">Expired / Inactive</p>
                        <p className="text-2xl font-black text-amber-600">{expiredCount}</p>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by title or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <div className="inline-flex p-1 bg-gray-100 rounded-xl text-xs font-semibold">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'all'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-800'
                                }`}
                        >
                            All ({announcements.length})
                        </button>
                        <button
                            onClick={() => setFilterStatus('active')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'active'
                                ? 'bg-white text-emerald-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-800'
                                }`}
                        >
                            Active ({activeCount})
                        </button>
                        <button
                            onClick={() => setFilterStatus('expired')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'expired'
                                ? 'bg-white text-amber-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-800'
                                }`}
                        >
                            Expired ({expiredCount})
                        </button>
                    </div>
                </div>
            </div>

            {/* Announcements List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-gray-100 text-gray-400 space-y-3">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium">Loading announcements...</p>
                </div>
            ) : filteredAnnouncements.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-gray-100 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-400">
                        <Megaphone className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-gray-800">No Announcements Found</h3>
                        <p className="text-sm text-gray-500 max-w-sm">
                            {searchTerm || filterStatus !== 'all'
                                ? 'No announcement matches your search or filter criteria.'
                                : 'Get started by creating your first announcement for students.'}
                        </p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition-all"
                    >
                        Create Announcement
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAnnouncements.map((item) => {
                        const expired = isExpired(item.endDate);
                        const hasImages = item.images && item.images.length > 0;
                        const coverImage = hasImages ? item.images[0]?.url : null;

                        return (
                            <div
                                key={item._id}
                                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col overflow-hidden group"
                            >
                                {/* Image / Banner section */}
                                {coverImage ? (
                                    <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                                        <img
                                            src={coverImage}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                                        {item.images.length > 1 && (
                                            <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-semibold rounded-lg flex items-center gap-1.5">
                                                <ImageIcon className="w-3.5 h-3.5" />
                                                +{item.images.length - 1} more
                                            </span>
                                        )}

                                        <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${expired || !item.isActive
                                            ? 'bg-rose-500/90 text-white'
                                            : 'bg-emerald-500/90 text-white'
                                            }`}>
                                            {expired ? 'Expired' : item.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="h-28 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-5 flex items-center justify-between border-b border-gray-100">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${expired || !item.isActive
                                            ? 'bg-rose-100 text-rose-700'
                                            : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                            {expired ? 'Expired' : item.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <Megaphone className="w-8 h-8 text-indigo-400/40" />
                                    </div>
                                )}

                                {/* Content section */}
                                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-gray-900 text-lg leading-snug line-clamp-2 hover:text-indigo-600 transition-colors">
                                            {item.title}
                                        </h3>
                                        {item.description && (
                                            <p className="text-gray-500 text-xs line-clamp-3 leading-relaxed">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action link if available */}
                                    {item.link && (
                                        <div className="pt-1">
                                            <a
                                                href={item.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold rounded-xl transition-colors"
                                            >
                                                <span>{item.linkButtonText || 'Learn More'}</span>
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    )}

                                    {/* Meta info & actions */}
                                    <div className="pt-3 border-t border-gray-100 space-y-3">
                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                <span>Ends: {new Date(item.endDate).toLocaleDateString()}</span>
                                            </div>
                                            <span className="font-medium text-gray-500">
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between pt-2">
                                            <button
                                                onClick={() => openPreviewModal(item)}
                                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                title="Preview announcement"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                                    title="Edit announcement"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(item)}
                                                    className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                    title="Delete announcement"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* CREATE ANNOUNCEMENT MODAL */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Announcement"
                maxWidth="max-w-2xl"
            >
                <form onSubmit={handleCreateSubmit} className="space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                            Announcement Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Annual Tech Symposium 2026 Registration"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                            Description / Circular Content
                        </label>
                        <textarea
                            rows={4}
                            placeholder="Provide full details, instructions, rules or schedule for students..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y"
                        />
                    </div>

                    {/* Images upload */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                            Notice Images / Posters (Optional, Multiple Allowed)
                        </label>

                        <div className="border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-2xl p-4 transition-colors bg-gray-50/50 flex flex-col items-center justify-center gap-2 cursor-pointer relative">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <Upload className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-semibold text-gray-700">Click or drag images to upload</p>
                            <p className="text-[11px] text-gray-400">PNG, JPG, WEBP, GIF up to 15MB each</p>
                        </div>

                        {/* Selected files preview */}
                        {filePreviews.length > 0 && (
                            <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {filePreviews.map((previewUrl, idx) => (
                                    <div key={idx} className="relative rounded-xl overflow-hidden border border-gray-200 group h-24 bg-gray-100">
                                        <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeNewFile(idx)}
                                            className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-lg transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Link & Button Text */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                External Link URL (Optional)
                            </label>
                            <div className="relative">
                                <LinkIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="url"
                                    placeholder="https://forms.gle/... or https://zoom.us/..."
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                Link Button Text
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Register Now, Join Webinar, View Document"
                                value={formData.linkButtonText}
                                onChange={(e) => setFormData({ ...formData, linkButtonText: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* End Date & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                Expiration / End Date <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>

                        <div className="flex items-center pt-6">
                            <label className="relative flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Publish Immediately (Active)
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Form actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            Publish Announcement
                        </button>
                    </div>
                </form>
            </Modal>

            {/* EDIT ANNOUNCEMENT MODAL */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Announcement"
                maxWidth="max-w-2xl"
            >
                <form onSubmit={handleEditSubmit} className="space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                            Announcement Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                            Description / Circular Content
                        </label>
                        <textarea
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y"
                        />
                    </div>

                    {/* Existing Images */}
                    {existingImages.length > 0 && (
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                Current Images
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {existingImages.map((img, idx) => (
                                    <div key={idx} className="relative rounded-xl overflow-hidden border border-gray-200 group h-24 bg-gray-100">
                                        <img src={img.url} alt="existing" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeExistingImage(idx)}
                                            className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-lg transition-colors"
                                            title="Delete image"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add More Images */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                            Upload Additional Images
                        </label>
                        <div className="border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-2xl p-4 transition-colors bg-gray-50/50 flex flex-col items-center justify-center gap-2 cursor-pointer relative">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <Upload className="w-5 h-5 text-indigo-600" />
                            <p className="text-xs font-semibold text-gray-700">Add more images</p>
                        </div>

                        {filePreviews.length > 0 && (
                            <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {filePreviews.map((previewUrl, idx) => (
                                    <div key={idx} className="relative rounded-xl overflow-hidden border border-gray-200 group h-24 bg-gray-100">
                                        <img src={previewUrl} alt="new-preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeNewFile(idx)}
                                            className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-lg transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Link & Button Text */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                External Link URL (Optional)
                            </label>
                            <input
                                type="url"
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                Link Button Text
                            </label>
                            <input
                                type="text"
                                value={formData.linkButtonText}
                                onChange={(e) => setFormData({ ...formData, linkButtonText: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* End Date & Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                Expiration / End Date <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>

                        <div className="flex items-center pt-6">
                            <label className="relative flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Active
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            Update Announcement
                        </button>
                    </div>
                </form>
            </Modal>

            {/* PREVIEW MODAL */}
            {selectedAnnouncement && (
                <Modal
                    isOpen={isPreviewModalOpen}
                    onClose={() => setIsPreviewModalOpen(false)}
                    title="Announcement Preview"
                    maxWidth="max-w-3xl"
                >
                    <div className="space-y-6">
                        {/* Status & Dates Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isExpired(selectedAnnouncement.endDate) || !selectedAnnouncement.isActive
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                {isExpired(selectedAnnouncement.endDate) ? 'Expired' : selectedAnnouncement.isActive ? 'Active' : 'Inactive'}
                            </span>

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-indigo-500" />
                                    Valid until: {new Date(selectedAnnouncement.endDate).toLocaleString()}
                                </span>
                                <span>Published: {new Date(selectedAnnouncement.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-black text-gray-900 leading-snug">
                            {selectedAnnouncement.title}
                        </h2>

                        {/* Images Gallery */}
                        {selectedAnnouncement.images && selectedAnnouncement.images.length > 0 && (
                            <div className="space-y-3">
                                <div className="relative rounded-2xl overflow-hidden bg-gray-900 h-72 sm:h-96 flex items-center justify-center">
                                    <img
                                        src={selectedAnnouncement.images[selectedImageIndex]?.url}
                                        alt={selectedAnnouncement.title}
                                        className="w-full h-full object-contain"
                                    />
                                    {selectedAnnouncement.images.length > 1 && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedImageIndex(prev => (prev === 0 ? selectedAnnouncement.images.length - 1 : prev - 1))}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedImageIndex(prev => (prev === selectedAnnouncement.images.length - 1 ? 0 : prev + 1))}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                            <span className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold rounded-lg">
                                                {selectedImageIndex + 1} / {selectedAnnouncement.images.length}
                                            </span>
                                        </>
                                    )}
                                </div>

                                {selectedAnnouncement.images.length > 1 && (
                                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                        {selectedAnnouncement.images.map((img, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setSelectedImageIndex(idx)}
                                                className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${selectedImageIndex === idx ? 'border-indigo-600 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                                                    }`}
                                            >
                                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        {selectedAnnouncement.description && (
                            <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100">
                                <p className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                                    {selectedAnnouncement.description}
                                </p>
                            </div>
                        )}

                        {/* Action Link Button */}
                        {selectedAnnouncement.link && (
                            <div className="pt-2">
                                <a
                                    href={selectedAnnouncement.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/25 transition-all text-sm group"
                                >
                                    <span>{selectedAnnouncement.linkButtonText || 'Open Link'}</span>
                                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </a>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirm Delete"
                maxWidth="max-w-md"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-rose-600 bg-rose-50 p-4 rounded-2xl">
                        <AlertCircle className="w-6 h-6 flex-shrink-0" />
                        <p className="text-sm font-semibold">
                            Are you sure you want to delete this announcement? This action cannot be undone.
                        </p>
                    </div>

                    <p className="text-sm text-gray-600">
                        Title: <span className="font-bold text-gray-900">{selectedAnnouncement?.title}</span>
                    </p>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-bold text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={submitting}
                            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
                        >
                            {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FacultyAnnouncements;
