import { useState, useEffect, useContext } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, isSameDay, parseISO } from 'date-fns';
import api from '../utils/api';
import AuthContext from '../context/AuthContext';
import Modal from '../components/Modal';
import { FileText, Calendar as CalendarIcon, CheckCircle, AlertCircle, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { toast } from 'react-toastify';

const StudentReport = () => {
    const { user } = useContext(AuthContext);
    const [date, setDate] = useState(new Date());
    const [reports, setReports] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [studentData, setStudentData] = useState(null);
    const [languages, setLanguages] = useState([]);
    const [topics, setTopics] = useState([]);

    const [formData, setFormData] = useState({
        languageIds: [],
        topicIds: [],
        projectWorkTitles: [],
        description: ''
    });
    const [expandedLanguages, setExpandedLanguages] = useState([]);
    const [newProjectWorkTitle, setNewProjectWorkTitle] = useState('');
    const [ongoingProjectWorkTitles, setOngoingProjectWorkTitles] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, reportsRes] = await Promise.all([
                    api.get('/students/me'),
                    api.get('/reports/student')
                ]);
                setStudentData(profileRes.data);
                setReports(reportsRes.data.data);
                setLanguages(profileRes.data.allowedLanguageIds || []);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load report data');
            }
        };
        fetchData();
    }, []);

    const computeOngoingProjects = (reportsList) => {
        const relevantReports = [...reportsList]
            .filter(r => r.projectWorkTitles && Array.isArray(r.projectWorkTitles) && r.projectWorkTitles.length > 0)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const projectState = {};

        for (let i = 0; i < relevantReports.length; i++) {
            const report = relevantReports[i];
            const reportDate = new Date(report.date);
            const currentTitles = report.projectWorkTitles.map(t => t.trim()).filter(Boolean);
            const previousTitles = i > 0 ? (relevantReports[i - 1].projectWorkTitles || []).map(t => t.trim()) : [];
            const newTitles = currentTitles.filter(title => !previousTitles.includes(title));

            currentTitles.forEach(title => {
                const normalized = title;
                if (!projectState[normalized] || (projectState[normalized].endDate && !projectState[normalized].ongoing)) {
                    projectState[normalized] = {
                        title: normalized,
                        startDate: reportDate,
                        endDate: null,
                        ongoing: true,
                        lastActive: reportDate
                    };
                } else {
                    projectState[normalized] = {
                        ...projectState[normalized],
                        ongoing: true,
                        lastActive: reportDate
                    };
                }
            });

            if (newTitles.length > 0) {
                Object.keys(projectState).forEach(existing => {
                    if (!currentTitles.includes(existing) && projectState[existing].ongoing) {
                        const endDay = new Date(reportDate);
                        endDay.setDate(endDay.getDate() - 1);
                        projectState[existing] = {
                            ...projectState[existing],
                            endDate: endDay,
                            ongoing: false
                        };
                    }
                });
            }
        }

        return Object.values(projectState)
            .filter(p => p.ongoing)
            .map(p => p.title);
    };

    useEffect(() => {
        const filteredReports = formData.languageIds.length > 0 
            ? reports.filter(r => {
                const multiIds = Array.isArray(r.languageIds) ? r.languageIds.map(l => (l?._id || l)?.toString()) : [];
                const legacyId = (r.languageId?._id || r.languageId || '')?.toString();
                return formData.languageIds.some(id => id === legacyId || multiIds.includes(id));
              }) 
            : reports;
        setOngoingProjectWorkTitles(computeOngoingProjects(filteredReports));
    }, [reports, formData.languageIds]);

    useEffect(() => {
        if (formData.languageIds.length > 0) {
            const fetchTopics = async () => {
                try {
                    const { data } = await api.get(`/topics?languageId=${formData.languageIds.join(',')}`);
                    setTopics(data);
                } catch (error) {
                    console.error('Error fetching topics:', error);
                }
            };
            fetchTopics();
        } else {
            setTopics([]);
        }
    }, [formData.languageIds]);

    const toggleLanguage = (langId) => {
        setFormData(prev => {
            const already = prev.languageIds.includes(langId);
            const newLanguageIds = already
                ? prev.languageIds.filter(id => id !== langId)
                : [...prev.languageIds, langId];
            
            let newTopicIds = prev.topicIds;
            if (already) {
                // If removing a language, remove its topics too
                const langTopics = topics.filter(t => (t.languageId?._id || t.languageId) === langId);
                const langTopicIds = langTopics.map(t => t._id);
                newTopicIds = prev.topicIds.filter(id => !langTopicIds.includes(id));
            }

            return {
                ...prev,
                languageIds: newLanguageIds,
                topicIds: newTopicIds,
                projectWorkTitles: already ? prev.projectWorkTitles : prev.projectWorkTitles // keep project work titles for now or reset if appropriate
            };
        });
        
        // Auto-expand if newly selected
        if (!formData.languageIds.includes(langId)) {
            setExpandedLanguages(prev => [...new Set([...prev, langId])]);
        }
        
        setNewProjectWorkTitle('');
    };

    const toggleExpand = (langId) => {
        setExpandedLanguages(prev => 
            prev.includes(langId) 
                ? prev.filter(id => id !== langId)
                : [...prev, langId]
        );
    };

    const selectAllTopicsForLanguage = (langId, topicList) => {
        const langTopicIds = topicList.map(t => t._id);
        setFormData(prev => {
            const otherTopicIds = prev.topicIds.filter(id => !langTopicIds.includes(id));
            const allSelected = langTopicIds.every(id => prev.topicIds.includes(id));
            
            const newTopicIds = allSelected 
                ? otherTopicIds // Deselect all for this language
                : [...new Set([...prev.topicIds, ...langTopicIds])]; // Select all for this language

            return { ...prev, topicIds: newTopicIds };
        });
    };

    const toggleTopic = (topicId) => {
        const projectTopic = topics.find(t => t._id === topicId && t.name?.toLowerCase() === 'project work');
        const wasSelected = formData.topicIds.includes(topicId);

        setFormData(prev => {
            const already = prev.topicIds.includes(topicId);
            const newTopicIds = already
                ? prev.topicIds.filter(id => id !== topicId)
                : [...prev.topicIds, topicId];

            const projectWorkDeselected = projectTopic && already;

            return {
                ...prev,
                topicIds: newTopicIds,
                projectWorkTitles: projectWorkDeselected ? [] : prev.projectWorkTitles
            };
        });

        if (projectTopic && wasSelected) {
            setNewProjectWorkTitle('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const selectedLanguages = languages.filter(l => formData.languageIds.includes(l._id));
        const languageName = selectedLanguages.map(l => l.name).join(', ');
        
        const selectedTopics = topics.filter(t => formData.topicIds.includes(t._id));
        const isProjectWorkSelected = selectedTopics.some(t => t.name?.toLowerCase() === 'project work');
        const selectedProjectWorkTitles = Array.isArray(formData.projectWorkTitles) ? formData.projectWorkTitles.filter(Boolean) : [];
        const finalProjectWorkTitles = [...new Set([...selectedProjectWorkTitles, ...[newProjectWorkTitle.trim()].filter(Boolean)])];

        if (formData.languageIds.length === 0 || formData.topicIds.length === 0 || !formData.description) {
            toast.warning('Please select at least one language, one topic, and provide a description');
            return;
        }

        if (isProjectWorkSelected && finalProjectWorkTitles.length === 0) {
            toast.warning('Please select or enter a Project Work Title when Project Work topic is selected.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                date: format(new Date(), 'yyyy-MM-dd'),
                googleAccessToken: user?.googleAccessToken,
                languageIds: formData.languageIds,
                languageName,
                topicIds: formData.topicIds,
                topicNames: selectedTopics.map(t => t.name).join(', '),
                projectWorkTitles: finalProjectWorkTitles,
                description: formData.description
            };

            if (user?.googleId && !user?.googleAccessToken) {
                toast.warning('Note: Email might not send. Please Logout and Login again to grant email permissions.');
            }

            await api.post('/reports', payload);
            toast.success('Report submitted successfully');
            setIsModalOpen(false);
            setFormData({ languageIds: [], topicIds: [], projectWorkTitles: [], description: '' });
            setNewProjectWorkTitle('');

            // Refresh reports
            const { data } = await api.get('/reports/student');
            setReports(data.data);
            
            // Redirect to Gmail Sent folder after successful submission
            window.open('https://mail.google.com/mail/u/0/#sent', '_blank');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit report');
        } finally {
            setLoading(false);
        }
    };

    const getReportForDate = (d) => {
        return reports.find(r => isSameDay(parseISO(r.date), d));
    };

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const report = getReportForDate(date);
            if (report) {
                return (
                    <div className="mt-1 flex flex-col items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mb-1"></div>
                        <div className="text-[10px] leading-tight text-indigo-600 font-bold hidden sm:block truncate w-full px-1 text-center">
                            {report.languageIds && report.languageIds.length > 0 
                                ? report.languageIds.map(l => l?.name).filter(Boolean).join(', ')
                                : report.languageId?.name}
                        </div>
                        <div className="text-[10px] leading-tight text-gray-500 hidden sm:block truncate w-full px-1 text-center">
                            {Array.isArray(report.topicIds)
                                ? report.topicIds.map(t => t?.name).filter(Boolean).join(', ')
                                : report.topicIds?.name}
                        </div>
                    </div>
                );
            }
        }
        return null;
    };

    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const report = getReportForDate(date);
            const classes = [];
            if (report) classes.push('report-submitted-tile');
            if (date.getDay() === 0) classes.push('sunday-tile');
            return classes.join(' ');
        }
        return null;
    };

    const isTodaySubmitted = getReportForDate(new Date());

    return (
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <CalendarIcon className="w-8 h-8 text-indigo-600" />
                            Daily Report
                        </h1>
                        <p className="text-gray-500 mt-1">Track your daily progress and learning milestones.</p>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        disabled={isTodaySubmitted}
                        className={`
                            px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2
                            ${isTodaySubmitted
                                ? 'bg-green-100 text-green-700 cursor-not-allowed shadow-none'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95'}
                        `}
                    >
                        {isTodaySubmitted ? (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Today's Report Submitted
                            </>
                        ) : (
                            <>
                                <FileText className="w-5 h-5" />
                                Today Report
                            </>
                        )}
                    </button>
                </div>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-4 sm:p-8">
                    <style>{`
                        .react-calendar {
                            width: 100% !important;
                            border: none !important;
                            font-family: inherit !important;
                        }
                        .react-calendar__navigation {
                            margin-bottom: 2rem !important;
                        }
                        .react-calendar__navigation button {
                            min-width: 44px !important;
                            background: none !important;
                            font-size: 1.25rem !important;
                            font-weight: 700 !important;
                            color: #4f46e5 !important;
                            border-radius: 12px !important;
                            transition: all 0.2s !important;
                        }
                        .react-calendar__navigation button:hover {
                            background-color: #f3f4f6 !important;
                        }
                        .react-calendar__month-view__weekdays {
                            font-weight: 700 !important;
                            text-transform: uppercase !important;
                            font-size: 0.875rem !important;
                            color: #6b7280 !important;
                            padding-bottom: 1rem !important;
                        }
                        .react-calendar__month-view__days__day {
                            padding: 1.5rem 0.5rem !important;
                            font-size: 1.125rem !important;
                            transition: all 0.2s !important;
                        }
                        .react-calendar__tile {
                            border-radius: 16px !important;
                            position: relative !important;
                        }
                        .react-calendar__tile--now {
                            background: #eef2ff !important;
                            color: #4f46e5 !important;
                            font-weight: 800 !important;
                        }
                        .react-calendar__tile--active {
                            background: #4f46e5 !important;
                            color: white !important;
                            box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4) !important;
                        }
                        .react-calendar__tile:enabled:hover div,
                        .react-calendar__tile:enabled:hover abbr {
                            color: white !important;
                        }
                        .react-calendar__tile:enabled:hover .w-2 {
                            background-color: white !important;
                        }
                        .react-calendar__tile--active div {
                            color: white !important;
                        }
                        .react-calendar__tile--active .w-2 {
                            background-color: white !important;
                        }
                        .react-calendar__tile--active:enabled:hover, .react-calendar__tile--active:enabled:focus {
                            background: #4338ca !important;
                        }
                        .report-submitted-tile {
                            background-color: #f0fdf4 !important;
                        }
                        .report-submitted-tile abbr {
                            color: #166534 !important;
                            font-weight: 700 !important;
                        }
                        .report-submitted-tile div {
                            color: #166534 !important;
                            opacity: 0.9;
                        }
                        .report-submitted-tile .w-2 {
                            background-color: #22c55e !important;
                        }
                        .report-submitted-tile:enabled:hover div,
                        .report-submitted-tile:enabled:hover abbr {
                            color: black !important;
                        }
                        .report-submitted-tile:enabled:hover .w-2 {
                            background-color: black !important;
                        }
                        /* Active tile hover should override submitted tile hover */
                        .react-calendar__tile--active:enabled:hover div,
                        .react-calendar__tile--active:enabled:hover abbr {
                            color: white !important;
                        }
                        .react-calendar__tile--active:enabled:hover .w-2 {
                            background-color: white !important;
                        }
                        .react-calendar__month-view__days__day--neighboringMonth {
                            color: #d1d5db !important;
                        }
                        /* Reset weekend headers/days, then specifically color Sunday */
                        .react-calendar__month-view__weekdays__weekday--weekend abbr {
                            color: #6b7280 !important;
                        }
                        .react-calendar__month-view__weekdays__weekday--weekend:last-child abbr {
                            color: #ef4444 !important;
                        }
                        .react-calendar__month-view__days__day--weekend {
                            color: #374151 !important;
                        }
                        .sunday-tile:not(.react-calendar__tile--active) {
                            color: #ef4444 !important;
                        }
                        .sunday-tile:not(.react-calendar__tile--active) abbr {
                            color: #ef4444 !important;
                        }
                    `}</style>
                    <Calendar
                        onChange={setDate}
                        value={date}
                        tileContent={tileContent}
                        tileClassName={tileClassName}
                    />
                </div>
            </div>

            {/* Submission Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Submit Today's Report"
            >
                <form onSubmit={handleSubmit} className="space-y-6 p-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Student Name</label>
                            <input
                                type="text"
                                value={studentData?.name || ''}
                                readOnly
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
                            <input
                                type="text"
                                value={format(new Date(), 'dd MMM yyyy')}
                                readOnly
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Language(s)
                            <span className="ml-2 text-xs text-indigo-500 font-normal">
                                ({formData.languageIds.length} selected)
                            </span>
                        </label>
                        <div className="border border-gray-300 rounded-xl p-3 max-h-40 overflow-y-auto grid grid-cols-2 gap-2">
                            {languages.map(lang => (
                                <label key={lang._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                    <input
                                        type="checkbox"
                                        checked={formData.languageIds.includes(lang._id)}
                                        onChange={() => toggleLanguage(lang._id)}
                                        className="w-4 h-4 accent-indigo-600"
                                    />
                                    <span className="text-sm text-gray-700">{lang.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Topics Grouped by Language
                            {formData.languageIds.length > 0 && (
                                <span className="ml-2 text-xs text-indigo-500 font-normal">
                                    ({formData.topicIds.length} selected)
                                </span>
                            )}
                        </label>
                        {formData.languageIds.length === 0 ? (
                            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
                                <Layers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">Please select at least one language to see topics</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {languages.filter(l => formData.languageIds.includes(l._id)).map(lang => {
                                    const langTopics = topics.filter(t => (t.languageId?._id || t.languageId) === lang._id);
                                    const isExpanded = expandedLanguages.includes(lang._id);
                                    const selectedCount = langTopics.filter(t => formData.topicIds.includes(t._id)).length;
                                    const isAllSelected = langTopics.length > 0 && selectedCount === langTopics.length;

                                    return (
                                        <div key={lang._id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">
                                            {/* Language Header */}
                                            <div 
                                                className={`flex items-center justify-between px-4 py-3 cursor-pointer select-none ${isExpanded ? 'bg-indigo-50/50 border-b border-indigo-100' : 'bg-white'}`}
                                                onClick={() => toggleExpand(lang._id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded-lg ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <h4 className={`text-sm font-bold ${isExpanded ? 'text-indigo-900' : 'text-gray-700'}`}>
                                                            {lang.name}
                                                        </h4>
                                                        {selectedCount > 0 && (
                                                            <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">
                                                                {selectedCount} topic{selectedCount !== 1 ? 's' : ''} selected
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {isExpanded && langTopics.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            selectAllTopicsForLanguage(lang._id, langTopics);
                                                        }}
                                                        className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-800 bg-white px-2 py-1 rounded border border-indigo-200"
                                                    >
                                                        {isAllSelected ? 'Deselect All' : 'Select All'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Topics List (Collapsible Content) */}
                                            {isExpanded && (
                                                <div className="p-2 bg-white max-h-60 overflow-y-auto custom-scrollbar">
                                                    {langTopics.length === 0 ? (
                                                        <div className="py-4 text-center text-xs text-gray-400 italic">
                                                            No topics found for this language.
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-1 gap-1">
                                                            {langTopics.map(topic => (
                                                                <label
                                                                    key={topic._id}
                                                                    className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                                                                        formData.topicIds.includes(topic._id)
                                                                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                                                            : 'hover:bg-gray-50 text-gray-600 border border-transparent'
                                                                    }`}
                                                                >
                                                                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                                                                        formData.topicIds.includes(topic._id)
                                                                            ? 'bg-indigo-600 border-indigo-600 text-white'
                                                                            : 'bg-white border-gray-300'
                                                                    }`}>
                                                                        {formData.topicIds.includes(topic._id) && <CheckCircle className="w-3.5 h-3.5" />}
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={formData.topicIds.includes(topic._id)}
                                                                            onChange={() => toggleTopic(topic._id)}
                                                                            className="hidden"
                                                                        />
                                                                    </div>
                                                                    <span className={`text-sm ${formData.topicIds.includes(topic._id) ? 'font-bold' : 'font-medium'}`}>
                                                                        {topic.name}
                                                                    </span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {formData.topicIds.some(id => topics.find(t => t._id === id && t.name?.toLowerCase() === 'project work')) && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Ongoing Project Work (select one or more)</label>
                                {ongoingProjectWorkTitles.length === 0 ? (
                                    <p className="text-sm text-gray-500">No ongoing project titles found yet.</p>
                                ) : (
                                    <div className="border border-gray-300 rounded-xl p-3 max-h-48 overflow-y-auto">
                                        {ongoingProjectWorkTitles.map(title => (
                                            <label key={title} className="flex items-center gap-2 mb-2 last:mb-0">
                                                <input
                                                    type="checkbox"
                                                    value={title}
                                                    checked={formData.projectWorkTitles.includes(title)}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setFormData(prev => {
                                                            const current = Array.isArray(prev.projectWorkTitles) ? [...prev.projectWorkTitles] : [];
                                                            if (checked) {
                                                                return { ...prev, projectWorkTitles: [...new Set([...current, title])] };
                                                            } else {
                                                                return { ...prev, projectWorkTitles: current.filter(t => t !== title) };
                                                            }
                                                        });
                                                    }}
                                                    className="h-4 w-4 accent-indigo-600"
                                                />
                                                <span className="text-sm text-gray-700">{title}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Project Work Title</label>
                                <input
                                    type="text"
                                    value={newProjectWorkTitle}
                                    onChange={(e) => setNewProjectWorkTitle(e.target.value)}
                                    placeholder="Enter new project work title..."
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">If entering a new title, previous project(s) will be completed automatically.</p>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                            rows="5"
                            placeholder="Describe what you worked on today, challenges faced, and goals achieved..."
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none"
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-4 mt-8">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`
                                px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg flex items-center gap-2
                                ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-95'}
                            `}
                        >
                            {loading && (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            Submit Report
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default StudentReport;
