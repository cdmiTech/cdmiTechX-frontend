import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, differenceInDays, parseISO } from 'date-fns';
import api from '../utils/api';
import { ArrowLeft, User, Book, Calendar, Clock } from 'lucide-react';

const CPCTable = () => {
    const { languageId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [allReports, setAllReports] = useState([]);
    const [languageReports, setLanguageReports] = useState([]);
    const [studentData, setStudentData] = useState(null);
    const [language, setLanguage] = useState(null);
    const [languageTopics, setLanguageTopics] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, reportsRes] = await Promise.all([
                    api.get('/students/me'),
                    api.get('/reports/student')
                ]);

                setStudentData(profileRes.data);
                const allReps = reportsRes.data.data || [];
                setAllReports(allReps);

                // Find current language
                const lang = profileRes.data.allowedLanguageIds?.find(l => l._id === languageId);
                setLanguage(lang);

                // Filter reports for this language
                const normalizedLanguageId = String(languageId || '');
                const langReps = allReps.filter(r => {
                    const reportLangId = String(r.languageId?._id || r.languageId || '');
                    return reportLangId === normalizedLanguageId;
                });
                setLanguageReports(langReps);
                // Fetch all topics for this language
                const topicsRes = await api.get(`/topics?languageId=${languageId}`);
                setLanguageTopics(topicsRes.data || []);
            } catch (error) {
                console.error('Error fetching CPC data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [languageId]);

    const normalizeDate = (value) => {
        if (!value) return null;
        if (value instanceof Date) return value;
        if (typeof value === 'string') {
            const parsed = parseISO(value);
            return isNaN(parsed) ? new Date(value) : parsed;
        }
        return new Date(value);
    };

    const calculateDays = (start, end) => {
        if (!start) return 0;
        const startDate = normalizeDate(start);
        const endDate = end ? normalizeDate(end) : new Date();
        if (!startDate || isNaN(startDate.getTime()) || !endDate || isNaN(endDate.getTime())) {
            return 0;
        }
        return differenceInDays(endDate, startDate) + 1;
    };

    const deriveProjectWorkRows = () => {
        const sortedLang = [...languageReports].sort((a, b) => new Date(a.date) - new Date(b.date));
        const projectReports = sortedLang.filter(r => Array.isArray(r.projectWorkTitles) && r.projectWorkTitles.length > 0);

        const projectState = {};

        for (let i = 0; i < projectReports.length; i++) {
            const report = projectReports[i];
            const thisDate = new Date(report.date);
            const currentTitles = report.projectWorkTitles
                .map(t => t?.trim())
                .filter(Boolean);
            const previousTitles = i > 0
                ? projectReports[i - 1].projectWorkTitles.map(t => t?.trim()).filter(Boolean)
                : [];
            const newTitles = currentTitles.filter(title => !previousTitles.includes(title));

            currentTitles.forEach(title => {
                if (!projectState[title] || (projectState[title].endDate && !projectState[title].ongoing)) {
                    projectState[title] = {
                        title,
                        startDate: report.date,
                        endDate: null,
                        ongoing: true
                    };
                } else {
                    projectState[title] = {
                        ...projectState[title],
                        ongoing: true
                    };
                }
            });

            if (newTitles.length > 0) {
                Object.keys(projectState).forEach(key => {
                    if (projectState[key].ongoing && !currentTitles.includes(key)) {
                        const endDate = new Date(thisDate);
                        endDate.setDate(endDate.getDate() - 1);
                        projectState[key] = {
                            ...projectState[key],
                            endDate: endDate.toISOString().split('T')[0],
                            ongoing: false
                        };
                    }
                });
            }
        }

        const projectRows = Object.values(projectState).map((row, idx) => {
            const endDate = row.endDate || null;
            const totalDays = row.startDate ? calculateDays(row.startDate, endDate || new Date()) : 0;

            return {
                no: idx + 1,
                projectTitle: row.title,
                startDate: row.startDate,
                endDate,
                totalDays,
                ongoing: row.ongoing
            };
        });

        return projectRows;
    };

    const processReports = () => {
        // Global latest date across ALL languages
        const sortedAll = [...allReports].sort((a, b) => new Date(b.date) - new Date(a.date));
        const globalLatestDate = sortedAll.length > 0 ? sortedAll[0].date : null;

        // Base list comes from all topics in the curriculum (except Project Work - shown in separate Project Work block)
        const topicRows = languageTopics
            .filter(topic => topic.name?.toLowerCase() !== 'project work')
            .map(topic => {
                const topicId = topic._id;
                const reportsForTopic = languageReports.filter(r => {
                    const ids = Array.isArray(r.topicIds)
                        ? r.topicIds.map(t => t?._id || t)
                        : [];
                    return ids.some(id => String(id) === String(topicId));
                });
            
            if (reportsForTopic.length === 0) {
                return {
                    topicId: topicId,
                    topicName: topic.name,
                    order: topic.order ?? 999,
                    startDate: null,
                    endDate: null,
                    totalDays: 0,
                    isStarted: false
                };
            }

            const sortedGroupReps = [...reportsForTopic].sort((a,b) => new Date(a.date) - new Date(b.date));
            const startDate = sortedGroupReps[0].date;
            const langLatestDate = sortedGroupReps[sortedGroupReps.length - 1].date;
            
            let endDate = null;
            let totalDays = 0;

            if (globalLatestDate && new Date(langLatestDate) < new Date(globalLatestDate)) {
                endDate = langLatestDate;
                totalDays = calculateDays(startDate, endDate);
            } else {
                totalDays = calculateDays(startDate, langLatestDate);
            }

            return {
                topicId: topicId,
                topicName: topic.name,
                order: topic.order ?? 999,
                startDate,
                endDate,
                totalDays,
                isStarted: true
            };
        });

        // Sort by Topic Order (syllabus order)
        const sortedRows = [...topicRows].sort((a, b) => a.order - b.order);

        // Assign 'No.' based on syllabus order
        return {
            topicRows: sortedRows.map((row, idx) => ({ ...row, no: idx + 1 })),
            projectRows: deriveProjectWorkRows()
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const { topicRows, projectRows } = processReports();
    const totalSum = topicRows.reduce((acc, row) => acc + row.totalDays, 0);
    const sortedLang = [...languageReports].sort((a, b) => new Date(a.date) - new Date(b.date));
    const overallStartDate = sortedLang.length > 0 ? sortedLang[0].date : null;
    const overallEndDate = sortedLang.length > 0 ? sortedLang[sortedLang.length - 1].date : null;
    const hasProjectTopic = languageTopics.some(t => t.name?.toLowerCase() === 'project work');
    const overallDays = overallStartDate && overallEndDate ? differenceInDays(parseISO(overallEndDate), parseISO(overallStartDate)) + 1 : 0;

    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => navigate('/cpc')}
                    className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 mb-5 transition-colors font-medium text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Selection
                </button>

                {/* Header Card */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-7 mt-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                <User className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Student Name</p>
                                <p className="text-base font-bold text-gray-800 truncate">{studentData?.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                <Book className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Language</p>
                                <p className="text-base font-bold text-gray-800 truncate">{language?.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                                <Calendar className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Start Date</p>
                                <p className="text-base font-bold text-gray-800">
                                    {overallStartDate ? format(parseISO(overallStartDate), 'dd MMM yyyy') : '-'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">End Date</p>
                                <p className="text-base font-bold text-gray-800">
                                    {overallEndDate ? format(parseISO(overallEndDate), 'dd MMM yyyy') : '-'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Duration (Overall)</p>
                                <p className="text-base font-bold text-gray-800">
                                    {overallDays > 0 ? `${overallDays} ${overallDays === 1 ? 'Day' : 'Days'}` : '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-4 py-3 text-[13px] font-bold text-gray-500 uppercase tracking-wider w-16">No.</th>
                                    <th className="px-4 py-3 text-[13px] font-bold text-gray-500 uppercase tracking-wider">Topic Name</th>
                                    <th className="px-4 py-3 text-[13px] font-bold text-gray-500 uppercase tracking-wider">Start Date</th>
                                    <th className="px-4 py-3 text-[13px] font-bold text-gray-500 uppercase tracking-wider">End Date</th>
                                    <th className="px-4 py-3 text-[13px] font-bold text-gray-500 uppercase tracking-wider text-center">Days</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {topicRows.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500 italic text-sm">
                                            No topics or report data found for this language.
                                        </td>
                                    </tr>
                                ) : (
                                    topicRows.map((row) => (
                                        <tr key={row.no} className="hover:bg-indigo-50/20 transition-colors group">
                                            <td className="px-4 py-3">
                                                <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                    {row.no}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-gray-800 text-sm">{row.topicName}</td>
                                            <td className="px-4 py-3 text-gray-600 text-sm">
                                                {row.startDate ? format(parseISO(row.startDate), 'dd MMM yyyy') : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 text-sm">
                                                {row.endDate ? format(parseISO(row.endDate), 'dd MMM yyyy') : (
                                                    row.isStarted ? (
                                                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Ongoing</span>
                                                    ) : '-'
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                                                    {row.totalDays} {row.totalDays === 1 ? 'Day' : 'Days'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {hasProjectTopic && (
                    <>
                        <div className="mt-8" />

                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 font-bold text-gray-700">Project Work</div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-4 py-3 text-[13px] font-bold text-gray-500 uppercase tracking-wider w-16">No.</th>
                                    <th className="px-4 py-3 text-[13px] font-bold text-gray-500 uppercase tracking-wider">Project Title</th>
                                    <th className="px-4 py-3 text-[13px] font-bold text-gray-500 uppercase tracking-wider">Start Date</th>
                                    <th className="px-4 py-3 text-[13px] font-bold text-gray-500 uppercase tracking-wider">End Date</th>
                                    <th className="px-4 py-3 text-[13px] font-bold text-gray-500 uppercase tracking-wider text-center">Days</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {projectRows.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500 italic text-sm">No project work entries yet.</td>
                                    </tr>
                                ) : (
                                    projectRows.map((row) => (
                                        <tr key={row.no} className="hover:bg-indigo-50/20 transition-colors group">
                                            <td className="px-4 py-3">
                                                <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                    {row.no}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-gray-800 text-sm">{row.projectTitle}</td>
                                            <td className="px-4 py-3 text-gray-600 text-sm">{row.startDate ? format(parseISO(row.startDate), 'dd MMM yyyy') : '-'}</td>
                                            <td className="px-4 py-3 text-gray-600 text-sm">{row.endDate ? format(parseISO(row.endDate), 'dd MMM yyyy') : (<span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Ongoing</span>)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                                                    {row.totalDays} {row.totalDays === 1 ? 'Day' : 'Days'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </> 
        )}
            </div>
        </div>
    );
};

export default CPCTable;
