import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    FileText,
    ChevronDown,
    Eye,
    ChevronLeft,
    ChevronRight,
    Search,
    BookOpen
} from 'lucide-react';

const StudentMaterials = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedMaterials, setExpandedMaterials] = useState({});
    const [carouselIndices, setCarouselIndices] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [itemsPerSlide, setItemsPerSlide] = useState(3);

    useEffect(() => {
        fetchMaterials();

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
            const response = await api.get('/materials/student');
            setMaterials(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching materials:', error);
            setLoading(false);
        }
    };

    const toggleMaterial = (id) => {
        setExpandedMaterials(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const nextSlide = (materialId, totalPdfs) => {
        setCarouselIndices(prev => {
            const currentIdx = prev[materialId] || 0;
            const maxIdx = Math.ceil(totalPdfs / itemsPerSlide) - 1;
            return { ...prev, [materialId]: (currentIdx + 1) > maxIdx ? 0 : currentIdx + 1 };
        });
    };

    const prevSlide = (materialId, totalPdfs) => {
        setCarouselIndices(prev => {
            const currentIdx = prev[materialId] || 0;
            const maxIdx = Math.ceil(totalPdfs / itemsPerSlide) - 1;
            return { ...prev, [materialId]: (currentIdx - 1) < 0 ? maxIdx : currentIdx - 1 };
        });
    };

    const filteredMaterials = (materials || []).filter(m =>
        m && m.name && m.name.toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-indigo-600" />
                        Course Materials
                    </h1>
                    <p className="text-gray-500 mt-1">Access all PDFs and resources for your enrolled course.</p>
                </div>

                <div className="relative group w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search materials..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                    />
                </div>
            </div>

            {filteredMaterials.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">No materials found</h3>
                    <p className="text-gray-500 max-w-xs mx-auto mt-2">
                        {searchTerm ? "Try adjusting your search terms." : "Materials will appear here once your faculty uploads them."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredMaterials.map((material) => (
                        <div
                            key={material._id}
                            className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${expandedMaterials[material._id]
                                ? 'border-gray-200 shadow-lg'
                                : 'border-gray-200 hover:border-indigo-200 hover:shadow-md'
                                }`}
                        >
                            {/* Material Header */}
                            <div
                                onClick={() => toggleMaterial(material._id)}
                                className="p-5 flex items-center justify-between cursor-pointer select-none"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-1">
                                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expandedMaterials[material._id] ? 'rotate-0' : '-rotate-90'}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{material.name}</h3>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {expandedMaterials[material._id] && (
                                <div className="p-6 pt-0 border-t border-gray-100 bg-white">
                                    {material.pdfs && material.pdfs.length > 0 ? (
                                        <div className="relative mt-6">
                                            {/* Carousel Controls */}
                                            {material.pdfs.length > itemsPerSlide && (
                                                <>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); prevSlide(material._id, material.pdfs.length); }}
                                                        className="absolute left-[-10px] sm:left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-white border border-gray-100 rounded-full shadow-lg hover:bg-gray-50 transition-all text-gray-400 hover:text-indigo-600 shadow-md active:scale-95"
                                                    >
                                                        <ChevronLeft className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); nextSlide(material._id, material.pdfs.length); }}
                                                        className="absolute right-[-10px] sm:right-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-white border border-gray-100 rounded-full shadow-lg hover:bg-gray-50 transition-all text-gray-400 hover:text-indigo-600 shadow-md active:scale-95"
                                                    >
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}

                                            {/* PDF Carousel Grid */}
                                            <div className="relative overflow-hidden px-2 sm:px-10">
                                                <div className="flex transition-transform duration-500 ease-in-out">
                                                    {Array.from({ length: Math.ceil(material.pdfs.length / itemsPerSlide) }).map((_, slideIdx) => {
                                                        const currentSlide = carouselIndices[material._id] || 0;
                                                        if (slideIdx !== currentSlide) return null;

                                                        const chunk = material.pdfs.slice(slideIdx * itemsPerSlide, slideIdx * itemsPerSlide + itemsPerSlide);
                                                        return (
                                                            <div key={slideIdx} className={`w-full grid grid-cols-1 sm:grid-cols-${Math.min(itemsPerSlide, 2)} lg:grid-cols-${itemsPerSlide} gap-4 py-2 animate-in fade-in duration-300`}>
                                                                {chunk.map((pdf, idx) => (
                                                                    <div
                                                                        key={pdf.public_id || idx}
                                                                        className="group relative bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all h-48 flex flex-col items-center justify-center overflow-hidden"
                                                                    >
                                                                        <div className="mb-3 w-full h-32 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center border border-gray-100 group-hover:border-indigo-200 transition-colors">
                                                                            {/* PDF Thumbnail (First Page) */}
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

                                                                        {/* Hover Overlay - View only */}
                                                                        <div className="absolute inset-0 bg-indigo-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                                            <a
                                                                                href={pdf.url}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="p-3 bg-white text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors shadow-lg active:scale-95 transform hover:scale-110"
                                                                                title="View PDF"
                                                                            >
                                                                                <Eye size={24} />
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {/* Helper to maintain grid */}
                                                                {chunk.length < itemsPerSlide && Array.from({ length: itemsPerSlide - chunk.length }).map((_, i) => (
                                                                    <div key={`empty-${i}`} className="hidden sm:block opacity-0" />
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Carousel Pagination Dots */}
                                            {material.pdfs.length > itemsPerSlide && (
                                                <div className="flex justify-center gap-2 mt-4">
                                                    {Array.from({ length: Math.ceil(material.pdfs.length / itemsPerSlide) }).map((_, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setCarouselIndices(prev => ({ ...prev, [material._id]: idx }))}
                                                            className={`w-2 h-2 rounded-full transition-all duration-300 ${(carouselIndices[material._id] || 0) === idx ? 'bg-indigo-600 w-5' : 'bg-gray-300 hover:bg-gray-400'}`}
                                                        ></button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="py-10 text-center">
                                            <p className="text-sm text-gray-400 italic">No PDF files available for this material yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentMaterials;
