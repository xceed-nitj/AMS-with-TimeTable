import React, { useState, useEffect } from 'react';
import LeftNavigationPanel from './LeftNavigationPanel'
import RightPanelRoot from "./rightPanel/RightPanelRoot";
import '../styles/summary.css'
import {useParams} from "react-router-dom";





const Summary = ()=> {  
    const {summaryLink} = useParams()
    return(
        <div className="panel-container h-93 w-100">
            <LeftNavigationPanel/>
            <RightPanelRoot summaryLink={summaryLink}/>
        </div>
    )
}
export default Summary