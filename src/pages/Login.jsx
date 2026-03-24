import { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithGoogle } from '../utils/firebase';
import { GoogleAuthProvider } from 'firebase/auth';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';
import { User, Lock, Chrome, Shield, ArrowRight } from 'lucide-react';
import logo from './logoX.png'
const Login = () => {
    const [formData, setFormData] = useState({ identifier: '', password: '' });
    const { login, googleLogin } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState(location.state?.message || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isStaffPath = location.pathname === '/login-staff';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            const isEmail = formData.identifier.includes('@');
            const payload = isEmail
                ? { email: formData.identifier, password: formData.password }
                : { username: formData.identifier, password: formData.password };

            const data = await login(payload);

            if (data.status === 'Pending') {
                toast.info('Login successful! Waiting for faculty approval.');
                navigate('/waiting-approval');
                return;
            }

            toast.success('Login successful!');
            navigate(data.role === 'faculty' ? '/dashboard' : '/my-workbook');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Login failed';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setIsSubmitting(true);
            setError('');
            const result = await signInWithGoogle();
            const idToken = await result.user.getIdToken();

            // Get Google Access Token for Gmail API
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const googleAccessToken = credential.accessToken;

            const data = await googleLogin(idToken, googleAccessToken);

            if (data.status === 'requires_registration') {
                toast.info('Welcome! Please complete your profile to register.');
                navigate('/register-google', {
                    state: {
                        email: data.email,
                        name: data.name,
                        googleId: data.googleId,
                        googleAccessToken: googleAccessToken // Pass to registration page
                    }
                });
            } else if (data.status === 'Pending') {
                navigate('/waiting-approval');
            } else {
                toast.success('Login successful!');
                navigate(data.role === 'faculty' ? '/dashboard' : '/my-workbook');
            }
        } catch (err) {
            console.error('Google Login Error:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Google Login failed';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl shadow-indigo-100/50 p-10 sm:p-12 border border-gray-100 transform transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-10">

                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 group transition-all duration-500 hover:scale-110">
                        <img src={logo} alt="" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
                        Cdmi <span className="text-indigo-600">TechX</span>
                    </h1>

                </div>

                {error && (
                    <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-8 text-sm font-medium border border-rose-100 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 shadow-sm"></div>
                        {error}
                    </div>
                )}

                {isStaffPath ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Username or Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 text-sm"
                                    placeholder="Enter your credentials"
                                    value={formData.identifier}
                                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-gray-900 text-sm"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 mt-4 shadow-lg shadow-indigo-100"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isSubmitting ? 'Verifying...' : 'Sign In'}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                    </form>
                ) : (
                    <div className="space-y-8">
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isSubmitting}
                            className="group relative w-full flex items-center justify-center gap-4 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            <span>{isSubmitting ? 'One moment...' : 'Sign in with Google'}</span>
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="h-px bg-gray-100 flex-grow"></div>
                            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Student Portal</span>
                            <div className="h-px bg-gray-100 flex-grow"></div>
                        </div>

                        <p className="text-center text-xs text-gray-500 leading-relaxed px-4">
                            Please use your registered account. New users will be redirected to complete their registration.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
