import { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import AuthContext from '../context/AuthContext';
import { ChevronDown, ChevronRight, Upload, ArrowLeft, Download } from 'lucide-react';
import Modal from '../components/Modal';

const MyWorkbook = () => {
    const { user } = useContext(AuthContext);
    const [studentData, setStudentData] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState(null); // Full language object
    const [topics, setTopics] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [expandedTopics, setExpandedTopics] = useState({});

    // Submission Modal State
    const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
    const [currentQuestionForSubmission, setCurrentQuestionForSubmission] = useState(null);
    const [submissionData, setSubmissionData] = useState({
        answerText: '',
        imageUrl: ''
    });
    const [loading, setLoading] = useState(false);
    const [existingSubmissions, setExistingSubmissions] = useState({}); // Map questionId -> submission

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleDownload = async (url, fileName) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = fileName || 'question-image.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading image:', error);
            alert('Could not download image. Please try again or right-click to save.');
        }
    };

    useEffect(() => {
        const fetchMyProfile = async () => {
            try {
                const { data } = await api.get('/students/me');
                setStudentData(data);
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };
        fetchMyProfile();
    }, []);

    // Fetch existing submissions
    useEffect(() => {
        const fetchSubmissions = async () => {
            if (!studentData) return;
            try {
                const { data } = await api.get(`/submissions/my`);
                const subMap = {};
                data.forEach(sub => {
                    subMap[sub.questionId._id || sub.questionId] = sub;
                });
                setExistingSubmissions(subMap);
            } catch (error) {
                console.error('Error fetching submissions:', error);
            }
        };
        fetchSubmissions();
    }, [studentData]);


    useEffect(() => {
        if (!selectedLanguage) return;
        const fetchData = async () => {
            try {
                const [topicsRes, questionsRes] = await Promise.all([
                    api.get(`/topics?languageId=${selectedLanguage._id}`),
                    api.get(`/questions?languageId=${selectedLanguage._id}`)
                ]);
                setTopics(topicsRes.data);
                setQuestions(questionsRes.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchData();
    }, [selectedLanguage]);

    // Helper to check if a topic is completed
    const isTopicCompleted = (topicId) => {
        const topicQuestions = questions.filter(q => (q.topicId?._id || q.topicId) === topicId);
        if (topicQuestions.length === 0) return true;
        return topicQuestions.every(q => !!existingSubmissions[q._id]);
    };

    // Helper to calculate all topic enabled states in sequence
    const getTopicEnabledStates = () => {
        const states = {}; // Track { unlocked: bool, enabled: bool }

        topics.forEach((topic, index) => {
            const topicQuestions = questions.filter(q => (q.topicId?._id || q.topicId) === topic._id);
            const hasQuestions = topicQuestions.length > 0;

            // 1. Completion/History Check
            const currentAndFutureTopics = topics.slice(index);
            const hasHistory = currentAndFutureTopics.some(t => {
                const tQs = questions.filter(q => (q.topicId?._id || q.topicId) === t._id);
                return tQs.some(q => !!existingSubmissions[q._id]);
            });
            const completed = isTopicCompleted(topic._id);

            // 2. Determine "Unlocked" status (Basis for progression)
            let isUnlocked = false;
            if (index === 0) {
                isUnlocked = true; // Topic 1 is the starting point
            } else {
                const prevTopicId = topics[index - 1]._id;
                const prevUnlocked = states[prevTopicId].unlocked;
                const prevCompleted = isTopicCompleted(prevTopicId);
                // Sequential Rule: Unlocks if previous was unlocked AND is now completed
                isUnlocked = prevUnlocked && prevCompleted;
            }

            // Protection: If it was already traversed or completed, it must be unlocked
            if (hasHistory || completed) {
                isUnlocked = true;
            }

            // 3. Determine "Enabled" status (Interactive)
            // Rule: Topic must be Unlocked AND have at least one question
            states[topic._id] = {
                unlocked: isUnlocked,
                enabled: isUnlocked && hasQuestions
            };
        });

        // Flatten for the UI
        const finalStates = {};
        Object.keys(states).forEach(id => {
            finalStates[id] = states[id].enabled;
        });
        return finalStates;
    };

    const enabledStates = getTopicEnabledStates();

    const toggleTopic = (topicId, enabled) => {
        if (!enabled) return;
        setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
    };

    const openSubmissionModal = (question) => {
        // Guard: don't open modal if already submitted
        if (existingSubmissions[question._id]) return;

        setCurrentQuestionForSubmission(question);
        setSubmissionData({
            answerText: '',
            imageUrl: ''
        });
        setIsSubmissionOpen(true);
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmission = async (e) => {
        e.preventDefault();

        if (!submissionData.answerText.trim() && !selectedFile && !submissionData.imageUrl.trim()) {
            alert('Please provide either an answer text or upload an image.');
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('courseId', studentData.courseId._id);
        formData.append('languageId', selectedLanguage._id);
        formData.append('topicId', currentQuestionForSubmission.topicId._id || currentQuestionForSubmission.topicId);
        formData.append('questionId', currentQuestionForSubmission._id);
        formData.append('facultyId', studentData.facultyId._id || studentData.facultyId);
        formData.append('answerText', submissionData.answerText);

        if (selectedFile) {
            formData.append('image', selectedFile);
        } else if (submissionData.imageUrl) {
            formData.append('imageUrl', submissionData.imageUrl);
        }

        try {
            await api.post('/submissions', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Refresh submissions
            const { data } = await api.get(`/submissions/my`);
            const subMap = {};
            data.forEach(sub => {
                subMap[sub.questionId._id || sub.questionId] = sub;
            });
            setExistingSubmissions(subMap);

            // Close modal and show success
            setIsSubmissionOpen(false);
            alert('Correct! ✓ Answer submitted successfully.');
        } catch (error) {
            console.error('Error submitting:', error);
            const message = error.response?.data?.message || 'Submission failed. Please try again.';
            // Keep modal open so student can retry
            alert(`Incorrect... Try Again.\n\n${message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!studentData) return <div>Loading Profile...</div>;

    const allowedLanguages = studentData.allowedLanguageIds || [];

    // Step 1: Language List
    if (!selectedLanguage) {
        return (
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-8 text-gray-800">My Workbook</h1>
                <h2 className="text-xl mb-4 text-gray-600">Select a Language</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {allowedLanguages.length === 0 ? (
                        <p className="text-gray-500">No languages assigned yet.</p>
                    ) : (
                        allowedLanguages.map(lang => (
                            <div
                                key={lang._id}
                                onClick={() => setSelectedLanguage(lang)}
                                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-100 hover:border-indigo-300 group"
                            >
                                <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600">{lang.name}</h3>
                                <p className="text-sm text-gray-500 mt-2">Click to view topics</p>
                            </div>
                        ))
                    )
                    }
                </div>
            </div>
        );
    }

    // Step 2: Language Output Page
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center p-4 bg-white border-b shadow-sm">
                <button onClick={() => setSelectedLanguage(null)} className="mr-4 text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold">{selectedLanguage.name} Workbook</h1>
            </div>

            <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
                <div className="max-w-4xl mx-auto">
                    {/* Column Layout simulated with Grid */}
                    {/* User requested: Column 1: Serial Number, Column 2: Topics List */}

                    {topics.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10">No topics found for this language.</div>
                    ) : (
                        <div className="space-y-4">
                            {topics
                                .filter(topic => topic.name?.toLowerCase() !== 'project work')
                                .map((topic, index) => {
                                    const enabled = enabledStates[topic._id];
                                const completed = isTopicCompleted(topic._id);
                                const topicQuestions = questions.filter(q => (q.topicId?._id || q.topicId) === topic._id);
                                const completedCount = topicQuestions.filter(q => !!existingSubmissions[q._id]).length;
                                const totalCount = topicQuestions.length;

                                return (
                                    <div key={topic._id} className={`flex bg-white rounded-lg shadow-sm border overflow-hidden transition-all ${enabled ? 'border-gray-200' : 'border-gray-200 opacity-70 grayscale-[0.3]'}`}>
                                        {/* Column 1: Serial Number */}
                                        <div className={`w-16 flex items-center justify-center border-r font-bold text-lg ${enabled ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                            {index + 1}
                                        </div>

                                        {/* Column 2: Topic List Content (Accordion) */}
                                        <div className="flex-1">
                                            <button
                                                onClick={() => toggleTopic(topic._id, enabled)}
                                                className={`w-full flex items-center justify-between p-4 transition-colors text-left ${enabled ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-not-allowed'}`}
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <span className={`font-semibold text-lg ${enabled ? 'text-gray-800' : 'text-gray-400'}`}>{topic.name}</span>

                                                        {totalCount > 0 ? (
                                                            <>
                                                                {enabled && (
                                                                    <span className={`text-sm font-medium text-gray-500`}>
                                                                        ({completedCount}/{totalCount} Completed)
                                                                    </span>
                                                                )}
                                                                {completed ? (
                                                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Completed</span>
                                                                ) : !enabled ? (
                                                                    <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Locked</span>
                                                                ) : null}
                                                            </>
                                                        ) : (
                                                            <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Locked</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {expandedTopics[topic._id] ? <ChevronDown className="text-gray-400 w-5 h-5 flex-shrink-0 ml-2" /> : <ChevronRight className="text-gray-400 w-5 h-5 flex-shrink-0 ml-2" />}
                                            </button>

                                            {expandedTopics[topic._id] && (
                                                <div className="p-4 border-t bg-gray-50/30">
                                                    {topicQuestions.map((q, qIdx) => (
                                                        <div key={q._id} className="mb-6 last:mb-0">
                                                            <div className="flex items-start">
                                                                <span className={`font-bold mr-2 mt-1 ${enabled ? 'text-gray-500' : 'text-gray-300'}`}>Q{qIdx + 1}.</span>
                                                                <div className="flex-1">
                                                                    {q.question && <p className={`text-lg mb-3 ${enabled ? 'text-gray-800' : 'text-gray-400'}`}>{q.question}</p>}

                                                                    {q.imageUrl && (
                                                                        <div className="mb-4 relative group w-fit">
                                                                            <img
                                                                                src={q.imageUrl}
                                                                                alt="Question"
                                                                                className="max-h-64 rounded-lg border shadow-sm object-contain bg-white"
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                                                                <button
                                                                                    onClick={() => handleDownload(q.imageUrl, `question-${q._id}.png`)}
                                                                                    className="bg-white text-gray-800 px-3 py-2 rounded-full shadow-lg hover:bg-indigo-50 transition-colors flex items-center gap-2 font-medium text-sm"
                                                                                    title="Download Image"
                                                                                >
                                                                                    <Download className="w-4 h-4" />
                                                                                    Download
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    <div className="flex items-center justify-between mt-2">
                                                                        <div className="text-sm">
                                                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${existingSubmissions[q._id] ? 'bg-green-100 text-green-800' : (enabled ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-400')}`}>
                                                                                {existingSubmissions[q._id] ? 'Submitted' : 'Pending'}
                                                                            </span>
                                                                        </div>
                                                                        {!existingSubmissions[q._id] && (
                                                                            <button
                                                                                onClick={() => enabled && openSubmissionModal(q)}
                                                                                disabled={!enabled}
                                                                                className={`text-sm px-3 py-1.5 rounded flex items-center transition-colors ${enabled ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                                                            >
                                                                                <Upload className="w-3 h-3 mr-1.5" />
                                                                                Submit
                                                                            </button>
                                                                        )}
                                                                    </div>

                                                                    {existingSubmissions[q._id] && (
                                                                        <div className="mt-3 text-sm bg-green-50 p-3 rounded border border-green-100 text-gray-700 space-y-3">
                                                                            {existingSubmissions[q._id].answerText && (
                                                                                <div>
                                                                                    <strong>Your Answer:</strong>
                                                                                    <div className="mt-1 whitespace-pre-wrap">
                                                                                        {existingSubmissions[q._id].answerText}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            {existingSubmissions[q._id].imageUrl && (
                                                                                <div>
                                                                                    <strong>Submitted Image:</strong>
                                                                                    <div className="mt-2">
                                                                                        <img
                                                                                            src={existingSubmissions[q._id].imageUrl}
                                                                                            alt="Your submission"
                                                                                            className="max-h-48 rounded border shadow-sm object-contain bg-white"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {topicQuestions.length === 0 && (
                                                        <p className="text-gray-400 italic text-sm text-center">No questions available.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Submission Modal */}
            <Modal
                isOpen={isSubmissionOpen}
                onClose={() => setIsSubmissionOpen(false)}
                title="Submit Answer"
            >
                <form onSubmit={handleSubmission} className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded text-sm mb-4 border">
                        <strong className="block text-gray-700 mb-1">Question:</strong>
                        {currentQuestionForSubmission?.question && (
                            <p className="mb-2">{currentQuestionForSubmission.question}</p>
                        )}
                        {currentQuestionForSubmission?.imageUrl && (
                            <div className="relative group w-fit">
                                <img
                                    src={currentQuestionForSubmission.imageUrl}
                                    alt="Question"
                                    className="max-h-40 rounded border shadow-sm object-contain bg-white"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => handleDownload(currentQuestionForSubmission.imageUrl, `question-${currentQuestionForSubmission._id}.png`)}
                                        className="bg-white text-gray-800 p-1.5 rounded-full shadow-lg hover:bg-indigo-50 transition-colors"
                                        title="Download Image"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Answer Text (Optional if image uploaded)</label>
                        <textarea
                            rows="5"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            value={submissionData.answerText}
                            onChange={(e) => setSubmissionData({ ...submissionData, answerText: e.target.value })}
                            placeholder="Write your answer here or leave blank if uploading an image..."
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Upload Image of Work (Handwritten/Photo)
                        </label>
                        <div className="mt-1 flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 transition-colors bg-gray-50/50">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                id="image-upload"
                            />
                            <label
                                htmlFor="image-upload"
                                className="cursor-pointer flex flex-col items-center gap-2"
                            >
                                <Upload className="w-8 h-8 text-gray-400" />
                                <span className="text-sm text-gray-600 font-medium">
                                    {selectedFile ? selectedFile.name : 'Click to select an image'}
                                </span>
                                <span className="text-xs text-gray-400">PNG, JPG up to 10MB</span>
                            </label>

                            {previewUrl && (
                                <div className="mt-4 w-full max-w-[200px] relative group">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="rounded-lg shadow-sm border border-gray-200 object-cover aspect-video w-full"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>

                    </div>

                    {/* <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="https://example.com/image.png"
                            value={submissionData.imageUrl}
                            onChange={(e) => setSubmissionData({ ...submissionData, imageUrl: e.target.value })}
                        />
                    </div> */}
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={() => setIsSubmissionOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:bg-indigo-400 flex items-center gap-2">
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Checking...
                                </>
                            ) : 'Submit Answer'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default MyWorkbook;