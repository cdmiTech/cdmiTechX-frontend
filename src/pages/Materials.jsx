import { useState, useEffect } from 'react';
import api from '../utils/api';

import Modal from '../components/Modal';
import { Plus, ChevronDown, ChevronRight, FileText, Trash2, Edit2, Upload, X, ChevronLeft, Eye, Check } from 'lucide-react';
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

const SortableMaterialItem = ({ material, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: material._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
        position: 'relative'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`bg-white rounded-lg shadow overflow-hidden border border-gray-100 cursor-grab active:cursor-grabbing ${isDragging ? 'z-50 shadow-xl border-indigo-300 ring-2 ring-indigo-500/20' : ''}`}
        >
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
};

const SortablePDFItem = ({ pdf, materialId, onDelete, itemsPerSlide }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: pdf.public_id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`relative group bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all h-48 flex flex-col items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing ${isDragging ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20' : ''}`}
        >
            <div className="mb-3 w-full h-32 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center border border-gray-100 group-hover:border-indigo-200 transition-colors">
                <img
                    src={pdf.url.replace('.pdf', '.jpg')}
                    alt="thumbnail"
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                    }}
                />
                <div style={{ display: 'none' }}>
                    <FileText className="w-10 h-10 text-red-500" />
                </div>
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-gray-700 text-center line-clamp-1 px-1">
                {pdf.name || pdf.public_id.split('/').pop().split('_').slice(0, -1).join('_')}
            </span>

            <div className="absolute inset-0 bg-indigo-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3 backdrop-blur-[2px]" onClick={e => e.stopPropagation()}>
                <a
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-white text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors shadow-lg active:scale-95"
                    title="View PDF"
                >
                    <Eye size={20} />
                </a>

                <button
                    onClick={() => onDelete(materialId, pdf.public_id)}
                    className="p-2.5 bg-white text-rose-600 rounded-full hover:bg-rose-50 transition-colors shadow-lg active:scale-95"
                    title="Delete PDF"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </div>
    );
};

