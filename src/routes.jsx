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
import StudentTasks from "./pages/student/Tasks/StudentTasks";
import StudentThesis from "./pages/student/Thesis/StudentThesis";
import StudentTaskDetails from "./pages/student/Tasks/StudentTaskDetails";
import SupervisorHome from "./pages/supervisor/SupervisorHome";
import CoordinatorHome from "./pages/coordinator/CoordinatorHome";
import ExaminerHome from "./pages/examiner/ExaminerHome";

import CreateEvaluationForm from "./pages/coordinator/CreateEvaluationForm/CreateEvaluationForm";
import EvaluationForms from "./pages/coordinator/EvaluationForms/EvaluationForms";
import Users from "./pages/coordinator/Users/Users";
import ExaminationTimetable from "./pages/coordinator/ExaminationTimetable/ExaminationTimetable";
import ThesisManagement from "./pages/coordinator/ThesisManagement/ThesisManagement";
import FinalGrades from "./pages/coordinator/FinalGrades/FinalGrades";
import Semester from "./pages/coordinator/Semester/Semester";
import ArchiveSemesters from "./pages/coordinator/archive/ArchiveSemesters";
import ArchivedThesis from "./pages/coordinator/archive/ArchivedThesis";

import ExaminerEvaluationForms from "./pages/examiner/EvaluationForms/ExaminerEvaluationForms";
import SupervisorEvaluationForms from "./pages/supervisor/EvaluationForms/SupervisorEvaluationForms";
import SupervisorGroups from "./pages/supervisor/Groups/SupervisorGroups";
import GroupDetails from "./pages/supervisor/Groups/GroupDetails";
import StudentGrades from "./pages/student/Grades/StudentGrades";
import TaskSubmissions from "./pages/supervisor/Tasks/TaskSubmissions";
import Tasks from "./pages/supervisor/Tasks/Tasks";
import SupervisorThesis from "./pages/supervisor/Thesis/SupervisorThesis";
import ThesisDetails from "./pages/supervisor/Thesis/ThesisDetails";

import Profile from "./pages/profile/Profile";

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
      { path: "tasks", element: <StudentTasks /> }, // Main tasks page showing all tasks for the student's group
      { path: "thesis", element: <StudentThesis /> },
      { path: "tasks/:taskId", element: <StudentTaskDetails /> }, // Detais page for a specific task
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
      { path: "tasks", element: <Tasks /> },
      { path: "groups", element: <SupervisorGroups /> },
      { path: "groups/:groupId", element: <GroupDetails /> },
      { path: "thesis", element: <SupervisorThesis /> },
      { path: "thesis/:groupId", element: <ThesisDetails /> },
      { path: "evaluation-forms", element: <SupervisorEvaluationForms /> },
      { path: "archive", element: <ArchiveSemesters /> },
      { path: "archive/:semesterId", element: <ArchivedThesis /> },
      { path: "profile", element: <Profile /> },
      {
        path: "groups/:groupId/tasks/:taskId/submissions",
        element: <TaskSubmissions />,
      }, // Page that displays submissions for a specific task inside a specific group
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
      { path: "semester", element: <Semester /> },
      { path: "archive", element: <ArchiveSemesters /> },
      { path: "archive/:semesterId", element: <ArchivedThesis /> },
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
