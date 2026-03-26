import React, { useState, useEffect } from 'react';
import { Eye, FileText, BarChart2, X, Book, User, Calendar, Clock, ChevronRight } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import api from '../utils/api';

const StudentDetailModal = ({ student, onClose }) => {
    const [activeTab, setActiveTab] = useState('submission'); // 'submission', 'report', 'cpc'
    const [loading, setLoading] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [reports, setReports] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const [cpcData, setCpcData] = useState([]);
    const [projectCpcData, setProjectCpcData] = useState([]);
    const [languageTopics, setLanguageTopics] = useState([]);

    useEffect(() => {
        if (student) {
            fetchData();
        }
    }, [student, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'submission') {
                const { data } = await api.get(`/submissions/student/${student._id}`);
                setSubmissions(data);
            } else if (activeTab === 'report' || activeTab === 'cpc') {
                const { data } = await api.get(`/reports/faculty?studentId=${student._id}`);
                const studentReports = data.submitted || [];
                setReports(studentReports.sort((a, b) => new Date(b.date) - new Date(a.date)));

                if (activeTab === 'cpc' && selectedLanguage) {
                    processCPC(studentReports, selectedLanguage._id, languageTopics);
                }
            }
        } catch (error) {
            console.error('Error fetching student details:', error);
        } finally {
            setLoading(false);
        }
    };

    const processCPC = (allReports, langId, allTopics = []) => {
        const normalizedLangId = String(langId || '');
        const langReports = allReports.filter(r => {
            const reportLangId = String(r.languageId?._id || r.languageId || '');
            return reportLangId === normalizedLangId;
        });
        
        // Use provided topics or fallback to empty
        const topicsToShow = allTopics.length > 0 ? allTopics : [];
        if (topicsToShow.length === 0 && langReports.length === 0) {
            setCpcData([]);
            return;
        }

        const sortedAll = [...allReports].sort((a, b) => new Date(b.date) - new Date(a.date));
        const globalLatestDate = sortedAll.length > 0 ? sortedAll[0].date : null;

        const calculateDays = (start, end) => {
            const startDate = parseISO(start);
            const endDate = end ? parseISO(end) : new Date();
            return differenceInDays(endDate, startDate) + 1;
        };

        // If we have topics, map them. If not (fallback for safety), group by reports as before.
        let topicRows = [];

        if (topicsToShow.length > 0) {
            topicRows = topicsToShow
                .filter(topic => topic.name?.toLowerCase() !== 'project work')
                .map(topic => {
                    const topicId = topic._id;
                    const reportsForTopic = langReports.filter(r => {
                        const reportTopicIds = Array.isArray(r.topicIds) 
                            ? r.topicIds.map(t => String(t?._id || t))
                            : [];
                        return reportTopicIds.some(id => String(topicId) === id);
                    });
                    
                    if (reportsForTopic.length === 0) {
                        return {
                            topicId,
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
                        topicId,
                        topicName: topic.name,
                        order: topic.order ?? 999,
                        startDate,
                        endDate,
                        totalDays,
                        isStarted: true
                    };
                });
        } else {
            // Fallback: group by available reports (old logic)
            const topicGroups = {};
            langReports.forEach(report => {
                const topicNames = getReportTopicNames(report);
                if (topicNames?.toLowerCase().includes('project work')) {
                    return;
                }

                // Use first topic id for grouping if present
                const topicId = Array.isArray(report.topicIds) && report.topicIds.length > 0
                    ? report.topicIds[0]?._id || report.topicIds[0]
                    : (report.topicId?._id || report.topicId);
                if (!topicGroups[topicId]) {
                    topicGroups[topicId] = {
                        topicId: topicId,
                        topicName: topicNames,
                        order: (Array.isArray(report.topicIds) && report.topicIds[0]?.order) || report.topicId?.order || 999,
                        reports: []
                    };
                }
                topicGroups[topicId].reports.push(report);
            });

            topicRows = Object.values(topicGroups).map(group => {
                const sortedGroupReps = [...group.reports].sort((a,b) => new Date(a.date) - new Date(b.date));
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
                    topicId: group.topicId,
                    topicName: group.topicName,
                    order: group.order,
                    startDate,
                    endDate,
                    totalDays,
                    isStarted: true
                };
            });
        }

        // Sort rows by Topic Order
        const sortedRows = [...topicRows].sort((a, b) => a.order - b.order);

        // Assign 'No.' based on syllabus order
        setCpcData(sortedRows.map((row, idx) => ({ ...row, no: idx + 1 })));

        // Build project work rows in same style
        const sortedProjectReports = [...langReports].sort((a,b) => new Date(a.date) - new Date(b.date));
        const projectState = {};

        sortedProjectReports.forEach((report, index) => {
            const current = (report.projectWorkTitles || []).map(t => t?.trim()).filter(Boolean);
            const prev = index > 0 ? (sortedProjectReports[index - 1].projectWorkTitles || []).map(t => t?.trim()).filter(Boolean) : [];

            // Close titles that disappeared
            Object.keys(projectState).forEach(title => {
                if (projectState[title].ongoing && !current.includes(title) && projectState[title].startDate) {
                    const endDate = new Date(report.date);
                    endDate.setDate(endDate.getDate() - 1);
                    projectState[title] = { ...projectState[title], endDate: endDate.toISOString().split('T')[0], ongoing: false };
                }
            });

            // Start or continue current titles
            current.forEach(title => {
                if (!projectState[title] || !projectState[title].ongoing) {
                    projectState[title] = { title, startDate: report.date, endDate: null, ongoing: true };
                }
            });
        });

        const projectRows = Object.values(projectState).map((item, idx) => {
            const endDate = item.endDate;
            const start = parseISO(item.startDate);
            const end = endDate ? parseISO(endDate) : new Date();
            const totalDays = differenceInDays(end, start) + 1;
            return {
                no: idx + 1,
                projectTitle: item.title,
                startDate: item.startDate,
                endDate: item.endDate,
                totalDays,
                isStarted: !!item.startDate,
                ongoing: !item.endDate
            };
        });

        setProjectCpcData(projectRows);
    };

    const getReportTopicNames = (report) => {
        if (Array.isArray(report.topicIds) && report.topicIds.length > 0) {
            return report.topicIds.map(topic => topic?.name || 'Unknown Topic').join(', ');
        }
        if (report.topicId) {
            return report.topicId?.name || String(report.topicId) || 'Unknown Topic';
        }
        return 'Unknown Topic';
    };

    const getLanguageOverallDuration = (langId) => {
        const normalizedLangId = String(langId || '');
        const langReports = reports
            .filter(r => String(r.languageId?._id || r.languageId || '') === normalizedLangId)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (langReports.length === 0) return 0;

        const firstDate = parseISO(langReports[0].date);
        const lastDate = parseISO(langReports[langReports.length - 1].date);
        if (isNaN(firstDate) || isNaN(lastDate)) return 0;

        return differenceInDays(lastDate, firstDate) + 1;
    };

    useEffect(() => {
        const fetchTopics = async () => {
            if (activeTab === 'cpc' && selectedLanguage) {
                try {
                    const { data } = await api.get(`/topics?languageId=${selectedLanguage._id}`);
                    setLanguageTopics(data || []);
                    processCPC(reports, selectedLanguage._id, data);
                } catch (error) {
                    console.error('Error fetching language topics:', error);
                    processCPC(reports, selectedLanguage._id, []);
                }
            }
        };
        fetchTopics();
    }, [selectedLanguage]);

    const renderSubmissionTab = () => (
        <div className="space-y-6">
            {submissions.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Eye className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-lg">No submissions yet</p>
                </div>
            ) : (
                submissions.map((sub, idx) => (
                    <div key={sub._id} className="border border-gray-200 rounded-lg p-5 hover:border-indigo-200 transition-all bg-gray-50/50">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded">Q{idx + 1}</span>
                                <h3 className="font-bold text-gray-900">{sub.questionId?.question || 'Unknown Question'}</h3>
                            </div>
                            <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border whitespace-nowrap ml-3 font-medium">
                                {format(parseISO(sub.submittedAt), 'dd MMM yyyy, hh:mm a')}
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6 mt-4">
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Answer</h4>
                                <div className="bg-white p-3 rounded border text-sm text-gray-800 whitespace-pre-wrap min-h-[60px]">
                                    {sub.answerText}
                                </div>
                            </div>
                            {sub.imageUrl && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Attachment</h4>
                                    <a href={sub.imageUrl} target="_blank" rel="noopener noreferrer" className="block group relative rounded-lg overflow-hidden border">
                                        <img src={sub.imageUrl} alt="Submission" className="w-full h-32 object-cover group-hover:opacity-90 transition" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition">
                                            <span className="bg-white text-xs font-bold px-2 py-1 rounded shadow-sm">View Full</span>
                                        </div>
                                    </a>
                                </div>
                            )}
                        </div>
                        <div className="mt-3 flex gap-4 text-[11px] text-gray-500 pt-3 border-t">
                            <span className="flex items-center gap-1"><Book className="w-3 h-3" /> <span className="font-semibold text-gray-700">Language:</span> {sub.languageId?.name || '-'}</span>
                            <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> <span className="font-semibold text-gray-700">Topic:</span> {sub.topicId?.name || '-'}</span>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderReportTab = () => (
        <div className="space-y-6">
            {reports.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-lg">No reports submitted yet</p>
                </div>
            ) : (
                reports.map((report) => (
                    <div key={report._id} className="border border-gray-200 rounded-lg p-5 hover:border-indigo-200 transition-all bg-gray-50/50">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                {/* <div className="p-1 px-2 bg-emerald-100 text-emerald-700 rounded text-xs font-bold uppercase tracking-wider">Report</div> */}
                                <h3 className="font-bold text-gray-900">{report.languageId?.name || '-'} - {getReportTopicNames(report)}</h3>
                            </div>
                            <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border font-medium">
                                {format(parseISO(report.date), 'dd MMM yyyy')}
                            </div>
                        </div>
                        <div className="mt-4">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h4>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 text-sm text-gray-700 leading-relaxed italic">
                                "{report.description}"
                            </div>
                        </div>
                        {/* <div className="mt-4 flex gap-4 text-[11px] text-gray-500 pt-3 border-t font-medium">
                            <span className="flex items-center gap-1"><Book className="w-3 h-3" /> <span className="text-gray-400">Language:</span> {report.languageId?.name || '-'}</span>
                        </div> */}
                    </div>
                ))
            )}
        </div>
    );

    const renderCPCTab = () => {
        const totalSum = cpcData.reduce((acc, row) => acc + row.totalDays, 0);

        return (
            <div className="space-y-6">
                {!selectedLanguage ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {student.allowedLanguageIds?.map(lang => (
                            <button
                                key={lang._id}
                                onClick={() => setSelectedLanguage(lang)}
                                className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <Book className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800">{lang.name}</div>
                                        <div className="text-xs text-gray-500">Duration: {getLanguageOverallDuration(lang._id)} {getLanguageOverallDuration(lang._id) === 1 ? 'Day' : 'Days'}</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                            </button>
                        ))}
                        {(!student.allowedLanguageIds || student.allowedLanguageIds.length === 0) && (
                            <div className="col-span-full text-center py-10 text-gray-400 italic">No assigned languages found.</div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <button onClick={() => setSelectedLanguage(null)} className="text-sm font-bold text-indigo-600 flex items-center gap-1 hover:underline mb-2">
                            ← Back to Languages
                        </button>
                        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">No.</th>
                                        <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Topic</th>
                                        <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Start Date</th>
                                        <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">End Date</th>
                                        <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Days</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {cpcData.length === 0 ? (
                                        <tr><td colSpan="5" className="px-4 py-10 text-center text-gray-400 italic text-sm">No CPC data for this language.</td></tr>
                                    ) : (
                                        cpcData.map((row) => (
                                            <tr key={row.no} className="hover:bg-indigo-50/30 transition-colors">
                                                <td className="px-4 py-3 text-xs font-bold text-gray-400">{row.no}</td>
                                                <td className="px-4 py-3 text-sm font-bold text-gray-800">{row.topicName}</td>
                                                <td className="px-4 py-3 text-xs font-semibold text-gray-700">{row.startDate ? format(parseISO(row.startDate), 'dd MMM yyyy') : '-'}</td>
                                                <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                                                    {row.endDate ? format(parseISO(row.endDate), 'dd MMM yyyy') : (
                                                        row.isStarted ? (
                                                            <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest">Ongoing</span>
                                                        ) : '-'
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                                                        {row.totalDays}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {projectCpcData && projectCpcData.length > 0 && (
                            <div className="mt-6 bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 font-bold text-gray-700">Project Work</div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">No.</th>
                                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Project Name</th>
                                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Start Date</th>
                                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">End Date</th>
                                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Days</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {projectCpcData.map((row) => (
                                                <tr key={`${row.projectTitle}-${row.no}`} className="hover:bg-indigo-50/30 transition-colors">
                                                    <td className="px-4 py-3 text-xs font-bold text-gray-400">{row.no}</td>
                                                    <td className="px-4 py-3 text-sm font-bold text-gray-800">{row.projectTitle}</td>
                                                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">{row.startDate ? format(parseISO(row.startDate), 'dd MMM yyyy') : '-'}</td>
                                                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                                                        {row.endDate ? format(parseISO(row.endDate), 'dd MMM yyyy') : (
                                                            row.ongoing ? <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">Ongoing</span> : '-'
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">{row.totalDays}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
                {/* Custom Header */}
                <div className="bg-indigo-600 p-6 flex justify-between items-start text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                            <User className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">{student?.name}</h2>
                            <p className="text-indigo-100 text-sm font-medium flex items-center gap-2 mt-0.5">
                                {student?.batchTime} Batch • {student?.courseId?.name}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tab Switcher */}
                <div className="flex px-6 bg-gray-50 border-b border-gray-200">
                    {[
                        { id: 'submission', label: 'Submissions', icon: Eye },
                        { id: 'report', label: 'Daily Reports', icon: FileText },
                        { id: 'cpc', label: 'CPC Progress', icon: BarChart2 }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setSelectedLanguage(null); }}
                            className={`flex items-center gap-2 py-4 px-6 border-b-2 font-bold text-sm transition-all ${activeTab === tab.id
                                ? 'border-indigo-600 text-indigo-600 bg-white shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-300'}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-white">
                    {loading && !reports.length && !submissions.length && !selectedLanguage ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
                            <p className="font-bold text-sm animate-pulse">Fetching records...</p>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-bottom-2 duration-300">
                            {activeTab === 'submission' && renderSubmissionTab()}
                            {activeTab === 'report' && renderReportTab()}
                            {activeTab === 'cpc' && renderCPCTab()}
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                {/* <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex gap-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-200/50 px-2 py-1 rounded">ID: {student?._id}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-200/50 px-2 py-1 rounded">{new Date().getFullYear()} Workbook Analytics</span>
                    </div>
                    <button onClick={onClose} className="px-6 py-2 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-95">
                        Close Overview
                    </button>
                </div> */}
            </div>
        </div>
    );
};

export default StudentDetailModal;
