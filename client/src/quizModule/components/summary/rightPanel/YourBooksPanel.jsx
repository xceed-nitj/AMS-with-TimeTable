import React from "react";
import '../../styles/rightPanel.css'
import searchImage from  '../../../assets/images/summary/searchBar.svg'
import pdfImage from '../../../assets/images/summary/pdfImage.svg'

const YourBooksPanel = () =>{
    return(
        <div>
            <div className="search-bar-panel">
                <input
                    type="text"
                    className="search"
                    name="Search..."
                    placeholder="Search...."
                />
                <input
                    type="image"
                    className="search-button-image"
                    name="search"
                    src= {searchImage}
                    alt="Search"
                />
            </div>
            <div className="panel-item" id="panel-your-books">
                <div className="upload">
                    <p className="uploaded">SAFEBOOK : The safest Way to Share your material</p>
                </div>
                <div className="upload-button-container">
                    <button className="upload-button">
                        Upload File
                        <i className="fa fa-upload" aria-hidden="true"></i>
                    </button>
                </div>
                <div className="cards-container d-flex">
                    <div className="content-card">
                        <div className="upper-container d-flex">
                            <div className="content-card-icon">
                                <img src={pdfImage} className="content-card-image"/>
                            </div>
                            <div className="name-box flex-f-col">
                                <p className="file-name">Introduction to Machine Learning</p>
                                <div className="sub-heading ">
                                    <span className="naam">Subject : </span>
                                    <span className="sub-name">EMF Theory</span>
                                </div>

                            </div>

                            <div className="middle-container d-flex">
                                <div className="last-mod"> Modified : Dec-23-2022</div>
                                <div className="vie">Views : 5</div>
                            </div>

                            <div className="end-container d-flex">
                                <i className="fa-solid fa-trash icons card-icons"></i>
                                <i className="fa-sharp fa-solid fa-pencil icons card-icons"></i>
                                <i className="fa-solid fa-user-shield icons card-icons"></i>
                                <i className="fa-solid fa-gears icons card-icons"></i>
                                <i className="fa-sharp fa-solid fa-rotate icons card-icons"></i>
                                <i className="fa-sharp fa-solid fa-share-nodes icons card-icons"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default YourBooksPanel