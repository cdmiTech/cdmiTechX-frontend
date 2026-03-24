import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { ChevronDown, ChevronRight, Book, GripVertical } from 'lucide-react';
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

const SortableQuestionItem = ({ q, idx }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: q._id });

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
            className={`p-4 bg-white rounded-xl border border-gray-100 shadow-sm text-sm text-gray-700 flex items-start gap-4 hover:border-indigo-200 transition-colors cursor-grab active:cursor-grabbing ${isDragging ? 'bg-indigo-50 shadow-md border-indigo-300 ring-2 ring-indigo-500/20' : ''}`}
        >
            <span className="font-bold flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 text-xs shrink-0 mt-0.5 shadow-sm border border-indigo-100/50">
                Q{idx + 1}
            </span>
            <div className="pt-0.5 leading-relaxed w-full">
                <div className="mb-2 font-medium">
                    {q.question || <span className="italic text-gray-400 font-normal">Image attached Question</span>}
                </div>
                {q.imageUrl && (
                    <div className="mt-2 text-left">
                        <div className="inline-block rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50 p-1">
                            <img src={q.imageUrl} alt="Question" className="max-h-48 rounded-md object-contain hover:opacity-95 transition-opacity" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ViewWorkbooks = () => {
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [workbookData, setWorkbookData] = useState(null);
    const [topics, setTopics] = useState([]);
    const [questions, setQuestions] = useState([]);

    // Accordion state: { [topicId]: boolean }
    const [expandedTopics, setExpandedTopics] = useState({});

    // Language selection state for the "Card view"
    const [selectedLanguageId, setSelectedLanguageId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const fetchCourses = async () => {
            const { data } = await api.get('/courses');
            setCourses(data);
        };
        fetchCourses();
    }, []);

    // Use selectedCourse derived from state
    const selectedCourse = courses.find(c => c._id === selectedCourseId);

    // Reset language when course changes
    useEffect(() => {
        setSelectedLanguageId(null);
    }, [selectedCourseId]);

    // When language is selected, fetch topics and questions
    const fetchData = useCallback(async () => {
        if (!selectedLanguageId) return;
        try {
            const [topicsRes, questionsRes] = await Promise.all([
                api.get(`/topics?languageId=${selectedLanguageId}`),
                api.get(`/questions?languageId=${selectedLanguageId}`)
            ]);
            setTopics(topicsRes.data);
            setQuestions(questionsRes.data);
        } catch (error) {
            console.error('Error fetching topics/questions:', error);
        }
    }, [selectedLanguageId]);

    useEffect(() => {
        fetchData();
    }, [selectedLanguageId, fetchData]);

    const toggleTopic = (topicId) => {
        setExpandedTopics(prev => ({
            ...prev,
            [topicId]: !prev[topicId]
        }));
    };

    const getQuestionsByTopic = (topicId) => {
        return questions.filter(q => (q.topicId?._id || q.topicId) === topicId);
    };

    const handleDragEnd = async (event, topicId) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const topicQuestions = getQuestionsByTopic(topicId);
            const oldIndex = topicQuestions.findIndex((i) => i._id === active.id);
            const newIndex = topicQuestions.findIndex((i) => i._id === over.id);

            const newTopicQuestions = arrayMove(topicQuestions, oldIndex, newIndex);

            // Update local state for all questions
            const updatedQuestions = questions.map(q => {
                const topicIdOfQ = (q.topicId?._id || q.topicId);
                if (topicIdOfQ === topicId) {
                    const idx = newTopicQuestions.findIndex(nq => nq._id === q._id);
                    if (idx !== -1) {
                        return newTopicQuestions[idx];
                    }
                }
                return q;
            });

            // We need to re-sort the entire questions array to reflect the new move locally
            // A better way is to rebuild the questions array by replacing the topic's slice
            const otherQuestions = questions.filter(q => (q.topicId?._id || q.topicId) !== topicId);
            const finalQuestions = [...otherQuestions, ...newTopicQuestions];
            
            // Re-sort finalQuestions by their current implicit order if necessary, but actually we just want to update the global list
            // However, the backend needs the specific order.
            
            setQuestions(finalQuestions);

            // Update order in background
            const orderedIds = newTopicQuestions.map((item, index) => ({
                _id: item._id,
                order: index
            }));

            try {
                await api.patch('/questions/reorder', { questions: orderedIds });
            } catch (err) {
                console.error('Failed to update order:', err);
                fetchData(); // Restore if fails
            }
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">View Workbook</h1>
                <p className="text-gray-500 mt-1">Explore course structures, language tracks, and question modules.</p>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Select Course to View</label>
                <div className="relative w-full md:w-1/2">
                    <Book className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                    <select
                        className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm appearance-none cursor-pointer"
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                    >
                        <option value="">-- Select Course --</option>
                        {courses.map(course => (
                            <option key={course._id} value={course._id}>{course.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {!selectedCourseId && (
                <div className="text-center py-12 px-4 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
                    <p className="text-gray-500 font-medium">Please select a course to view its workbook structure.</p>
                </div>
            )}

            {selectedCourseId && (!selectedCourse || !selectedCourse.allowedLanguageIds || selectedCourse.allowedLanguageIds.length === 0) && (
                <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 shadow-sm flex items-center">
                    <p className="font-medium text-sm">No languages linked to this course. Please assign languages in the Course section first.</p>
                </div>
            )}

            {selectedCourse && selectedCourse.allowedLanguageIds?.length > 0 && (
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                        Mapped Language Tracks
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {selectedCourse.allowedLanguageIds.map(lang => {
                            const isSelected = selectedLanguageId === lang._id;
                            return (
                                <div
                                    key={lang._id}
                                    onClick={() => setSelectedLanguageId(lang._id)}
                                    className={`p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 flex items-center gap-3 ${isSelected
                                        ? 'border-indigo-600 bg-indigo-50/80 shadow-md shadow-indigo-100 transform -translate-y-1'
                                        : 'border-transparent bg-white shadow hover:border-indigo-200 hover:shadow-md'
                                        }`}
                                >
                                    <Book className={`w-5 h-5 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                                    <h3 className={`font-bold text-sm ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                                        {lang.name}
                                    </h3>
                                </div>
                            );
                        })}
                    </div>

                    {selectedLanguageId && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                            <div className="p-5 bg-gray-50/80 border-b border-gray-100">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    Topics & Questions Outline
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {topics.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <p className="text-gray-400 font-medium">No topics found for this language track.</p>
                                    </div>
                                ) : (
                                    topics.map(topic => {
                                        const topicQuestions = getQuestionsByTopic(topic._id);
                                        return (
                                            <div key={topic._id} className="group">
                                                <button
                                                    onClick={() => toggleTopic(topic._id)}
                                                    className="w-full flex items-center justify-between p-5 hover:bg-indigo-50/50 transition-colors"
                                                >
                                                    <span className="font-bold text-gray-800 text-left group-hover:text-indigo-700 transition-colors">{topic.name}</span>
                                                    <div className={`p-1.5 rounded-full bg-gray-100 transition-transform duration-300 ${expandedTopics[topic._id] ? 'rotate-180 bg-indigo-100 text-indigo-600' : 'text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                                                        <ChevronDown className="w-4 h-4" />
                                                    </div>
                                                </button>

                                                <div className={`overflow-hidden transition-all duration-300 ${expandedTopics[topic._id] ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                                    <div className="px-5 pb-5 pt-1 bg-gray-50/30">
                                                        <div className="space-y-3 pl-4 border-l-2 border-indigo-200">
                                                            {topicQuestions.length === 0 ? (
                                                                <p className="text-sm text-gray-400 italic py-2">No questions in this topic.</p>
                                                            ) : (
                                                                <DndContext
                                                                    sensors={sensors}
                                                                    collisionDetection={closestCenter}
                                                                    onDragEnd={(e) => handleDragEnd(e, topic._id)}
                                                                >
                                                                    <SortableContext
                                                                        items={topicQuestions.map(q => q._id)}
                                                                        strategy={verticalListSortingStrategy}
                                                                    >
                                                                        <div className="space-y-3">
                                                                            {topicQuestions.map((q, idx) => (
                                                                                <SortableQuestionItem key={q._id} q={q} idx={idx} />
                                                                            ))}
                                                                        </div>
                                                                    </SortableContext>
                                                                </DndContext>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ViewWorkbooks;
