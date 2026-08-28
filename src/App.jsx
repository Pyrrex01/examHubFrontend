import { Route, Routes } from 'react-router-dom';

import AppShell from './components/AppShell';
import { HomeRedirect, RequireAnonymous, RequireRole } from './auth/RouteGuards';
import { ROLES } from './auth/guards';

import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';

import DashboardPage from './pages/admin/DashboardPage';
import StudentsPage from './pages/admin/StudentsPage';
import CoursesPage from './pages/admin/CoursesPage';
import ExamsPage from './pages/admin/ExamsPage';
import ExamQuestionsPage from './pages/admin/ExamQuestionsPage';
import ExamResultsPage from './pages/admin/ExamResultsPage';

import AvailableExamsPage from './pages/student/AvailableExamsPage';
import TakeExamPage from './pages/student/TakeExamPage';
import ExamResultPage from './pages/student/ExamResultPage';
import MyResultsPage from './pages/student/MyResultsPage';

const ADMIN_SECTIONS = [
  {
    label: 'Pilotage',
    items: [{ to: '/admin', label: 'Tableau de bord', icon: 'dashboard', end: true }],
  },
  {
    label: 'Gestion',
    items: [
      { to: '/admin/students', label: 'Étudiants', icon: 'users' },
      { to: '/admin/courses', label: 'Cours', icon: 'book' },
      { to: '/admin/exams', label: 'Examens', icon: 'clipboard' },
    ],
  },
];

const STUDENT_SECTIONS = [
  {
    label: 'Mon espace',
    items: [{ to: '/student', label: 'Examens disponibles', icon: 'clipboard', end: true }],
  },
  {
    label: 'Suivi',
    items: [{ to: '/student/results', label: 'Mes résultats', icon: 'award' }],
  },
];

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route element={<RequireAnonymous />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<RequireRole role={ROLES.ADMIN} />}>
        <Route path="/admin" element={<AppShell title="Administration" sections={ADMIN_SECTIONS} />}>
          <Route index element={<DashboardPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="exams" element={<ExamsPage />} />
          <Route path="exams/:examId/questions" element={<ExamQuestionsPage />} />
          <Route path="exams/:examId/results" element={<ExamResultsPage />} />
        </Route>
      </Route>

      <Route element={<RequireRole role={ROLES.STUDENT} />}>
        <Route path="/student" element={<AppShell title="Espace étudiant" sections={STUDENT_SECTIONS} />}>
          <Route index element={<AvailableExamsPage />} />
          <Route path="exams/:examId" element={<TakeExamPage />} />
          <Route path="exams/:examId/result" element={<ExamResultPage />} />
          <Route path="results" element={<MyResultsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
