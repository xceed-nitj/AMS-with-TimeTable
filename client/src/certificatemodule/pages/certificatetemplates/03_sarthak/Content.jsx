
function Content({ header, body, name , certiType}) {
    console.log(name);
    return (
        <>

            <g textAnchor="middle">

                <text
                    x="561.26"
                    y={245}
                    fill="#272727"
                    fontFamily="Butler-Bold"
                    fontSize={40}
                >
                    {header[0]}
                </text>
                <text
                    x="561.26"
                    y={268}
                    fill="#272727"
                    fontFamily="AbhayaLibre-Regular"
                    fontSize={18}
                >
                    {header[1]}
                </text>
                <text
                    x="561.26"
                    y={348}
                    fill="#272727"
                    fontFamily="AbhayaLibre-Regular"
                    fontSize={18}
                >
                    THIS CERTIFICATE IS PRESENTED TO
                </text>
                <text
                    x="561.26"
                    y={415}
                    fill="#1E0C45"
                    fontFamily="Allura-Regular"
                    fontSize={70}
                >
                    {name}
                </text>
                {/* <text
                    x="561.26"
                    y={455}
                    fill="#272727"
                    fontFamily="AbhayaLibre-Regular"
                    fontSize="18.64"
                >
                    <tspan x="561.26">
                        Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed
                    </tspan>
                    <tspan x="561.26" dy={20}>
                        diam nonummy nibh euismod tincidunt ut laoreet dolore magna
                    </tspan>
                    <tspan x="561.26" dy={20}>
                        aliquam erat volutpat. Ut wisi enim ad minim veniam,
                    </tspan>
                    <tspan x="561.26" dy={20}>
                        quis nos trud exerci tation ullamcorper suscipit lobortis nisl
                    </tspan>
                    <tspan x="561.26" dy={20}>
                        ut aliquip ex ea commodo consequat.
                    </tspan>
                    
                </text> */}
                {/* signature and name are here */}
                <text
                    x="980.401"
                    y="121.142"
                    fill="#FFFFFF"
                    fontFamily="Arvo-Bold"
                    fontSize={16}
                >
                    {certiType[0]}
                </text>
                <text
                    x="981.55"
                    y="139.142"
                    fill="#FFFFFF"
                    fontFamily="Arvo-Bold"
                    fontSize={16}
                >
                    {certiType[1]}
                </text>
            </g>

            <foreignObject
                x="300"
                y="440"
                className="-translate-x-1/2"
                fontSize="15.816"
                textAnchor="middle"
                fontFamily="AbhayaLibre-Regular"
                width="600px"
                height="150px"
                
            // x="561.26"
            //     y={455}
            //     fill="#272727"
            //     fontFamily="AbhayaLibre-Regular"
            //     fontSize="18.64"
            >

                <p >
                    {body}
                    {/* Anything after height 150px while go disapper. */}

                </p>
            </foreignObject>
        </>
    )
}

export default Content
