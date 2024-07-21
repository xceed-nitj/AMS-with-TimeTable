import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Lottie from 'lottie-react'
import Timetable from './timetableadmin/timetable';
import CreateTimetable from './timetableadmin/creatett';
import MasterFaculty from './timetableadmin/masterfaculty';
import AddFaculty from './timetableadmin/addfaculty';
import MasterRoom from './timetableadmin/masterroom';
import MasterSem from './timetableadmin/mastersem';
import AddSem from './timetableadmin/addsemester';
import AddRoom from './timetableadmin/addroom';
import LockedSummary from './timetableadmin/lockedsummary';
import Login from './dashboard/login';
import ForgotPassword from './dashboard/ForgotPassword';
import SuperAdminPage from './dashboard/superadmin';

import Subjects from './timetableadmin/addsubjects';
import ViewMRooms from './timetableadmin/viewmrooms';
import Note from './timetableadmin/addnote';
import Navbar from './components/home/Navbar';
import PrintSummary from './timetableadmin/printSummary';
import LoadDistribution from './timetableadmin/loaddistribution';
import RegistrationForm from './dashboard/register';
import AllotmentForm from './timetableadmin/allotment';
import MasterDelete from './timetableadmin/masterdelete';
import AdminPage from './timetableadmin/admin';
import ViewAllotmentPage from './timetableadmin/viewroomallotment';
import CommonLoad from './timetableadmin/addcommonload';
import MasterView from './timetableadmin/mastersearch';
import View from './timetableadmin/masterview';
import AllocatedRolesPage from './dashboard/allotedroles';
import FirstYearLoad from './timetableadmin/firstyearload';
import FirstYearFaculty from './timetableadmin/addfirstyearfaculty';
import LunchLoad from './timetableadmin/addlunchload';
import InstituteLoad from './timetableadmin/instituteload';
import ViewInstituteLoad from './timetableadmin/viewinstituteload';
import EditMasterFaculty from './timetableadmin/editmasterfaculty';
import ImportForm from './timetableadmin/importCentralRoom'
import MergePDFComponent from './filedownload/mergepdfdocuments';
import TimetableMasterView from './timetableadmin/masterview';

import Home from './pages/Home';
import ErrorPage from './pages/ErrorPage.jsx';
import animation404 from '../public/404.json'
import { LogoAnimation } from './components/login/LogoAnimation.jsx';
import EventRegistration from './certificatemodule/pages/eventregistration';
import CMDashboard from './certificatemodule/pages/cmdashboard';
import CertificateForm from './certificatemodule/pages/certificatedesign';
import ServicePage from './pages/Service';
import Participant from './certificatemodule/pages/participantdataupload';

import EODashboard from './conferencemodule/layout/eodashboard';
import HomeConf from './conferencemodule/Tabs/HomeConf';
import Sidebar from './conferencemodule/components/Sidebar';
import Speaker from './conferencemodule/Tabs/Speaker';
import Committees from './conferencemodule/Tabs/Committees';
import Sponsors from './conferencemodule/Tabs/Sponsors';
import Awards from './conferencemodule/Tabs/Awards';
import Announcement from './conferencemodule/Tabs/Annoumcement';
import Contacts from './conferencemodule/Tabs/Contacts';
import Images from './conferencemodule/Tabs/Images';
import EventDates from './conferencemodule/Tabs/EventDates';
import Participants from './conferencemodule/Tabs/Participants';
import NavbarConf from './conferencemodule/Tabs/NavbarConf';
import Location from './conferencemodule/Tabs/Location';
import CommonTemplate from './conferencemodule/Tabs/CommonTemplate';
import ConferencePage from './conferencemodule/Tabs/ConferencePage';

import Template01 from './certificatemodule/pages/certificatetemplates/akleem';
import Template03 from './certificatemodule/pages/certificatetemplates/03_sarthak';

