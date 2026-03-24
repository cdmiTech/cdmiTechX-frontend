import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Mail, Phone, Clock, BookOpen, User as UserIcon } from 'lucide-react';

const Profile = () => {
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get('/students/me');
                setProfile(data);
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };
        fetchProfile();
    }, []);

    if (!profile) return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="min-h-full py-8 md:py-16 px-4 sm:px-6 lg:px-8 flex justify-center items-start">
            <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100/50">
                {/* Left Side: Avatar & Core Info */}
                <div className="md:w-[40%] bg-gradient-to-br from-indigo-600 to-indigo-900 text-white p-10 flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-white opacity-5 mix-blend-overlay"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-white opacity-5 mix-blend-overlay"></div>

                    {/* Avatar */}
                    <div className="relative mb-6 z-10 group">
                        <div className="w-36 h-36 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/40 shadow-xl flex items-center justify-center text-5xl font-extrabold text-white transition-transform duration-300 group-hover:scale-105">
                            {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="text-center z-10 w-full mb-4">
                        <h1 className="text-3xl font-extrabold tracking-tight mb-2 truncate">
                            {profile.name}
                        </h1>
                        <span className="inline-flex items-center px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-indigo-100 text-sm font-medium border border-white/20">
                            Student Account
                        </span>
                    </div>
                </div>

                {/* Right Side: Detailed Details Grid */}
                <div className="md:w-[60%] p-10 bg-gray-50/30">
                    <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Profile Details</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Email Details Item */}
                        <div className="flex items-start bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl mr-4 shrink-0">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</p>
                                <p className="text-gray-900 font-semibold text-base truncate">{profile.email}</p>
                            </div>
                        </div>

                        {/* Contact Details Item */}
                        <div className="flex items-start bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl mr-4 shrink-0">
                                <Phone className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Contact Number</p>
                                <p className="text-gray-900 font-semibold text-base truncate">{profile.contact || 'Not Provided'}</p>
                            </div>
                        </div>

                        {/* Batch Time Item */}
                        <div className="flex items-start bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl mr-4 shrink-0">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Assigned Batch Time</p>
                                <p className="text-gray-900 font-semibold text-base truncate">{profile.batchTime || 'Not Assigned'}</p>
                            </div>
                        </div>

                        {/* Course Item */}
                        <div className="flex items-start bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl mr-4 shrink-0">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Enrolled Course</p>
                                <p className="text-gray-900 font-semibold text-base truncate">{profile.courseId?.name || 'Not Enrolled'}</p>
                            </div>
                        </div>

                        {/* Faculty Item */}
                        <div className="flex items-start bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl mr-4 shrink-0">
                                <UserIcon className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Assigned Faculty</p>
                                <p className="text-gray-900 font-semibold text-base truncate">{profile.facultyId?.name || 'Not Assigned'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
