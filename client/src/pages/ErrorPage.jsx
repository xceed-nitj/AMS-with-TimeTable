import StarryBackgroundAnimation from "../components/home/StarryBackgroundAnimation"
import Lottie from 'lottie-react'
import animation404 from '../../public/404.json'
import { useState, useEffect } from 'react'

// HOW TO USE THIS COMPONENT ?
// PROPS->
// message prop = Shows the custom message.
// animation prop = Shows animation in background
// destinationName prop = false if no redirect needed | Specify name to redirect location
// destination prop = specify destination to be set in URL | leave empty if destinationName is false


function GoToHome(props) {
    let [timer, setTimer] = useState(7)

    useEffect(()=>{
        if(timer) {
            setTimeout(()=>{
                setTimer(timer-1)
            },1000)
        }
        else location.href= props.destination
    },)

    return (
        <h3 className="tw-tracking-tight tw-text-cyan-600 md:tw-text-xl lg:tw-text-2xl"
        >
        Redirecting to {props.destinationName} in {timer} seconds...
        </h3>
    )
}


function ErrorPage(props) {

    return (
        <>
        <div
            style={{
                boxSizing:'border-box', height:'91vh',
                padding:'0', margin:'0', overflowX:'hidden'
            }}
        >
            <main className="tw-font-jakarta tw-dark tw-overflow-clip" 
                style={{
                    zIndex:'5', position:'absolute',
                    width:'100%', height:'inherit'}}>
                <StarryBackgroundAnimation/>
                {/* <Lottie animationData ={animation404} style={{opacity:'15%'}}/> */}
                {props.animation}
            </main>
            <section id="home" style={{zIndex:'6', position:'absolute',
                width:'100%', height:'inherit'
            }}>
                <div 
                    className="tw-py-8 tw-px-4 tw-mx-auto tw-max-w-screen-xl tw-text-center lg:tw-py-14 lg:tw-px-12"
                    style={{display:'flex', flexDirection:'column', justifyContent:'space-evenly', 
                        alignItems:'center', height:'100%', width:'100%'}}
                >
                    <div>
                        <h3 
                            className="tw-mb-5 tw-text-4xl tw-font-extrabold tw-tracking-tight tw-leading-none tw-text-white md:tw-text-3xl lg:tw-text-4xl">
                            {props.message}
                        </h3>
                    </div>
                    <div>
                        {(props.destinationName)?(
                        <GoToHome destination={props.destination} destinationName={props.destinationName}/>
                        ):''}
                    </div>
                </div>
            </section>
        </div>
        </>
    )
}

export default ErrorPage