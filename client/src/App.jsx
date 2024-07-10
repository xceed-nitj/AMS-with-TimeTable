import { BrowserRouter as Router, Routes, Route, RouterProvider } from 'react-router-dom';
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
// import LockedView from './timetableviewer/viewer';
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
// import Certificate from './certificatemodule/pages/certificatetemplates/Certificate';
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
// import ViewCertificate from './certificatemodule/pages/participantCerti';
import Template03 from './certificatemodule/pages/certificatetemplates/03_sarthak';

// Review Module Imports
import PRMEventRegistration from './reviewmodule/pages/eventregistration';
import PRMDashboard from './reviewmodule/pages/prmdashboard';
import ReviewLogin from './reviewmodule/pages/ReviewLogin';
import CreateUser from './reviewmodule/pages/CreateUser';
import AddReviewer from './reviewmodule/pages/AddReviewer';
import Review from './reviewmodule/pages/Review.jsx';
import PaperSummary from './reviewmodule/pages/PaperSummary.jsx';
import ReviewerQuestion from './reviewmodule/pages/ReviewQuestion';
import DefaultQuestion from './reviewmodule/pages/DefaultQuestion.jsx';
import ReviewerQuestionHome from './reviewmodule/pages/ReviewQuestionHome';
import StartSubmission from './reviewmodule/pages/StartSubmission.jsx';
import DefaultQuestionHome from './reviewmodule/pages/DefaultQuestionHome.jsx';
import UpdateReviewerStatus from './reviewmodule/pages/UpdateReviewerStatus';
import UserRegistration from './reviewmodule/pages/userRegistration';
import OTPverification from './reviewmodule/pages/OTPverification.jsx';
import UserDetails from './reviewmodule/pages/UserDetails.jsx';

// import HomePage from './reviewmodule/pages/Main';

import PrmEditorDashboard from './reviewmodule/pages/PrmEditorDashboard';

// import ConferenceDetails from './reviewmodule/pages/EditorConferencePage';
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
// import Instructions from './quizModule/student/Instructions';
import QuizFeedback from './quizModule/student/quizFeedback/QuizFeedback';

