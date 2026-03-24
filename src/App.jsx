import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import GoogleStudentRegistration from './pages/GoogleStudentRegistration';
import WaitingApproval from './pages/WaitingApproval';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Students from './pages/Students';
import Languages from './pages/Languages';
import Topics from './pages/Topics';
import Questions from './pages/Questions';
import CreateWorkbook from './pages/CreateWorkbook';
import ViewWorkbooks from './pages/ViewWorkbooks';
import MyWorkbook from './pages/MyWorkbook';
import Profile from './pages/Profile';
import FacultyManagement from './pages/FacultyManagement';
import Submissions from './pages/Submissions';
import Materials from './pages/Materials';
import StudentMaterials from './pages/StudentMaterials';
import StudentReport from './pages/StudentReport';
import FacultyReport from './pages/FacultyReport';
import CPCSelection from './pages/CPCSelection';
import CPCTable from './pages/CPCTable';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Firebase and old Auth provider cleanup
// import { GoogleOAuthProvider } from '@react-oauth/google';


function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1013753760431-297g90f9p16l9o2tnsunvck81edg5268.apps.googleusercontent.com'; // Fallback for safety

  return (
    <Router>
      <AuthProvider>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/login-staff" element={<Login />} />
          <Route path="/register-google" element={<GoogleStudentRegistration />} />
          <Route path="/waiting-approval" element={<WaitingApproval />} />

          <Route element={<ProtectedRoute allowedRoles={['faculty', 'student', 'admin']} />}>
            <Route element={<Layout />}>
              {/* Faculty & Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['faculty', 'admin']} />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/students" element={<Students />} /> {/* Admin needs this to assign faculty */}
                <Route path="/languages" element={<Languages />} />
                <Route path="/topics" element={<Topics />} />
                <Route path="/questions" element={<Questions />} />
                <Route path="/workbooks/create" element={<CreateWorkbook />} />
                <Route path="/workbooks" element={<ViewWorkbooks />} />
                <Route path="/submissions" element={<Submissions />} />
                <Route path="/materials" element={<Materials />} />
                <Route path="/faculty-management" element={<FacultyManagement />} />
                <Route path="/reports" element={<FacultyReport />} />
              </Route>

              {/* Admin Only */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              </Route>

              {/* Student Routes */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/my-workbook" element={<MyWorkbook />} />
                <Route path="/my-materials" element={<StudentMaterials />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/report" element={<StudentReport />} />
                <Route path="/cpc" element={<CPCSelection />} />
                <Route path="/cpc/:languageId" element={<CPCTable />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
