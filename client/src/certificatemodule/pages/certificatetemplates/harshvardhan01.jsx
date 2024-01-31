import ProxifiedImage from '../../components/ProxifiedImage';

export default function Template03() {
  var num_logos = logos.length;
  var num_left = 0;
  if (num_logos % 2 === 0) {
    num_left = num_logos / 2 - 1;
  } else {
    num_left = Math.floor(num_logos / 2);
  }
  return (
    <div>
      <svg
        width={400}
        height={280}
        viewBox="0 0 400 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_435_2)">
          <rect width={400} height={280} fill="white" />
          <path d="M128.802 278L0.0742188 134V278H128.802Z" fill="#EDEDED" />
          <path d="M96.9998 261.455L1 160V261.455H96.9998Z" fill="#D9D8D6" />
          <path
            opacity="0.6"
            d="M82.9093 244.182L112.909 278H87.8185L69.8184 259.342L82.9093 244.182Z"
            fill="#F08C65"
          />
          <path
            d="M27.2727 183.636L0 155.818V183.636L15.8183 197.818L27.2727 183.636Z"
            fill="#26364D"
          />
          <path d="M55.091 278L0 219.091V278H55.091Z" fill="#26364D" />
          <path
            opacity="0.5"
            d="M33.818 233.818L0 195.636V268.182L33.818 233.818Z"
            fill="#F08C65"
          />
          <path
            opacity="0.5"
            d="M51.2725 252.909L73.0905 278H26.7271L51.2725 252.909Z"
            fill="#F08C65"
          />
          <path
            d="M293 2.28882e-05L400.272 120V2.28882e-05H293Z"
            fill="#EDEDED"
          />
          <path
            d="M319.88 2.28882e-05L399.88 84.5455V2.28882e-05H319.88Z"
            fill="#D9D8D6"
          />
          <path
            d="M377.607 78.6364L400.334 101.818V78.6364L387.153 66.8182L377.607 78.6364Z"
            fill="#26364D"
          />
          <path
            d="M354.425 3.8147e-06L400.334 49.0909V3.8147e-06H354.425Z"
            fill="#26364D"
          />
          <path
            opacity="0.5"
            d="M372.153 36.8182L400.334 68.6364V8.18182L372.153 36.8182Z"
            fill="#F08C65"
          />
          <path
            opacity="0.5"
            d="M357.608 20.9091L339.426 3.05176e-05H378.062L357.608 20.9091Z"
            fill="#F08C65"
          />
        </g>
        <defs>
          <clipPath id="clip0_435_2">
            <rect width={400} height={280} fill="white" />
          </clipPath>
        </defs>
        <foreignObject width={'90%'} height={'400'} y={'80'} x={'5%'}>
          <div className="tw-flex tw-items-center tw-justify-center tw-w-full">
            {logos.map((item, key) => (
              <div
                key={key}
                className="tw-flex tw-items-center tw-justify-center "
              >
                <div className="tw-w-20 tw-shrink-0 tw-mx-6">
                  <img src={item} alt="" />
                </div>
                <div className="tw-text-center">
                  {key === num_left && (
                    <>
                      <p className="tw-font-nunito-bold tw-text-xl tw-font-medium">
                        डॉ. बी आर अम्बेडकर राष्ट्रीय प्रौद्योगिकी संस्थान जालंधर
                      </p>
                      <p className="tw-font-nunito-bold tw-text-[12px]">
                        जी.टी. रोड, अमृतसर बाईपास, जालंधर (पंजाब), भारत- 144011
                      </p>
                      <p className="tw-font-nunito-bold tw-text-xl tw-font-semibold">
                        Dr. B R Ambedkar National Institute of Technology
                        Jalandhar
                      </p>
                      <p className="tw-font-nunito-bold tw-text-[12px] ">
                        G.T. Road, Amritsar Byepass, Jalandhar (Punjab), India-
                        144011
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </foreignObject>

        <foreignObject x="10%" y="200.473" width="85%" height="160">
          <div className="tw-mt-8 tw-text-center tw-flex-col tw-flex tw-gap-1">
            {header.map((item, ind) => (
              <h1
                className="tw-text-xl tw-font-semibold tw-text-gray-700 tw-uppercase"
                key={ind}
              >
                {item}
              </h1>
            ))}
          </div>
        </foreignObject>

        <text
          x="561.26"
          y="340.473"
          fill="#424847"
          fontFamily="AbhayaLibre-Regular"
          fontSize="40.707"
          textAnchor="middle"
          fontWeight="550"
        >
          CERTIFICATE OF APPRECIATION
        </text>

        <foreignObject x="12.5%" y="370.473" width="75%" height="160">
          <p className="font-serif text-xl opacity-80">
            <div>{ReactHtmlParser(contentBody)}</div>
          </p>
        </foreignObject>

        <foreignObject x={'20%'} y={515} width={'60%'} height={400}>
          <div className="tw-flex-wrap tw-flex tw-items-center tw-justify-between tw-gap-6 tw-px-6 ">
            {signature.map((item, key) => (
              <div
                key={key}
                className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2"
              >
                <div className="tw-w-[100px]">
                  <ProxifiedImage src={item.url} alt="" />
                </div>
                <div className="tw-bg-gray-500 tw-rounded-xl tw-p-[1px] tw-w-[100px] tw-h-[1px]" />
                <p className="tw-text-black tw-text-[15px] tw-font-semibold">
                  {item.name}
                </p>
                <p className="tw-text-[13px] -tw-mt-3 tw-text-gray-900">
                  {item.position}
                </p>
              </div>
            ))}
          </div>
        </foreignObject>

        <foreignObject x={'20%'} y={'90%'} width={'60%'} height={'100'}>
          <div className="tw-text-sm tw-text-center tw-text-gray-700 ">
            verifiable link
          </div>
        </foreignObject>
      </svg>
    </div>
  );
}
