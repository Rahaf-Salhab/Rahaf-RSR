import { createBrowserRouter } from "react-router-dom";

import MainLayout from "./layout/MainLayout";
import DashboardLayout from "./layout/DashboardLayout";

import ErrorPage from "./pages/error/ErrorPage";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import ForgotPassword from "./pages/forgotPassword/ForgotPassword";
import SendCode from "./pages/sendCode/SendCode";
import ResetPassword from "./pages/resetPassword/ResetPassword";
import UnAuthorized from "./unAuthorized/UnAuthorized";

import StudentHome from "./pages/student/StudentHome";
import SupervisorHome from "./pages/supervisor/SupervisorHome";
import CoordinatorHome from "./pages/coordinator/CoordinatorHome";
import ExaminerHome from "./pages/examiner/ExaminerHome";

import CreateEvaluationForm from "./pages/coordinator/CreateEvaluationForm/CreateEvaluationForm";
import EvaluationForms from "./pages/coordinator/EvaluationForms/EvaluationForms";
import Users from "./pages/coordinator/Users/Users";
import ExaminationTimetable from "./pages/coordinator/ExaminationTimetable/ExaminationTimetable";
import ThesisManagement from "./pages/coordinator/ThesisManagement/ThesisManagement";
import FinalGrades from "./pages/coordinator/FinalGrades/FinalGrades";

import ExaminerEvaluationForms from "./pages/examiner/EvaluationForms/ExaminerEvaluationForms";
import SupervisorEvaluationForms from "./pages/supervisor/EvaluationForms/SupervisorEvaluationForms";
import SupervisorGroups from "./pages/supervisor/Groups/SupervisorGroups";
import StudentGrades from "./pages/student/Grades/StudentGrades";

import Profile from "./pages/profile/Profile";

import ProtectedRouter from "./components/protectedRouter/ProtectedRouter";
import DashboardProtectedRouter from "./components/protectedRouter/DashboardProtectedRouter";

const routes = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: "login", element: <Login /> },
      { path: "forgotPassword", element: <ForgotPassword /> },
      { path: "send-code", element: <SendCode /> },
      { path: "reset-password", element: <ResetPassword /> },
      { path: "unAuthorized", element: <UnAuthorized /> },
    ],
  },

  // Student
  {
    path: "/student",
    element: (
      <DashboardProtectedRouter allowedRoles={["student"]}>
        <DashboardLayout />
      </DashboardProtectedRouter>
    ),
    children: [
      { index: true, element: <StudentHome /> },
      { path: "home", element: <StudentHome /> },
      { path: "grades", element: <StudentGrades /> },
      { path: "profile", element: <Profile /> },
    ],
  },

  // Supervisor
  {
    path: "/supervisor",
    element: (
      <DashboardProtectedRouter allowedRoles={["supervisor"]}>
        <DashboardLayout />
      </DashboardProtectedRouter>
    ),
    children: [
      { index: true, element: <SupervisorHome /> },
      { path: "home", element: <SupervisorHome /> },
      { path: "groups", element: <SupervisorGroups /> },
      { path: "evaluation-forms", element: <SupervisorEvaluationForms /> },
      { path: "profile", element: <Profile /> },
    ],
  },

  // Coordinator
  {
    path: "/coordinator",
    element: (
      <DashboardProtectedRouter allowedRoles={["coordinator"]}>
        <DashboardLayout />
      </DashboardProtectedRouter>
    ),
    children: [
      { index: true, element: <CoordinatorHome /> },
      { path: "home", element: <CoordinatorHome /> },
      { path: "create-evaluation-form", element: <CreateEvaluationForm /> },
      { path: "evaluation-forms", element: <EvaluationForms /> },
      { path: "users", element: <Users /> },
      { path: "examination-timetable", element: <ExaminationTimetable /> },
      { path: "thesis-management", element: <ThesisManagement /> },
      { path: "final-grades", element: <FinalGrades /> },
      { path: "profile", element: <Profile /> },
    ],
  },

  // Examiner
  {
    path: "/examiner",
    element: (
      <DashboardProtectedRouter allowedRoles={["examiner"]}>
        <DashboardLayout />
      </DashboardProtectedRouter>
    ),
    children: [
      { index: true, element: <ExaminerHome /> },
      { path: "home", element: <ExaminerHome /> },
      { path: "evaluation-forms", element: <ExaminerEvaluationForms /> },
      { path: "profile", element: <Profile /> },
     ],
  },
]);

export default routes;