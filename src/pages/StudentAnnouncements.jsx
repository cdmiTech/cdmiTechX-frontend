import { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import {
    Megaphone,
    Calendar,
    Clock,
    ExternalLink,
    ArrowUpRight,
    Search,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    AlertCircle,
    Bell,
    ListOrdered,
    Sparkles,
    Image as ImageIcon,
    Tag,
    Layers,
    Share2,
    Info,
    Trophy,
    Maximize2
} from 'lucide-react';

const StudentAnnouncements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    // Success Students Auto Slider states
    const [successStudents, setSuccessStudents] = useState([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const [isSliderPaused, setIsSliderPaused] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(3);
    const [previewSuccessPoster, setPreviewSuccessPoster] = useState(null);
    const [previewPosterIndex, setPreviewPosterIndex] = useState(0);

    // Modal states
    const [isAllAnnouncementsModalOpen, setIsAllAnnouncementsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Search inside All Announcements modal
    const [modalSearchTerm, setModalSearchTerm] = useState('');

    useEffect(() => {
        fetchAnnouncements();
        fetchSuccessStudents();
    }, []);

    const fetchSuccessStudents = async () => {
        try {
            const { data } = await api.get('/success-students?onlyActive=true');
            // Strictly descending order: newest uploads appear first in slider
            const sorted = (data || []).sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                if (dateB !== dateA) return dateB - dateA;
                return String(b._id).localeCompare(String(a._id));
            });
            setSuccessStudents(sorted);
        } catch (error) {
            console.error('Failed to fetch success students:', error);
        }
    };

    // Responsive items per page for auto slider (3 on desktop, 2 on tablet, 1 on mobile)
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setItemsPerPage(1);
            } else if (window.innerWidth < 1024) {
                setItemsPerPage(2);
            } else {
                setItemsPerPage(3);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto slider interval effect
    useEffect(() => {
        if (isSliderPaused || successStudents.length <= itemsPerPage) return;
        const interval = setInterval(() => {
            nextSuccessSlide();
        }, 3500);
        return () => clearInterval(interval);
    }, [isSliderPaused, successStudents.length, itemsPerPage]);

    // Handle seamless infinite sliding reset
    useEffect(() => {
        if (!isTransitioning) {
            const timeout = setTimeout(() => {
                setIsTransitioning(true);
            }, 50);
            return () => clearTimeout(timeout);
        }
    }, [isTransitioning]);

    const nextSuccessSlide = () => {
        if (successStudents.length <= itemsPerPage) return;
        setIsTransitioning(true);
        setCurrentSlideIndex(prev => prev + 1);
    };

    const prevSuccessSlide = () => {
        if (successStudents.length <= itemsPerPage) return;
        setIsTransitioning(true);
        setCurrentSlideIndex(prev => (prev === 0 ? successStudents.length - 1 : prev - 1));
    };

    const handleSuccessTransitionEnd = () => {
        if (currentSlideIndex >= successStudents.length) {
            setIsTransitioning(false);
            setCurrentSlideIndex(0);
        }
    };

    // Extended list for seamless looping carousel
    const displaySuccessList = successStudents.length > itemsPerPage
        ? [...successStudents, ...successStudents.slice(0, itemsPerPage)]
        : successStudents;

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/announcements');
            setAnnouncements(data || []);
        } catch (error) {
            console.error('Failed to fetch announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const now = new Date();
    const isExpired = (endDate) => {
        if (!endDate) return false;
        return new Date(endDate) < now;
    };

    const openDetailModal = (announcement) => {
        setSelectedAnnouncement(announcement);
        setActiveImageIndex(0);
        setIsDetailModalOpen(true);
    };

    // Active announcements for the main feed
    const activeAnnouncements = announcements.filter(item => !isExpired(item.endDate) && item.isActive);

    // All announcements sorted descending by createdAt (newest first)
    const allSortedAnnouncements = [...announcements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Filtered inside modal
    const filteredModalAnnouncements = allSortedAnnouncements.filter(item =>
        item.title?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(modalSearchTerm.toLowerCase())
    );

    const getDaysRemaining = (endDate) => {
        if (!endDate) return null;
        const diff = new Date(endDate) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days <= 0) return 'Ends today';
        if (days === 1) return '1 day left';
        return `${days} days left`;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300 pb-16">
            {/* ------------------------------------------------------------- */}
            {/* SUCCESS STUDENTS TOP AUTO SLIDER (3 CARDS, 858x1215 RATIO)    */}
            {/* ------------------------------------------------------------- */}
            {successStudents.length > 0 && (
                <div className="space-y-4">
                    {/* Recent Placed Students Header: Only icon and simple text */}
                    <div className="flex items-center gap-3 pt-1">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-white flex items-center justify-center shadow-md shadow-amber-500/25 flex-shrink-0">
                            <Trophy className="w-5 h-5 text-amber-950" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                            Recent Placed Students
                        </h2>
                    </div>

                    {/* Auto Slider Viewport */}
                    <div
                        className="relative overflow-hidden rounded-3xl"
                        onMouseEnter={() => setIsSliderPaused(true)}
                        onMouseLeave={() => setIsSliderPaused(false)}
                    >
                        <div
                            className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-out' : ''}`}
                            style={{
                                transform: `translateX(-${currentSlideIndex * (100 / itemsPerPage)}%)`
                            }}
                            onTransitionEnd={handleSuccessTransitionEnd}
                        >
                            {displaySuccessList.map((item, idx) => {
                                const originalIdx = idx % successStudents.length;

                                return (
                                    <div
                                        key={idx}
                                        style={{ width: `${100 / itemsPerPage}%` }}
                                        className="flex-shrink-0 p-2 sm:p-3"
                                    >
                                        <div
                                            onClick={() => {
                                                setPreviewSuccessPoster(item);
                                                setPreviewPosterIndex(originalIdx);
                                            }}
                                            className="group relative bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-2.5 border border-indigo-500/25 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden flex flex-col items-center"
                                        >
                                            {/* Poster Image Container: Exactly Preserves 858x1215 Dimensions Without Any Cropping */}
                                            <div className="relative w-full aspect-[858/1215] rounded-2xl overflow-hidden bg-slate-950/90 flex items-center justify-center">
                                                {/* Ambient blurred glow in backdrop */}
                                                <div
                                                    className="absolute inset-0 bg-cover bg-center blur-md opacity-30 scale-110 pointer-events-none"
                                                    style={{ backgroundImage: `url(${item.imageUrl})` }}
                                                />

                                                {/* Crisp 858x1215 Poster Image */}
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.originalName || 'Success Student'}
                                                    className="relative z-10 w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300 drop-shadow-lg"
                                                    loading="lazy"
                                                />

                                                {/* Top Badge */}
                                                <div className="absolute top-3 left-3 z-20">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/95 text-amber-950 text-[10px] sm:text-xs font-black rounded-full shadow-lg backdrop-blur-md uppercase tracking-wider">
                                                        <Trophy className="w-3.5 h-3.5 text-amber-950" />
                                                        Success Story
                                                    </span>
                                                </div>

                                                {/* Hover Action: Click to inspect */}
                                                <div className="absolute inset-0 z-20 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                    <span className="px-4 py-2 bg-indigo-600/90 text-white rounded-xl text-xs font-bold shadow-xl backdrop-blur-md flex items-center gap-1.5 transform group-hover:scale-100 scale-90 transition-all">
                                                        <Maximize2 className="w-3.5 h-3.5" />
                                                        View Full Poster
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Floating Navigation Arrows over sides */}
                        {successStudents.length > itemsPerPage && (
                            <>
                                <button
                                    type="button"
                                    onClick={prevSuccessSlide}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md shadow-xl transition-all z-30 hover:scale-110"
                                    title="Previous"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={nextSuccessSlide}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md shadow-xl transition-all z-30 hover:scale-110"
                                    title="Next"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Pagination Indicator Dots */}
                    {successStudents.length > itemsPerPage && (
                        <div className="flex items-center justify-center gap-1.5 pt-1">
                            {successStudents.map((_, dotIdx) => {
                                const isActiveDot = (currentSlideIndex % successStudents.length) === dotIdx;
                                return (
                                    <button
                                        key={dotIdx}
                                        type="button"
                                        onClick={() => {
                                            setIsTransitioning(true);
                                            setCurrentSlideIndex(dotIdx);
                                        }}
                                        className={`h-2 rounded-full transition-all duration-300 ${isActiveDot ? 'w-8 bg-amber-500' : 'w-2 bg-gray-300 hover:bg-gray-400'
                                            }`}
                                        title={`Go to slide ${dotIdx + 1}`}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Active Notices Section Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 pb-1">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/25 flex-shrink-0">
                        <Megaphone className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                        Active Notices
                    </h3>
                </div>

                {/* All Announcements Button */}
                <button
                    onClick={() => {
                        setModalSearchTerm('');
                        setIsAllAnnouncementsModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white text-indigo-950 font-bold rounded-2xl shadow-sm hover:shadow-md hover:bg-indigo-50/80 transition-all duration-200 active:scale-95 border border-gray-200 self-start sm:self-auto text-sm"
                >
                    <span>All Announcements</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full font-bold">
                        {announcements.length}
                    </span>
                </button>
            </div>

            {/* Active Announcements Display */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-gray-100 text-gray-400 space-y-3">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium">Checking for latest announcements...</p>
                </div>
            ) : activeAnnouncements.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold text-gray-900">
                            You are All Caught Up!
                        </h3>
                        <p className="text-sm text-gray-500 max-w-md mx-auto">
                            There are no active notices right now. You can check previous notices anytime from the announcement archive.
                        </p>
                    </div>
                    <div>
                        <button
                            onClick={() => {
                                setModalSearchTerm('');
                                setIsAllAnnouncementsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all"
                        >
                            <ListOrdered className="w-4 h-4" />
                            Browse All Announcements
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeAnnouncements.map((announcement) => {
                        const hasImages = announcement.images && announcement.images.length > 0;
                        const coverImage = hasImages ? announcement.images[0]?.url : null;
                        const remainingTag = getDaysRemaining(announcement.endDate);

                        return (
                            <div
                                key={announcement._id}
                                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col overflow-hidden group border-t-4 border-t-indigo-600"
                            >
                                {/* Poster / Image Area */}
                                {coverImage ? (
                                    <div
                                        onClick={() => openDetailModal(announcement)}
                                        className="relative h-52 w-full bg-gray-900 cursor-pointer overflow-hidden"
                                    >
                                        <img
                                            src={coverImage}
                                            alt={announcement.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                        {/* Status and countdown badges */}
                                        <div className="absolute top-3 left-3 flex items-center gap-2">
                                            <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-md backdrop-blur-md uppercase tracking-wider">
                                                Active
                                            </span>
                                            {remainingTag && (
                                                <span className="px-3 py-1 bg-black/60 text-white text-xs font-semibold rounded-full backdrop-blur-md flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-amber-300" />
                                                    {remainingTag}
                                                </span>
                                            )}
                                        </div>

                                        {announcement.images.length > 1 && (
                                            <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/60 text-white text-xs font-semibold rounded-lg backdrop-blur-md flex items-center gap-1.5">
                                                <ImageIcon className="w-3.5 h-3.5" />
                                                +{announcement.images.length - 1} more
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => openDetailModal(announcement)}
                                        className="h-32 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-indigo-50 p-5 flex items-center justify-between border-b border-gray-100 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider">
                                                Active
                                            </span>
                                            {remainingTag && (
                                                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {remainingTag}
                                                </span>
                                            )}
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100/50 flex items-center justify-center text-indigo-600">
                                            <Megaphone className="w-5 h-5" />
                                        </div>
                                    </div>
                                )}

                                {/* Content */}
                                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                    <div className="space-y-2">
                                        <h3
                                            onClick={() => openDetailModal(announcement)}
                                            className="font-black text-gray-900 text-lg leading-snug hover:text-indigo-600 cursor-pointer transition-colors line-clamp-2"
                                        >
                                            {announcement.title}
                                        </h3>
                                        {announcement.description && (
                                            <p className="text-gray-500 text-xs sm:text-sm line-clamp-3 leading-relaxed whitespace-pre-line">
                                                {announcement.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action link if provided */}
                                    {announcement.link && (
                                        <div className="pt-2">
                                            <a
                                                href={announcement.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-bold rounded-xl transition-all group/btn"
                                            >
                                                <span>{announcement.linkButtonText || 'Learn More'}</span>
                                                <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                                            </a>
                                        </div>
                                    )}

                                    {/* Footer Info */}
                                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                                        {announcement.endDate ? (
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>Valid till: {new Date(announcement.endDate).toLocaleDateString()}</span>
                                            </div>
                                        ) : (
                                            <div />
                                        )}

                                        <button
                                            onClick={() => openDetailModal(announcement)}
                                            className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 transition-colors"
                                        >
                                            Details
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* ALL ANNOUNCEMENTS MODAL (DESCENDING ORDER BY DATE) */}
            {/* ------------------------------------------------------------- */}
            <Modal
                isOpen={isAllAnnouncementsModalOpen}
                onClose={() => setIsAllAnnouncementsModalOpen(false)}
                title="All Announcements & Circulars"
                maxWidth="max-w-3xl"
            >
                <div className="space-y-5">
                    {/* Header info & Search within modal */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                        <div>
                            <p className="text-xs text-gray-500 font-medium">
                                Showing all <span className="font-bold text-gray-900">{announcements.length}</span> announcements ordered from newest to oldest.
                            </p>
                            <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                                Click on any announcement title to open and view complete details.
                            </p>
                        </div>

                        <div className="relative w-full sm:w-64">
                            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Filter all notices..."
                                value={modalSearchTerm}
                                onChange={(e) => setModalSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Announcement list sorted descending */}
                    {filteredModalAnnouncements.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            No announcements found matching "{modalSearchTerm}".
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                            {filteredModalAnnouncements.map((item, index) => {
                                const expired = isExpired(item.endDate);
                                const hasImages = item.images && item.images.length > 0;

                                return (
                                    <div
                                        key={item._id}
                                        onClick={() => openDetailModal(item)}
                                        className="p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 bg-white hover:bg-indigo-50/40 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex items-center justify-between gap-4 group"
                                    >
                                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                            {/* Number indicator / Thumbnail */}
                                            {hasImages ? (
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                                                    <img src={item.images[0].url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                                    <Megaphone className="w-5 h-5" />
                                                </div>
                                            )}

                                            <div className="min-w-0 flex-1 space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${expired || !item.isActive
                                                        ? 'bg-gray-100 text-gray-600'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                        {expired ? 'Expired' : item.isActive ? 'Active' : 'Inactive'}
                                                    </span>

                                                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                </div>

                                                {/* Announcement Title */}
                                                <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors text-sm sm:text-base truncate">
                                                    {item.title}
                                                </h4>

                                                {/* Short snippet */}
                                                {item.description && (
                                                    <p className="text-xs text-gray-500 line-clamp-1">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Click action indicator */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="hidden sm:inline-block text-xs font-semibold text-gray-400 group-hover:text-indigo-600 transition-colors">
                                                View
                                            </span>
                                            <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-indigo-600 group-hover:text-white text-gray-400 flex items-center justify-center transition-all duration-200">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Modal>

            {/* ------------------------------------------------------------- */}
            {/* COMPLETE ANNOUNCEMENT DIALOG (FULL STRUCTURED VIEW) */}
            {/* ------------------------------------------------------------- */}
            {selectedAnnouncement && (
                <Modal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    title={
                        <div className="flex flex-wrap items-baseline gap-2.5">
                            <span className="text-xl font-bold text-gray-900">Announcement Details</span>
                            {selectedAnnouncement.createdAt && (
                                <span className="text-xs font-normal text-gray-500">
                                    • Posted on: {new Date(selectedAnnouncement.createdAt).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })} at {new Date(selectedAnnouncement.createdAt).toLocaleTimeString(undefined, {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            )}
                        </div>
                    }
                    maxWidth="max-w-3xl"
                >
                    <div className="space-y-6">

                        {/* Complete Announcement Title */}
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-snug">
                            {selectedAnnouncement.title}
                        </h2>

                        {/* Image Showcase / Lightbox Slider */}
                        {selectedAnnouncement.images && selectedAnnouncement.images.length > 0 && (
                            <div className="space-y-3">
                                <div className="relative mx-auto flex items-center justify-center max-h-[75vh] w-fit rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                                    <img
                                        src={selectedAnnouncement.images[activeImageIndex]?.url}
                                        alt={selectedAnnouncement.title}
                                        className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain block"
                                    />

                                    {selectedAnnouncement.images.length > 1 && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => setActiveImageIndex(prev => (prev === 0 ? selectedAnnouncement.images.length - 1 : prev - 1))}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full transition-all backdrop-blur-sm"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveImageIndex(prev => (prev === selectedAnnouncement.images.length - 1 ? 0 : prev + 1))}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full transition-all backdrop-blur-sm"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                            <span className="absolute bottom-3 right-3 px-3 py-1 bg-black/70 backdrop-blur-md text-white text-xs font-semibold rounded-lg">
                                                Image {activeImageIndex + 1} of {selectedAnnouncement.images.length}
                                            </span>
                                        </>
                                    )}
                                </div>

                                {/* Thumbnail Selector */}
                                {selectedAnnouncement.images.length > 1 && (
                                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                        {selectedAnnouncement.images.map((img, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setActiveImageIndex(idx)}
                                                className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${activeImageIndex === idx ? 'border-indigo-600 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                                                    }`}
                                            >
                                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Complete Description */}
                        {selectedAnnouncement.description && (
                            <div className="bg-gray-50/90 rounded-2xl p-6 border border-gray-100 text-gray-800">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                                    Notice Description
                                </h4>
                                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-line text-gray-700">
                                    {selectedAnnouncement.description}
                                </p>
                            </div>
                        )}

                        {/* Action Link Button if provided */}
                        {selectedAnnouncement.link && (
                            <div className="pt-2">
                                <a
                                    href={selectedAnnouncement.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 transition-all text-base group"
                                >
                                    <span>{selectedAnnouncement.linkButtonText || 'Open Link'}</span>
                                    <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                </a>
                            </div>
                        )}

                        {/* Footer Information */}
                        <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-400 gap-2">
                            {selectedAnnouncement.endDate ? (
                                <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                    Valid till: {new Date(selectedAnnouncement.endDate).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })} at {new Date(selectedAnnouncement.endDate).toLocaleTimeString(undefined, {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            ) : (
                                <div />
                            )}

                            <button
                                type="button"
                                onClick={() => setIsDetailModalOpen(false)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ------------------------------------------------------------- */}
            {/* SUCCESS STUDENT POSTER LIGHTBOX MODAL                         */}
            {/* ------------------------------------------------------------- */}
            {previewSuccessPoster && (
                <Modal
                    isOpen={!!previewSuccessPoster}
                    onClose={() => setPreviewSuccessPoster(null)}
                    title="Student Achievement & Success Story"
                    maxWidth="max-w-2xl"
                >
                    <div className="space-y-4">
                        {/* Full poster preserving 858x1215 ratio with zero black empty space on left/right */}
                        <div className="relative mx-auto flex items-center justify-center max-h-[82vh] w-fit rounded-2xl overflow-hidden shadow-2xl">
                            <img
                                src={previewSuccessPoster.imageUrl}
                                alt={previewSuccessPoster.originalName || 'Success Student'}
                                className="max-h-[82vh] w-auto max-w-full rounded-2xl object-contain block"
                            />

                            {/* Previous / Next buttons inside lightbox if multiple posters */}
                            {successStudents.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newIdx = (previewPosterIndex - 1 + successStudents.length) % successStudents.length;
                                            setPreviewPosterIndex(newIdx);
                                            setPreviewSuccessPoster(successStudents[newIdx]);
                                        }}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full transition-all backdrop-blur-sm"
                                        title="Previous poster"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newIdx = (previewPosterIndex + 1) % successStudents.length;
                                            setPreviewPosterIndex(newIdx);
                                            setPreviewSuccessPoster(successStudents[newIdx]);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full transition-all backdrop-blur-sm"
                                        title="Next poster"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default StudentAnnouncements;
