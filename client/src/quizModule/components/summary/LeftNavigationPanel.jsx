import React, {useState} from "react";
import '../styles/LeftNavigationPanel.css'
import {Link, Outlet} from "react-router-dom";

const LeftNavigationPanel = () => {
    const [quizDropdown, setQuizDropdown] = useState( false)
    const [bookDropdown, setBookDropdown] = useState(false)
    const [sideNavigationDropdown, setSideNavigationDropdown] = useState(false)
    const sideBarShown = "side-bar side-bar-shown"
    const sideBarHidden = "side-bar side-bar-hidden"
    const sideNavigationArrowRight = "fa-solid fa-angle-right icons"
    const sideNavigationArrowLeft = "fa-solid fa-angle-left icons"
    return (
        <div className= "side-navigation-container-shown" >
            <div className={sideNavigationDropdown?sideBarShown:sideBarHidden} id="side-navigation">
                <h1>Dashboard</h1>

                <button className="dropdown-btn side-bar-item" onClick={() => setQuizDropdown(!quizDropdown)}>
                    Quiz
                    <i className="fa fa-caret-down"></i>
                </button>
                {quizDropdown &&
                    <div className="dropdown-container">
                    <Link to="/summary/quiz" id="btn-subjective-quiz">Subjective Quiz</Link>
                    {/* <Link to="/summary/placement-quiz" id="btn-placement-quiz">Placement Quiz</Link> */}
                    </div>
            }

{/* 
                <button className="dropdown-btn side-bar-item" onClick={() => setBookDropdown(!bookDropdown)}>
                    Book
                    <i className="fa fa-caret-down"></i>
                </button>

                {bookDropdown && <div className="dropdown-container">
                    <Link to="/summary/your-books" id="btn-your-books">Your Books</Link>
                    <Link to="/summary/your-collections" id="btn-your-collections">Your Collections </Link>
                </div>
                }

                <button className="side-bar-item" id="btn-assignment">
                    Assignments
                </button>
                <button className="side-bar-item">
                    Tutorials
                </button> */}
            </div>
            <div id="side-navigation-arrow" onClick={() => setSideNavigationDropdown(!sideNavigationDropdown)}>
                <i className={sideNavigationDropdown?sideNavigationArrowLeft : sideNavigationArrowRight} id="side-navigation-arrow "></i>
            </div>
        </div>
    );
};

export default LeftNavigationPanel;
