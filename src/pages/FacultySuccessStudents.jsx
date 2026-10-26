import { useState, useEffect, useContext, useRef } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
    Trophy,
    Upload,
    Image as ImageIcon,
    Trash2,
    Eye,
    CheckCircle2,
    Check,
    AlertCircle,
    X,
    Filter,
    Layers,
    Sparkles,
    Calendar,
    ArrowUpRight,
    RefreshCw,
    Maximize2
} from 'lucide-react';

const FacultySuccessStudents = () => {
    const { user } = useContext(AuthContext);
    const [successStudents, setSuccessStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'

    // Upload section states
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [filePreviews, setFilePreviews] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Modal states
    const [previewItem, setPreviewItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [togglingId, setTogglingId] = useState(null);

    useEffect(() => {
        fetchSuccessStudents();
    }, []);

    const fetchSuccessStudents = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/success-students');
            setSuccessStudents(data || []);
        } catch (error) {
            console.error('Failed to fetch success students:', error);
            toast.error(error.response?.data?.message || 'Failed to load success students');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (files) => {
        const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (validFiles.length === 0) {
            toast.warning('Please select image files only (PNG, JPG, JPEG, WEBP)');
            return;
        }

        const newPreviews = validFiles.map(file => URL.createObjectURL(file));
        setSelectedFiles(prev => [...prev, ...validFiles]);
        setFilePreviews(prev => [...prev, ...newPreviews]);
    };

    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files);
        }
        e.target.value = ''; // Reset input to allow re-selecting same file
    };

    const removeSelectedFile = (index) => {
        URL.revokeObjectURL(filePreviews[index]);
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setFilePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const clearAllSelected = () => {
        filePreviews.forEach(url => URL.revokeObjectURL(url));
        setSelectedFiles([]);
        setFilePreviews([]);
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (selectedFiles.length === 0) {
            toast.warning('Please select at least one image to upload');
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('images', file);
            });

            const { data } = await api.post('/success-students', formData);

            toast.success(`Successfully uploaded ${Array.isArray(data) ? data.length : 1} image(s)!`);
            clearAllSelected();
            fetchSuccessStudents();
        } catch (error) {
            console.error('Upload failed:', error);
            const msg = error.response?.data?.message || (error.response?.status === 404 ? 'Server route not found. Ensure backend server is running.' : error.message) || 'Failed to upload images';
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    };

    const handleToggleStatus = async (item) => {
        const newStatus = !item.isActive;
        setTogglingId(item._id);

        // Optimistic UI update
        setSuccessStudents(prev =>
            prev.map(s => s._id === item._id ? { ...s, isActive: newStatus } : s)
        );

        try {
            await api.patch(`/success-students/${item._id}/toggle`, { isActive: newStatus });
            toast.success(
                newStatus
                    ? 'Toggled ON: Now visible on student panel'
                    : 'Toggled OFF: Hidden from student panel'
            );
        } catch (error) {
            console.error('Toggle failed:', error);
            toast.error(error.response?.data?.message || 'Failed to update toggle status');
            // Revert on error
            setSuccessStudents(prev =>
                prev.map(s => s._id === item._id ? { ...s, isActive: item.isActive } : s)
            );
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteItem) return;

        try {
            setDeleting(true);
            await api.delete(`/success-students/${deleteItem._id}`);
            toast.success('Success student poster deleted successfully');
            setSuccessStudents(prev => prev.filter(s => s._id !== deleteItem._id));
            setDeleteItem(null);
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error(error.response?.data?.message || 'Failed to delete poster');
        } finally {
            setDeleting(false);
        }
    };

    // Drag and Drop handlers
    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files);
        }
    };

    // Filter logic
    const filteredList = successStudents.filter(item => {
        if (filterStatus === 'active') return item.isActive;
        if (filterStatus === 'inactive') return !item.isActive;
        return true;
    });

    const activeCount = successStudents.filter(s => s.isActive).length;
    const inactiveCount = successStudents.length - activeCount;

    return (
        <div className="space-y-8 animate-in fade-in duration-300 pb-16">
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-teal-800 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-teal-950/20">
                <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-semibold text-emerald-200">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Faculty Panel • Student Placement & Achievements</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                            <Trophy className="w-8 h-8 md:w-10 md:h-10 text-amber-300" />
                            Success Student
                        </h1>
                        <p className="text-emerald-100/90 text-sm md:text-base leading-relaxed">
                            Upload success student achievement posters (standard 858×1215 format). Use the ON/OFF toggle on each card to control which posters appear in the auto-slider on the student panel.
                        </p>
                    </div>

                    {/* Stats pills */}
                    <div className="flex flex-wrap sm:flex-nowrap gap-3">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 min-w-[110px] text-center">
                            <div className="text-2xl font-black text-white">{successStudents.length}</div>
                            <div className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">Total Posters</div>
                        </div>
                        <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 rounded-2xl p-4 min-w-[110px] text-center">
                            <div className="text-2xl font-black text-emerald-300">{activeCount}</div>
                            <div className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">Active (ON)</div>
                        </div>
                        <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-2xl p-4 min-w-[110px] text-center">
                            <div className="text-2xl font-black text-gray-300">{inactiveCount}</div>
                            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Hidden (OFF)</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Section - Strictly Images Only Field */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Upload className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900">Upload Success Posters</h2>
                            <p className="text-xs text-gray-500">Only images field • Drag & drop or select single/multiple posters (858×1215 optimal)</p>
                        </div>
                    </div>

                    {selectedFiles.length > 0 && (
                        <button
                            type="button"
                            onClick={clearAllSelected}
                            className="text-xs font-semibold text-gray-400 hover:text-rose-600 transition-colors"
                        >
                            Clear Selection
                        </button>
                    )}
                </div>

                <form onSubmit={handleUploadSubmit} className="space-y-4">
                    {/* Drag and Drop Zone */}
                    <div
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${isDragging
                                ? 'border-indigo-500 bg-indigo-50/60 scale-[1.01]'
                                : 'border-gray-300 hover:border-indigo-400 bg-gray-50/50 hover:bg-indigo-50/20'
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileInputChange}
                            className="hidden"
                        />
                        <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                            <ImageIcon className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">
                                Click to select images or drag and drop here
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Supports PNG, JPG, JPEG, WEBP • Standard poster ratio 858×1215
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 shadow-sm">
                            <Upload className="w-3.5 h-3.5 text-indigo-500" />
                            Browse Files
                        </span>
                    </div>

                    {/* Previews of newly selected files before uploading */}
                    {selectedFiles.length > 0 && (
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
                                <span>Selected {selectedFiles.length} poster(s) ready to upload:</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {filePreviews.map((url, idx) => (
                                    <div
                                        key={idx}
                                        className="relative group rounded-xl overflow-hidden bg-slate-900 border border-gray-200 shadow-sm aspect-[858/1215] flex items-center justify-center"
                                    >
                                        <img
                                            src={url}
                                            alt={`Preview ${idx + 1}`}
                                            className="w-full h-full object-contain"
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeSelectedFile(idx);
                                            }}
                                            className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-lg transition-colors shadow"
                                            title="Remove image"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="absolute bottom-1 left-1.5 right-1.5 px-1 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[9px] rounded text-center truncate">
                                            {selectedFiles[idx]?.name}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Submit Upload Button */}
                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 text-sm"
                                >
                                    {uploading ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Uploading Posters...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Upload {selectedFiles.length} Success Poster{selectedFiles.length > 1 ? 's' : ''}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* Display Cards Section with ON/OFF Toggle */}
            <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <span>Uploaded Success Posters</span>
                            <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-bold">
                                {filteredList.length}
                            </span>
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Use the toggle on each card. Posters with toggle <span className="font-bold text-emerald-600">ON</span> will automatically appear in the student panel announcement slider.
                        </p>
                    </div>

                    {/* Filter tabs */}
                    <div className="inline-flex p-1 bg-gray-100 rounded-2xl text-xs font-semibold self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => setFilterStatus('all')}
                            className={`px-3.5 py-1.5 rounded-xl transition-all ${filterStatus === 'all'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            All ({successStudents.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus('active')}
                            className={`px-3.5 py-1.5 rounded-xl transition-all ${filterStatus === 'active'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-emerald-700'
                                }`}
                        >
                            Active ON ({activeCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterStatus('inactive')}
                            className={`px-3.5 py-1.5 rounded-xl transition-all ${filterStatus === 'inactive'
                                    ? 'bg-gray-800 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Hidden OFF ({inactiveCount})
                        </button>
                    </div>
                </div>

                {/* Loading state */}
                {loading ? (
                    <div className="p-16 bg-white rounded-3xl border border-gray-100 flex flex-col items-center justify-center space-y-3 text-gray-400">
                        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                        <p className="text-sm font-medium">Loading success posters...</p>
                    </div>
                ) : filteredList.length === 0 ? (
                    <div className="p-16 bg-white rounded-3xl border border-gray-100 text-center space-y-3 shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                            <Trophy className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                            {filterStatus === 'all'
                                ? 'No Success Student Posters Uploaded Yet'
                                : `No ${filterStatus === 'active' ? 'Active' : 'Hidden'} Posters Found`}
                        </h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto">
                            Upload image posters using the form above. Posters with the toggle turned ON will appear directly in the student panel announcement top slider.
                        </p>
                    </div>
                ) : (
                    /* Cards Grid: Crafted for 858x1215 Poster Dimensions */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredList.map((item) => {
                            const isToggling = togglingId === item._id;

                            return (
                                <div
                                    key={item._id}
                                    className={`bg-white rounded-3xl border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group ${item.isActive
                                            ? 'border-emerald-200/80 ring-1 ring-emerald-500/20'
                                            : 'border-gray-200 opacity-80 hover:opacity-100'
                                        }`}
                                >
                                    {/* Poster Image Container: Preserves 858x1215 without cropping */}
                                    <div
                                        onClick={() => setPreviewItem(item)}
                                        className="relative w-full aspect-[858/1215] bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center overflow-hidden cursor-pointer"
                                    >
                                        <img
                                            src={item.imageUrl}
                                            alt={item.originalName || 'Success Student'}
                                            className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300"
                                            loading="lazy"
                                        />

                                        {/* Status badge in top-left */}
                                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider backdrop-blur-md shadow-md flex items-center gap-1.5 ${item.isActive
                                                        ? 'bg-emerald-500/90 text-white'
                                                        : 'bg-black/70 text-gray-300'
                                                    }`}
                                            >
                                                <span
                                                    className={`w-2 h-2 rounded-full ${item.isActive ? 'bg-white animate-pulse' : 'bg-gray-400'
                                                        }`}
                                                />
                                                {item.isActive ? 'Active (ON)' : 'Hidden (OFF)'}
                                            </span>
                                        </div>

                                        {/* Zoom button in top-right */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewItem(item);
                                            }}
                                            className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/90 text-white rounded-xl backdrop-blur-md transition-all shadow-md group/zoom"
                                            title="View Full Poster"
                                        >
                                            <Maximize2 className="w-4 h-4 group-hover/zoom:scale-110 transition-transform" />
                                        </button>

                                        {/* Hover overlay hint */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                            <span className="px-3 py-1.5 bg-black/70 text-white text-xs font-bold rounded-xl backdrop-blur-sm flex items-center gap-1.5 shadow-lg">
                                                <Eye className="w-3.5 h-3.5" />
                                                Click to Inspect
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Content & Controls */}
                                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span className="flex items-center gap-1 truncate max-w-[150px]" title={item.originalName}>
                                                <ImageIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                <span className="truncate">{item.originalName || 'Poster'}</span>
                                            </span>
                                            <span className="text-[11px] text-gray-400">
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {/* ON / OFF Toggle Switch */}
                                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-gray-800">
                                                    Student Panel
                                                </span>
                                                <span className={`text-[11px] font-semibold ${item.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                    {item.isActive ? 'Visible (ON)' : 'Hidden (OFF)'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* Custom Toggle Switch matching Image 1 */}
                                                <button
                                                    type="button"
                                                    disabled={isToggling}
                                                    onClick={() => handleToggleStatus(item)}
                                                    className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${item.isActive ? 'bg-emerald-500' : 'bg-gray-300'
                                                        } ${isToggling ? 'opacity-50 cursor-wait' : ''}`}
                                                    role="switch"
                                                    aria-checked={item.isActive}
                                                    title={item.isActive ? 'Click to turn OFF (Hide from students)' : 'Click to turn ON (Show to students)'}
                                                >
                                                    <span className="sr-only">Toggle visibility</span>
                                                    <span
                                                        className={`pointer-events-none inline-flex h-6 w-6 items-center justify-center transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${item.isActive ? 'translate-x-7' : 'translate-x-0'
                                                            }`}
                                                    >
                                                        {item.isActive ? (
                                                            <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                                                        ) : (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                                        )}
                                                    </span>
                                                </button>

                                                {/* Delete button */}
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteItem(item)}
                                                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Delete Poster"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Full Poster Preview Lightbox Modal */}
            {previewItem && (
                <Modal
                    isOpen={!!previewItem}
                    onClose={() => setPreviewItem(null)}
                    title={previewItem.originalName || 'Success Student Poster'}
                    maxWidth="max-w-2xl"
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs">
                            <span className="flex items-center gap-1.5 font-bold">
                                Status:
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] ${previewItem.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {previewItem.isActive ? 'Visible in Student Panel' : 'Hidden from Student Panel'}
                                </span>
                            </span>
                        </div>

                        {/* Preserves 858x1215 ratio fully with zero black empty space on left/right */}
                        <div className="relative mx-auto flex items-center justify-center max-h-[75vh] w-fit rounded-2xl overflow-hidden shadow-xl">
                            <img
                                src={previewItem.imageUrl}
                                alt={previewItem.originalName}
                                className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain block"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    handleToggleStatus(previewItem);
                                    setPreviewItem(prev => ({ ...prev, isActive: !prev.isActive }));
                                }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${previewItem.isActive
                                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    }`}
                            >
                                {previewItem.isActive ? 'Turn OFF (Hide)' : 'Turn ON (Show to Students)'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setPreviewItem(null)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {deleteItem && (
                <Modal
                    isOpen={!!deleteItem}
                    onClose={() => setDeleteItem(null)}
                    title="Confirm Poster Deletion"
                    maxWidth="max-w-md"
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-800 text-sm space-y-1">
                            <div className="font-bold flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4 text-rose-600" />
                                Are you sure you want to delete this poster?
                            </div>
                            <p className="text-xs text-rose-700 leading-relaxed">
                                This will permanently remove the success student image from the server and remove it from the student panel slider.
                            </p>
                        </div>

                        {/* Thumbnail */}
                        <div className="w-24 aspect-[858/1215] mx-auto rounded-xl overflow-hidden bg-slate-900 border border-gray-200">
                            <img src={deleteItem.imageUrl} alt="" className="w-full h-full object-contain" />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeleteItem(null)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleDelete}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-rose-600/20 disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Yes, Delete Poster'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default FacultySuccessStudents;