function App() {
  return (
    <Router>
      {/* <div className="app"> */}

      {/* <h1>XCEED-Timetable Module</h1>  */}
      <Navbar />

      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Home />} />
        <Route path="/nirf" element={<NirfRanking />} />

        <Route path="/services/:serviceId" element={<ServicePage />} />
        {/* ********* */}

        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/register" element={<RegistrationForm />} />
        <Route path="/userroles" element={<AllocatedRolesPage />} />
        <Route path="/superadmin" element={<SuperAdminPage />} />

        <Route path="/tt">
          <Route path="dashboard" element={<CreateTimetable />} />
          <Route path="masterview" element={<MasterView />} />
          <Route path="masterfaculty" element={<MasterFaculty />} />
          <Route path="masterroom" element={<MasterRoom />} />
          <Route path="mastersem" element={<MasterSem />} />
          <Route path="masterdelete" element={<MasterDelete />} />
          <Route path="viewmrooms" element={<ViewMRooms />} />
          
        </Route>


        <Route path="/tt/:generatedLink">
          <Route index element={<Timetable />}></Route>

          <Route path="addfaculty" element={<AddFaculty />} />
          <Route path="addroom" element={<AddRoom />} />
          <Route path="addcommonload" element={<CommonLoad />} />
          <Route path="addlunchload" element={<LunchLoad />} />
          <Route path="addsubjects" element={<Subjects />} />
          <Route path="addsem" element={<AddSem />} />
          <Route path="addnote" element={<Note />} />
          <Route path="firstyearload" element={<FirstYearLoad />} />
          <Route path="firstyearfaculty" element={<FirstYearFaculty />} />
          <Route path="lockedsummary" element={<LockedSummary />} />
          <Route path="generatepdf" element={<PrintSummary />} />
          <Route path="loaddistribution" element={<LoadDistribution />} />
          <Route path="roomallotment" element={<ViewAllotmentPage />} />
          <Route path="editmasterfaculty" element={<EditMasterFaculty />} />
        </Route>

        {/* Same link */}
        <Route path="classrooms" element={<ViewMRooms />} />
        {/* Same link */}

          {/* <Route path="/tt/viewtimetable" element={<LockedView/>} /> */}
          <Route path="/tt/allotment" element={<AllotmentForm/>}/>
          <Route path="/tt/allotment/import" element={<ImportForm/>}/>

          <Route path="/tt/admin" element={<AdminPage/>}/>
          <Route path="/tt/admin/adminview" element={<TimetableMasterView />} />
        
        {/* Same link */}
        <Route path="timetable" element={<MasterView />} />
        {/* Same link */}

        <Route path="/tt/admin/view" element={<View />} />
        <Route path="/tt/admin/instituteload" element={<InstituteLoad />} />
        <Route path="/tt/viewinstituteload" element={<ViewInstituteLoad />} />

        <Route
          path="/tt/:generatedLink/generatepdf/mergepdf"
          element={<MergePDFComponent />}
        />

        <Route path="/cm/addevent" element={<EventRegistration />} />
        <Route path="/cm/dashboard" element={<CMDashboard />} />
        <Route path="/cm/:eventid" element={<CertificateForm />} />
        <Route path="/cm/:eventid/addparticipant" element={<Participant />} />
        <Route path="/cm/c/:eventid/:participantid" element={<Template01 />} />
        <Route path="/cm/c/:eventid/:participantid/sarthak" element={<Template03 />} />

    {/* Review management routes*/}
    <Route path="/prm/login" element={<ReviewLogin/>} />
    <Route path="/prm/signup" element={<CreateUser/>} />
    <Route path="/prm/assigneditor" element={<PRMEventRegistration/>} />
    <Route path="/prm/dashboard" element={<PRMDashboard/>} />
    <Route path="/prm/emailverification" element={<OTPverification/>} />
    <Route path="/prm/userdetails" element={<UserDetails/>} />
    {/* <Route path="/prm/papersubmission" element={<MultiStepForm/>}/> */}
    <Route path="/prm/:eventId/editor/confdetails" element={<EventForm/>}/>
    <Route path="/prm/:eventId/editor/addEditor" element={<MultiEditorEvent/>}/>
    <Route path="/prm/:eventId/editor/addreviewer" element={<AddReviewer/>}/>
    <Route path="/prm/:eventId/:paperId/:userId/Review" element={<Review/>}/>
    <Route path="/prm/:eventId/:paperId/summary" element={<PaperSummary/>}/>
    <Route path="/prm/:eventId/ReviewQuestion" element={<ReviewerQuestion/>}/>
    <Route path="/prm/:eventId/ReviewQuestionHome" element={<ReviewerQuestionHome/>}/>
    <Route path="/prm/DefaultQuestion" element={<DefaultQuestion/>}/>
    <Route path="/prm/DefaultQuestionHome" element={<DefaultQuestionHome/>}/>
    <Route path="/prm/:eventId/reviewer/:reviewerId" element={<UpdateReviewerStatus/>}/>
    <Route path="/prm/:eventId/editor/addtrack" element={<AddTrack/>}/>
    <Route path="/prm/:eventId/editor/edittemplate" element={<EditTemplate/>}/>
    <Route path="/prm/editdefaulttemplate" element={<EditDefaultTemplate/>}/>
    <Route path="/prm/:eventId/editor/papers" element={<AllPaper/>}/>
    <Route path="/prm/:eventId/editor/papers/addpaper" element={<AddPaper/>}/>
    <Route path="/prm/:eventId/editor/startSubmission" element={<StartSubmission/>}/>

    <Route path="/prm/:eventId/paper" element={<PaperDetails/>}/>
    <Route path="/prm/:eventId/editor" element={<PrmEditorDashboard/>} /> 
    <Route path="/prm/:eventId/ed" element={<PrmEdDashboard/>} /> 
    

    <Route path="/prm/:eventId/author/newpaper" element={<MultiStepForm />} />
    <Route path="/prm/reviewerAcceptance" element={<ReviewerAcceptance/>} />
    <Route path="/prm/home" element={<HomePage/>}/>
    <Route path="/prm/register" element={<UserRegistration/>}/>
    <Route path='/prm/*' element={<ErrorPage 
                                      message='The page you are looking for does not exist...' 
                                      destination='/prm/home'
                                      destinationName='Paper Review Manager Home'
                                      animation={<Lottie animationData ={animation404} style={{opacity:'15%'}}/>} 
                                      />}></Route>

    


          {/* Conference Module Admin-Panel */}
          <Route path="/cf/dashboard" element={<EODashboard/>} />
          <Route path="/cf/addconf" element={<ConferencePage />} />
          <Route path="/cf/:confid" element={<Sidebar  />}>
          <Route index element={<HomeConf />} />
          <Route path="home" element={<HomeConf />} />
          <Route path="speakers" element={<Speaker />} />
          <Route path="committee" element={<Committees />} />
          <Route path="sponsors" element={<Sponsors />} />
          <Route path="awards" element={<Awards />} />
          <Route path="announcement" element={<Announcement />} />
          <Route path="contact" element={<Contacts />} />
          <Route path="images" element={<Images />} />
          <Route path="eventdates" element={<EventDates />} />
          <Route path="locations" element={<Location />} />
          <Route path="participants" element={<Participants />} />
          <Route path="navbar" element={<NavbarConf />} />
          {/* <Route path="template" element={<CommonTemplate/>} /> */}
          <Route path="sponsorship-rates" element={<SponsorshipRate />} />
          <Route path="accomodation" element={<Accomodation />} />
          <Route path="events" element={<Event />} />
          <Route path="souvenir" element={<Souvenir />} />
          <Route path="commontemplate" element={<CommonTemplate />} />

          </Route>

        {/* Quiz Module Routes */}
        <Route path='/quiz/createquiz' element={<CreateQuiz/>}></Route>
        <Route path="/quiz/:code" element={ <> <AddQuestionHome />   </>} />
        <Route path="/quiz/:code/addinstruction" element={<><AddInstruction /></>} />
        <Route path="/quiz/:code/addinstruction/preview" element={<><PreviewInstructions /></>} />
        <Route path="/quiz/:code/settings" element={<><Settings/></>}/>
        {/* <Route path="/quiz/:code/result" element={<><ResultSummary /></>} /> */}
        {/*<Route path="/addQuestionHome" element={<><AddQuestionHome /></>} /> */} 
        
        {/* quiz-student-routes */}
        {/* <Route path="/quiz/:code/test" element={<Instructions />} /> */}
        <Route path="/quiz/:code/live" element={<Quizzing />} />
        <Route path="/quiz/:code/feedback" element={<QuizFeedback />} />


        <Route path='test-message' element={<ErrorPage 
                    message='Custom error message...' 
                    destinationName={false}
                    animation={<LogoAnimation style={{opacity:'20%'}} />}  // any type of component can be sent here
                    />}></Route>
        <Route path='*' element={<ErrorPage 
                    message='The page you are looking for does not exist...' 
                    destination='/'
                    destinationName='Home' 
                    animation={<Lottie animationData ={animation404} style={{opacity:'15%'}}/>} 
                    />}></Route>
      </Routes>
      {/* <Footer/> */}
      {/* </div> */}
    </Router>
  );
}

export default App;