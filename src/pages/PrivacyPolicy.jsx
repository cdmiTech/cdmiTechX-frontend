import { Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 sm:p-12">
            <div className="w-full max-w-3xl bg-white rounded-[2.5rem] shadow-xl shadow-indigo-100/50 p-8 sm:p-12 border border-gray-100 transform transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors mb-8 focus:outline-none"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                </button>

                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <Shield className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Privacy Policy</h1>
                    </div>
                </div>

                <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
                    <p>
                        Welcome to Cdmi TechX. We value your privacy and are committed to protecting your personal data. 
                        This Privacy Policy explains how we collect, use, and protect your information when you use our platform.
                    </p>

                    <section className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-800">1. Information We Collect</h2>
                        <p>
                            We collect personal information that you provide to us, including your name, email address, profile 
                            picture (from Google sign-in), and account credentials. We also collect workspace data, including 
                            your workbook submissions, grades, and interactions on the platform.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-800">2. How We Use Your Information</h2>
                        <p>
                            Your data is used to provide, personalize, and improve Cdmi TechX. Specifically, we use it to 
                            authenticate your identity, manage your workbook progress, enable faculty members to review 
                            and grade your submissions, and send academic notifications.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-800">3. Data Security</h2>
                        <p>
                            We implement robust security measures to protect your data, including secure HTTPS communication 
                            and industry-standard authentication protocols via Firebase. We do not sell, trade, or share 
                            your personal information with third parties.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-800">4. Your Rights</h2>
                        <p>
                            You have the right to request access to, correction of, or deletion of your personal data. 
                            Please contact the platform administrator or your faculty member to update your profile information.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-800">5. Changes to This Policy</h2>
                        <p>
                            We may update our Privacy Policy from time to time. We will notify you of any changes by posting 
                            the new Privacy Policy on this page and updating the "Last updated" date at the top.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