// Review Module Imports
import PRMEventRegistration from './reviewmodule/pages/eventregistration';
import PRMDashboard from './reviewmodule/pages/prmdashboard';
import ReviewLogin from './reviewmodule/pages/ReviewLogin';
import CreateUser from './reviewmodule/pages/CreateUser';
import AddReviewer from './reviewmodule/pages/AddReviewer';
import Review from './reviewmodule/pages/Review.jsx';
import PaperSummary from './reviewmodule/pages/PaperSummary.jsx';
import Forms from './reviewmodule/pages/Forms.jsx';
import ReviewerQuestion from './reviewmodule/pages/ReviewQuestion';
import DefaultQuestion from './reviewmodule/pages/DefaultQuestion.jsx';
import ReviewerQuestionHome from './reviewmodule/pages/ReviewQuestionHome';
import StartSubmission from './reviewmodule/pages/StartSubmission.jsx';
import DefaultQuestionHome from './reviewmodule/pages/DefaultQuestionHome.jsx';
import UpdateReviewerStatus from './reviewmodule/pages/UpdateReviewerStatus';
import UserRegistration from './reviewmodule/pages/userRegistration';
import OTPverification from './reviewmodule/pages/OTPverification.jsx';
import UserDetails from './reviewmodule/pages/UserDetails.jsx';

import PrmEditorDashboard from './reviewmodule/pages/PrmEditorDashboard';

import AllPaper from './reviewmodule/pages/allpapers'
import EventForm from './reviewmodule/pages/editorevent';
import MultiEditorEvent from "./reviewmodule/pages/addeditor";
import PaperDetails from './reviewmodule/components/PaperDetails';

import ReviewerAcceptance from './reviewmodule/pages/ReviewerAcceptance';

import SponsorshipRate from './conferencemodule/Tabs/SponsorshipRates';
import Accomodation from './conferencemodule/Tabs/Accomodation';
import Event from './conferencemodule/Tabs/Events';
import Souvenir from './conferencemodule/Tabs/Souvenir';
import MultiStepForm from './reviewmodule/pages/MultiStepForm';
import HomePage from './reviewmodule/pages/Main';
import AddTrack from './reviewmodule/pages/addTracks';
import AddTemplate from './reviewmodule/pages/addTemplate';
import EditTemplate from './reviewmodule/pages/EditTemplate';
import EditDefaultTemplate from './reviewmodule/pages/EditDefaultTemplate.jsx';
import NirfRanking from './nirf/rankings';
import AddPaper from './reviewmodule/pages/addpaper'

// imports for Quiz Module
import CreateQuiz from './quizModule/creator/createQuiz/CreateQuiz';
import AddQuestionHome from './quizModule/creator/addQuestion/AddQuestionHome';
import AddInstruction from './quizModule/creator/addQuestion/AddInstruction';
import PreviewInstructions from './quizModule/creator/addQuestion/PreviewInstructions';
import Settings from './quizModule/creator/addQuestion/settings';
import PrmEdDashboard from './reviewmodule/pages/PrmEdDashboard';
import Quizzing from './quizModule/student/quizzing/Quizzing';
import QuizFeedback from './quizModule/student/quizFeedback/QuizFeedback';
import UserManagement from './dashboard/userManagement';
import UserEventRegistration from './certificatemodule/pages/addEvent';

