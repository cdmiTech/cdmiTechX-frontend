import { Scale, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
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
                        <Scale className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Terms of Service</h1>
                    </div>
                </div>

                <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
                    <p>
                        By accessing or using Cdmi TechX, you agree to be bound by these Terms of Service. 
                        If you do not agree to these terms, you must not use or access the platform.
                    </p>

                    <section className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-800">1. Account Registration & Security</h2>
                        <p>
                            To use Cdmi TechX, you must log in using a valid registered Google account or credentials. 
                            You are responsible for maintaining the confidentiality of your account credentials and for 
                            all activities that occur under your account.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-800">2. Academic Integrity & Use Guidelines</h2>
                        <p>
                            Cdmi TechX is designed for educational purposes. You agree to submit only your original work. 
                            Plagiarism, sharing answers, or copying workspace responses from external sources is strictly 
                            prohibited and may result in disciplinary action by your institution.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-800">3. Intellectual Property</h2>
                        <p>
                            All materials, code templates, workbook questions, and reports hosted on Cdmi TechX are the 
                            intellectual property of Cdmi TechX and its affiliated educators. You may not distribute or 
                            repurpose this content outside the platform without permission.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-800">4. Limitation of Liability</h2>
                        <p>
                            The platform is provided "as is" and "as available". We do not guarantee uninterrupted 
                            availability of the platform or that submissions will never be subject to network loss. 
                            We are not liable for any academic or data disruptions.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-800">5. Termination</h2>
                        <p>
                            We reserve the right to suspend or terminate your access to the platform at any time, with or 
                            without cause, particularly in the event of academic dishonesty or unauthorized usage.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