const Materials = () => {
    const [materials, setMaterials] = useState([]);
    const [courses, setCourses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [expandedMaterials, setExpandedMaterials] = useState({});
    const [carouselIndices, setCarouselIndices] = useState({});
    const [itemsPerSlide, setItemsPerSlide] = useState(3);

    const [formData, setFormData] = useState({
        name: '',
        courseIds: []
    });

    const [editingMaterialId, setEditingMaterialId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editCourseIds, setEditCourseIds] = useState([]);
    const [showUploadForm, setShowUploadForm] = useState({});
    const [uploadData, setUploadData] = useState({
        name: '',
        pdfs: []
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchMaterials();
        fetchCourses();

        const handleResize = () => {
            if (window.innerWidth < 640) setItemsPerSlide(1);
            else if (window.innerWidth < 1024) setItemsPerSlide(2);
            else setItemsPerSlide(3);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchMaterials = async () => {
        try {
            const { data } = await api.get('/materials');
            setMaterials(data);
        } catch (error) {
            console.error('Error fetching materials:', error);
        }
    };

    const fetchCourses = async () => {
        try {
            const { data } = await api.get('/courses');
            setCourses(data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const handleCourseToggle = (courseId) => {
        const currentIds = formData.courseIds;
        if (currentIds.includes(courseId)) {
            setFormData({ ...formData, courseIds: currentIds.filter(id => id !== courseId) });
        } else {
            setFormData({ ...formData, courseIds: [...currentIds, courseId] });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.courseIds.length === 0) {
            alert('Please select at least one course');
            return;
        }

        setLoading(true);
        const data = new FormData();
        data.append('name', formData.name);
        data.append('courseIds', JSON.stringify(formData.courseIds));

        try {
            await api.post('/materials', data);
            fetchMaterials();
            closeModal();
            alert('Material added successfully');
        } catch (error) {
            console.error('Error saving material:', error);
            alert(error.response?.data?.message || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateMaterial = async (id) => {
        if (!editName.trim()) return;
        if (editCourseIds.length === 0) {
            alert('Please select at least one course');
            return;
        }

        setLoading(true);
        try {
            await api.put(`/materials/${id}`, {
                name: editName,
                courseIds: JSON.stringify(editCourseIds)
            });
            setEditingMaterialId(null);
            fetchMaterials();
            alert('Material updated successfully');
        } catch (error) {
            console.error('Error updating material:', error);
            alert(error.response?.data?.message || 'Error updating material');
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData({ name: '', courseIds: [] });
    };

    const toggleMaterial = (id) => {
        setExpandedMaterials(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleDeleteMaterial = async (id) => {
        if (window.confirm('Delete entire material? This will remove all associated PDFs.')) {
            try {
                await api.delete(`/materials/${id}`);
                fetchMaterials();
            } catch (error) {
                alert(error.response?.data?.message || 'Error deleting material');
            }
        }
    };

    const handleDeletePDF = async (materialId, publicId) => {
        if (window.confirm('Delete this PDF?')) {
            try {
                await api.delete(`/materials/${materialId}/pdf/${publicId}`);
                fetchMaterials();
                setCarouselIndices(prev => ({ ...prev, [materialId]: 0 }));
            } catch (error) {
                console.error('Error deleting PDF:', error);
                alert(error.response?.data?.message || 'Error deleting PDF');
            }
        }
    };

    const handleAppendPDF = async (materialId) => {
        if (uploadData.pdfs.length === 0) {
            alert('Please select at least one PDF file');
            return;
        }

        const data = new FormData();
        uploadData.pdfs.forEach(file => {
            data.append('pdf', file);
        });
        if (uploadData.name) data.append('name', uploadData.name);

        setLoading(true);
        try {
            await api.post(`/materials/${materialId}/append`, data);
            fetchMaterials();
            setUploadData({ name: '', pdfs: [] });
            // Form stays open — user can upload more without clicking the button again
            alert('PDF(s) uploaded successfully');
        } catch (error) {
            console.error('Error uploading PDF:', error);
            alert(error.response?.data?.message || 'Error uploading PDF');
        } finally {
            setLoading(false);
        }
    };

    const handleEditToggle = (material) => {
        setEditingMaterialId(material._id);
        setEditName(material.name);
        setEditCourseIds(material.courseIds.map(c => c._id));
    };

    const handleEditCourseToggle = (courseId) => {
        setEditCourseIds(prev =>
            prev.includes(courseId)
                ? prev.filter(id => id !== courseId)
                : [...prev, courseId]
        );
    };

    // Carousel Logic
    const nextSlide = (id, max) => {
        setCarouselIndices(prev => ({
            ...prev,
            [id]: ((prev[id] || 0) + 1) % max
        }));
    };

    const prevSlide = (id, max) => {
        setCarouselIndices(prev => ({
            ...prev,
            [id]: ((prev[id] || 0) - 1 + max) % max
        }));
    };

    const handleMaterialDragEnd = async (event) => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            setMaterials((items) => {
                const oldIndex = items.findIndex((i) => i._id === active.id);
                const newIndex = items.findIndex((i) => i._id === over.id);

                const newMaterials = arrayMove(items, oldIndex, newIndex);

                // Update order in background
                const orderedIds = newMaterials.map((item, index) => ({
                    _id: item._id,
                    order: index
                }));

                api.patch('/materials/reorder', { materials: orderedIds })
                    .catch(err => {
                        console.error('Failed to update order:', err);
                        fetchMaterials();
                    });

                return newMaterials;
            });
        }
    };

    const handlePDFDragEnd = async (event, materialId) => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id) {
            const material = materials.find(m => m._id === materialId);
            if (!material) return;

            const oldIndex = material.pdfs.findIndex((i) => i.public_id === active.id);
            const newIndex = material.pdfs.findIndex((i) => i.public_id === over.id);

            const newPDFs = arrayMove(material.pdfs, oldIndex, newIndex);

            // Update local state
            setMaterials(prev => prev.map(m => {
                if (m._id === materialId) {
                    return { ...m, pdfs: newPDFs };
                }
                return m;
            }));

            // Update order in background
            const orderedPDFs = newPDFs.map((item, index) => ({
                public_id: item.public_id,
                order: index
            }));

            try {
                await api.patch(`/materials/${materialId}/reorder-pdfs`, { pdfs: orderedPDFs });
            } catch (err) {
                console.error('Failed to update PDF order:', err);
                fetchMaterials();
            }
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Materials Management</h1>
                    <p className="text-gray-500 mt-1">Upload and organize course PDFs for students.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Material
                </button>
            </div>

            {loading && editingMaterialId === null && !isModalOpen && (
                <div className="text-center py-4 text-indigo-600 font-semibold">Updating...</div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleMaterialDragEnd}
            >
                <SortableContext
                    items={materials.map(m => m._id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-4">
                        {materials.length === 0 ? (
                            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                                No materials found. Click "Add Material" to get started.
                            </div>
                        ) : materials.map(material => (
                            <SortableMaterialItem key={material._id} material={material}>
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={() => toggleMaterial(material._id)}>
                                    <div className="flex items-center flex-1">
                                        {expandedMaterials[material._id] ? <ChevronDown className="w-5 h-5 mr-3 text-gray-400" /> : <ChevronRight className="w-5 h-5 mr-3 text-gray-400" />}

                                        {editingMaterialId === material._id ? (
                                            <div className="flex-1 bg-indigo-50 p-4 rounded-lg border border-indigo-100 space-y-3" onClick={e => e.stopPropagation()}>
                                                <div>
                                                    <label className="block text-xs font-semibold text-indigo-900 mb-1">Material Name</label>
                                                    <input
                                                        type="text"
                                                        className="w-full border border-indigo-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                                        value={editName}
                                                        onChange={e => setEditName(e.target.value)}
                                                        onKeyDown={(e) => e.stopPropagation()}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-indigo-900 mb-1">Assign to Courses</label>
                                                    <div className="grid grid-cols-2 gap-2 bg-white/50 p-2 rounded border border-indigo-100 max-h-32 overflow-y-auto">
                                                        {courses.map(course => (
                                                            <label key={course._id} className="flex items-center space-x-2 p-1 hover:bg-white rounded cursor-pointer transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={editCourseIds.includes(course._id)}
                                                                    onChange={() => handleEditCourseToggle(course._id)}
                                                                    className="h-3 w-3 text-indigo-600 border-gray-300 rounded"
                                                                />
                                                                <span className="text-[11px] text-gray-700 truncate">{course.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex justify-end space-x-2 pt-1 border-t border-indigo-100">
                                                    <button onClick={() => setEditingMaterialId(null)} className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded transition-colors">
                                                        Cancel
                                                    </button>
                                                    <button onClick={() => handleUpdateMaterial(material._id)} className="px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 rounded transition-colors flex items-center">
                                                        <Check className="w-3 h-3 mr-1" /> Save Changes
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-800">{material.name}</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {material.courseIds.map(course => (
                                                        <span key={course._id} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                                                            {course.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-3" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => handleEditToggle(material)}
                                            className="text-gray-400 hover:text-indigo-600 transition-colors"
                                            title="Edit Material"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                // Always open the form (never toggle it closed)
                                                setShowUploadForm(prev => ({ ...prev, [material._id]: true }));
                                                if (!expandedMaterials[material._id]) {
                                                    toggleMaterial(material._id);
                                                }
                                            }}
                                            className="text-gray-400 hover:text-green-600 transition-colors"
                                            title="Upload PDF"
                                        >
                                            <Upload className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteMaterial(material._id)}
                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                            title="Delete Material"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Content - Accordion Body */}
                                {expandedMaterials[material._id] && (
                                    <div className="p-4 bg-gray-50 border-t border-gray-50" onClick={e => e.stopPropagation()}>
                                        {/* Sub-Material Upload Form */}
                                        {showUploadForm[material._id] && (
                                            <div className="mb-6 p-4 bg-white rounded-xl border border-green-100 shadow-sm animate-in slide-in-from-top-2 duration-300">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-sm font-bold text-gray-800 flex items-center">
                                                        <Upload className="w-4 h-4 mr-2 text-green-600" />
                                                        Upload New Sub-Material
                                                    </h4>
                                                    <button onClick={() => setShowUploadForm(prev => ({ ...prev, [material._id]: false }))} className="text-gray-400 hover:text-gray-600">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Sub-Material Name</label>
                                                        <input
                                                            type="text"
                                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-500 outline-none"
                                                            placeholder="e.g. Chapter 1 Introduction"
                                                            value={uploadData.name}
                                                            onChange={e => setUploadData({ ...uploadData, name: e.target.value })}
                                                            onKeyDown={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Select PDF</label>
                                                        <div className="relative">
                                                            <input
                                                                type="file"
                                                                accept="application/pdf"
                                                                multiple
                                                                onChange={e => {
                                                                    const files = Array.from(e.target.files);
                                                                    const invalidFiles = files.filter(f => f.type !== 'application/pdf');
                                                                    if (invalidFiles.length > 0) {
                                                                        alert('Only PDF files are allowed');
                                                                        e.target.value = '';
                                                                        return;
                                                                    }
                                                                    setUploadData({ ...uploadData, pdfs: files });
                                                                }}
                                                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex justify-end">
                                                    <button
                                                        onClick={() => handleAppendPDF(material._id)}
                                                        disabled={loading || uploadData.pdfs.length === 0}
                                                        className={`px-4 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all shadow-md shadow-green-100 ${loading || uploadData.pdfs.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        {loading ? 'Uploading...' : 'Start Upload'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {material.pdfs.length === 0 ? (
                                            <p className="text-sm text-gray-500 italic text-center py-4">No PDFs in this material.</p>
                                        ) : (
                                            <div className="relative">
                                                {/* PDF Carousel - ALL slides always in DOM for cross-slide drag support */}
                                                <div className="relative overflow-hidden px-2 sm:px-10">
                                                    <DndContext
                                                        sensors={sensors}
                                                        collisionDetection={closestCenter}
                                                        onDragEnd={(e) => handlePDFDragEnd(e, material._id)}
                                                    >
                                                        <SortableContext
                                                            items={material.pdfs.map(p => p.public_id)}
                                                            strategy={verticalListSortingStrategy}
                                                        >
                                                            {/* Render ALL slides but only show the current one */}
                                                            {Array.from({ length: Math.ceil(material.pdfs.length / itemsPerSlide) }).map((_, slideIdx) => {
                                                                const currentSlide = carouselIndices[material._id] || 0;
                                                                const isVisible = slideIdx === currentSlide;
                                                                const chunk = material.pdfs.slice(slideIdx * itemsPerSlide, slideIdx * itemsPerSlide + itemsPerSlide);
                                                                return (
                                                                    <div
                                                                        key={slideIdx}
                                                                        style={{ display: isVisible ? undefined : 'none' }}
                                                                        className={`w-full grid grid-cols-1 sm:grid-cols-${Math.min(itemsPerSlide, 2)} lg:grid-cols-${itemsPerSlide} gap-4 py-2`}
                                                                    >
                                                                        {chunk.map((pdf) => (
                                                                            <SortablePDFItem key={pdf.public_id} pdf={pdf} materialId={material._id} onDelete={handleDeletePDF} itemsPerSlide={itemsPerSlide} />
                                                                        ))}
                                                                        {/* Fallback empty cards */}
                                                                        {chunk.length < itemsPerSlide && Array.from({ length: itemsPerSlide - chunk.length }).map((_, i) => (
                                                                            <div key={`empty-${i}`} className="hidden sm:block opacity-0" />
                                                                        ))}
                                                                    </div>
                                                                );
                                                            })}
                                                        </SortableContext>
                                                    </DndContext>

                                                    {/* Navigation Arrows */}
                                                    {material.pdfs.length > itemsPerSlide && (
                                                        <>
                                                            <button
                                                                onClick={() => prevSlide(material._id, Math.ceil(material.pdfs.length / itemsPerSlide))}
                                                                className="absolute left-[-5px] sm:left-0 top-1/2 -translate-y-1/2 p-2 bg-white/90 border border-gray-100 rounded-full shadow-lg hover:bg-white transition-all text-gray-600 z-10 hover:scale-110 active:scale-90 backdrop-blur-sm"
                                                            >
                                                                <ChevronLeft className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => nextSlide(material._id, Math.ceil(material.pdfs.length / itemsPerSlide))}
                                                                className="absolute right-[-5px] sm:right-0 top-1/2 -translate-y-1/2 p-2 bg-white/90 border border-gray-100 rounded-full shadow-lg hover:bg-white transition-all text-gray-600 z-10 hover:scale-110 active:scale-90 backdrop-blur-sm"
                                                            >
                                                                <ChevronRight className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>

                                                {material.pdfs.length > itemsPerSlide && (
                                                    <div className="flex justify-center space-x-2 mt-4">
                                                        {Array.from({ length: Math.ceil(material.pdfs.length / itemsPerSlide) }).map((_, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => setCarouselIndices(prev => ({ ...prev, [material._id]: idx }))}
                                                                className={`w-2 h-2 rounded-full transition-all duration-300 ${(carouselIndices[material._id] || 0) === idx ? 'bg-indigo-600 w-5' : 'bg-gray-300 hover:bg-gray-400'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </SortableMaterialItem>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Add Material Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title="Add New Material"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Material Name</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g. Mathematics Basics"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Courses</label>
                        <div className="grid grid-cols-2 gap-2 border p-3 rounded-md max-h-40 overflow-y-auto bg-gray-50">
                            {courses.map(course => (
                                <label key={course._id} className="flex items-center space-x-2 p-1.5 hover:bg-white rounded cursor-pointer border border-transparent hover:border-indigo-100 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={formData.courseIds.includes(course._id)}
                                        onChange={() => handleCourseToggle(course._id)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <span className="text-sm text-gray-700 truncate">{course.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-lg shadow-indigo-100 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Processing...' : 'Create Material'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Materials;
