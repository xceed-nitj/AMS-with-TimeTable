import { useEffect, useRef } from 'react';
import Bottom from './Bottom';
import Content from './Content';
import Top from './Top';
import downloadCertificatePdf from '../../certipdfdownload';
import QRCode from 'qrcode';

function Template01() {
  const svgRef = useRef();

  useEffect(() => {

    const url = window.location.href; // Replace with your URL
    const svg = svgRef.current;

    QRCode.toDataURL(url, (err, dataUrl) => {
      if (err) throw err;

      const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      image.setAttribute('x', '100');
      image.setAttribute('y', '500');
      image.setAttribute('width', '100');
      image.setAttribute('height', '100');
      image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUrl);

      svg.appendChild(image);
    });
  }, []);

  return (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1122.52 793.7" id="svg" className="svg-img" ref={svgRef}>
        <Top />
        <Content />
        <Bottom />
      </svg>
      <button
        onClick={downloadCertificatePdf}
        style={{
          backgroundColor: 'blue',
          color: 'white',
          zIndex: '9999',
        }}
      >
        Download PDF
      </button>
    </>
  );
}

export default Template01;
