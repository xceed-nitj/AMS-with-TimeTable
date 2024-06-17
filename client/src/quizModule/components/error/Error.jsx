import React,{useState} from 'react'
// import './error.css';
import { useLocation } from 'react-router-dom';
// import imageSrc from '../../assets/images/user/undraw_cancel_u1it.svg';
// import imageSrc from '../../assets/images/user/Logo enlarged-03.png';
const Error =()=>{
    const location = useLocation();
    const errorMessage = new URLSearchParams(location.search).get('message');

     return(
      <div id="error">
           {/* <img src={imageSrc} alt="error" id="error1"/> */}
           <div class="error2">

           
               ERROR 403 :(
                {errorMessage && <p>{errorMessage}</p>}
           
           <div class="error3">
           <p></p>
           {/* <a href='/summary' >click here for Summary page</a> */}
           </div>
           </div>
      </div>
    )
}
export default Error;