import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // New: If student is pending, force them to Waiting Approval
    if (user.role === 'student' && user.status === 'Pending') {
        return <Navigate to="/waiting-approval" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />; // Or redirect to home
    }

    return <Outlet />;
};

export default ProtectedRoute;
