function Content({ name = 'Testing' }) {
  return (
    <>
      <g textAnchor="middle">
        <text x="561" y="115" fontFamily="Nunito-Bold" fontSize="16">
          डॉ. बी आर अम्बेडकर राष्ट्रीय प्रौद्योगिकी संस्थान जालंधर
        </text>
        <text x="561" y="129" fontFamily="Nunito-Bold" fontSize="10">
          जी.टी. रोड, अमृतसर बाईपास, जालंधर (पंजाब), भारत-144008
        </text>
        <text x="561" y="155" fontFamily="Nunito-Bold" fontSize="14">
          Dr. B R Ambedkar National Institute of Technology Jalandhar
        </text>
        <text x="561" y="168" fontFamily="Nunito-Bold" fontSize="10">
          G.T. Road, Amritsar Byepass, Jalandhar (Punjab), India- 144008
        </text>

        <text
          x="561.26"
          y={245}
          fill="#272727"
          fontFamily="Butler-Bold"
          fontSize={47}
        >
          CERTIFICATE
        </text>
        <text
          x="561.26"
          y={268}
          fill="#272727"
          fontFamily="AbhayaLibre-Regular"
          fontSize={18}
        >
          OF ACHIEVEMENT
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
          BEST
        </text>
        <text
          x="981.55"
          y="139.142"
          fill="#FFFFFF"
          fontFamily="Arvo-Bold"
          fontSize={16}
        >
          AWARD
        </text>
      </g>

      <foreignObject
        x="850"
        className="-translate-x-1/2"
        y="460"
        fontSize="15.816"
        textAnchor="middle"
        fontFamily="AbhayaLibre-Regular"
        width="600px"
        height="100px"
        // x="561.26"
        //     y={455}
        //     fill="#272727"
        //     fontFamily="AbhayaLibre-Regular"
        //     fontSize="18.64"
      >
        <p className="w-full">
          of team __________ from the department ________________________ has
          won the ________________________ in PixelPerfect Event, an internal
          design held from 13 June,2023 to 1st July,2023 organized by Website
          Development & management Club.
          {/* This is a paragraph. Anything after height 100px while go disapper. */}
        </p>
      </foreignObject>
    </>
  );
}

export default Content;