const AppContent = () => {
 const location = useLocation();

 // Define the paths where the navbar should not be displayed
 const noNavbarPaths = ['/prm/emailverification'];

 return (
 <>
 {!noNavbarPaths.includes(location.pathname) && <Navbar />}
 <Routes>
 <Route path="/" element={<Home />} />
 <Route path="/nirf" element={<NirfRanking />} />
 <Route path="/services/:serviceId" element={<ServicePage />} />
 <Route path="/login" element={<Login />} />
 <Route path="/forgot-password" element={<ForgotPassword />} />
 <Route path="/register" element={<RegistrationForm />} />
 <Route path="/userroles" element={<AllocatedRolesPage />} />
 <Route path="/superadmin" element={<SuperAdminPage />} />
 <Route path="/usermanagement" element={<UserManagement />} />
 <Route path="/tt/dashboard" element={<CreateTimetable />} />
 <Route path="/tt/masterview" element={<MasterView />} />
 <Route path="/tt/masterfaculty" element={<MasterFaculty />} />
 <Route path="/tt/masterroom" element={<MasterRoom />} />
 <Route path="/tt/mastersem" element={<MasterSem />} />
 <Route path="/tt/masterdelete" element={<MasterDelete />} />
 <Route path="/tt/viewmrooms" element={<ViewMRooms />} />
 <Route path="/tt/:generatedLink" element={<Timetable />} />
 <Route path="/tt/:generatedLink/addfaculty" element={<AddFaculty />} />
 <Route path="/tt/:generatedLink/addroom" element={<AddRoom />} />
 <Route path="/tt/:generatedLink/addcommonload" element={<CommonLoad />} />
 <Route path="/tt/:generatedLink/addlunchload" element={<LunchLoad />} />
 <Route path="/tt/:generatedLink/addsubjects" element={<Subjects />} />
 <Route path="/tt/:generatedLink/addsem" element={<AddSem />} />
 <Route path="/tt/:generatedLink/addnote" element={<Note />} />
 <Route path="/tt/:generatedLink/firstyearload" element={<FirstYearLoad />} />
 <Route path="/tt/:generatedLink/firstyearfaculty" element={<FirstYearFaculty />} />
 <Route path="/tt/:generatedLink/lockedsummary" element={<LockedSummary />} />
 <Route path="/tt/:generatedLink/generatepdf" element={<PrintSummary />} />
 <Route path="/tt/:generatedLink/loaddistribution" element={<LoadDistribution />} />
 <Route path="/tt/:generatedLink/addallotment" element={<AllotmentForm />} />
 <Route path="/tt/:generatedLink/viewroomallotment" element={<ViewAllotmentPage />} />
 <Route path="/tt/:generatedLink/admin" element={<AdminPage />} />
 <Route path="/tt/:generatedLink/addinstitute" element={<InstituteLoad />} />
 <Route path="/tt/:generatedLink/viewinstituteload" element={<ViewInstituteLoad />} />
 <Route path="/tt/:generatedLink/editmasterfaculty" element={<EditMasterFaculty />} />
 <Route path="/tt/:generatedLink/timetableview" element={<TimetableMasterView />} />
 <Route path="/tt/:generatedLink/import" element={<ImportForm />} />

 {/* Conference Module Routes */}
 <Route path="/conference/:conferenceId" element={<ConferencePage />} />
 <Route path="/conference/:conferenceId/dashboard" element={<EODashboard />} />
 <Route path="/conference/:conferenceId/home" element={<HomeConf />} />
 <Route path="/conference/:conferenceId/sidebar" element={<Sidebar />} />
 <Route path="/conference/:conferenceId/speakers" element={<Speaker />} />
 <Route path="/conference/:conferenceId/committees" element={<Committees />} />
 <Route path="/conference/:conferenceId/sponsors" element={<Sponsors />} />
 <Route path="/conference/:conferenceId/awards" element={<Awards />} />
 <Route path="/conference/:conferenceId/announcements" element={<Announcement />} />
 <Route path="/conference/:conferenceId/contacts" element={<Contacts />} />
 <Route path="/conference/:conferenceId/images" element={<Images />} />
 <Route path="/conference/:conferenceId/eventdates" element={<EventDates />} />
 <Route path="/conference/:conferenceId/participants" element={<Participants />} />
 <Route path="/conference/:conferenceId/navbarconf" element={<NavbarConf />} />
 <Route path="/conference/:conferenceId/location" element={<Location />} />
 <Route path="/conference/:conferenceId/sponsorshiprate" element={<SponsorshipRate />} />
 <Route path="/conference/:conferenceId/accomodation" element={<Accomodation />} />
 <Route path="/conference/:conferenceId/events" element={<Event />} />
 <Route path="/conference/:conferenceId/souvenir" element={<Souvenir />} />
 <Route path="/conference/:conferenceId/commontemplate" element={<CommonTemplate />} />

 {/* Certificate Module Routes */}
 <Route path="/certificates" element={<CMDashboard />} />
 <Route path="/certificates/:eventId/registration" element={<EventRegistration />} />
 <Route path="/certificates/:eventId/form" element={<CertificateForm />} />
 <Route path="/certificates/templates/akleem" element={<Template01 />} />
 <Route path="/certificates/templates/03_sarthak" element={<Template03 />} />
 <Route path="/certificates/participant" element={<Participant />} />
 <Route path="/certificates/add-event" element={<UserEventRegistration />} />
 <Route path="/files/mergepdf" element={<MergePDFComponent />} />

 {/* Review Module Routes */}
 <Route path="/prm/dashboard" element={<PRMDashboard />} />
 <Route path="/prm/event-registration" element={<PRMEventRegistration />} />
 <Route path="/prm/login" element={<ReviewLogin />} />
 <Route path="/prm/user-creation" element={<CreateUser />} />
 <Route path="/prm/add-reviewer" element={<AddReviewer />} />
 <Route path="/prm/review" element={<Review />} />
 <Route path="/prm/paper-summary" element={<PaperSummary />} />
 <Route path="/prm/forms" element={<Forms />} />
 <Route path="/prm/reviewer-question" element={<ReviewerQuestion />} />
 <Route path="/prm/default-question" element={<DefaultQuestion />} />
 <Route path="/prm/reviewer-question-home" element={<ReviewerQuestionHome />} />
 <Route path="/prm/start-submission" element={<StartSubmission />} />
 <Route path="/prm/default-question-home" element={<DefaultQuestionHome />} />
 <Route path="/prm/update-reviewer-status" element={<UpdateReviewerStatus />} />
 <Route path="/prm/user-registration" element={<UserRegistration />} />
 <Route path="/prm/emailverification" element={<OTPverification />} />
 <Route path="/prm/user-details" element={<UserDetails />} />
 <Route path="/prm/all-papers" element={<AllPaper />} />
 <Route path="/prm/event-form" element={<EventForm />} />
 <Route path="/prm/multi-editor-event" element={<MultiEditorEvent />} />
 <Route path="/prm/paper-details" element={<PaperDetails />} />
 <Route path="/prm/reviewer-acceptance" element={<ReviewerAcceptance />} />
 <Route path="/prm/multi-step-form" element={<MultiStepForm />} />
 <Route path="/prm/home-page" element={<HomePage />} />
 <Route path="/prm/add-track" element={<AddTrack />} />
 <Route path="/prm/add-template" element={<AddTemplate />} />
 <Route path="/prm/edit-template" element={<EditTemplate />} />
 <Route path="/prm/edit-default-template" element={<EditDefaultTemplate />} />

 {/* Quiz Module Routes */}
 <Route path="/quiz/create-quiz" element={<CreateQuiz />} />
 <Route path="/quiz/add-question-home" element={<AddQuestionHome />} />
 <Route path="/quiz/add-instruction" element={<AddInstruction />} />
 <Route path="/quiz/preview-instructions" element={<PreviewInstructions />} />
 <Route path="/quiz/settings" element={<Settings />} />
 <Route path="/quiz/student/quizzing" element={<Quizzing />} />
 <Route path="/quiz/student/quiz-feedback" element={<QuizFeedback />} />

 {/* Error Route */}
 <Route path="*" element={<ErrorPage />} />
 </Routes>
 </>
 );
};

function App() {
 return (
 <Router>
 <AppContent />
 </Router>
 );
}

export default App;

