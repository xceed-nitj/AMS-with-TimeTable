import { useEffect, useRef, useState } from 'react';
import Bottom from './Bottom';
import Content from './Content';
import Top from './Top';
import html2canvas from 'html2canvas';
// import downloadCertificatePdf from '../../certipdfdownload';
import QRCode from 'qrcode';
import { Button, Spinner } from '@chakra-ui/react';
// import jsPDF from 'jspdf';
import getEnvironment from '../../../../getenvironment';

function Template01() {
  const svgRef = useRef();
  const apiUrl = getEnvironment();
  const [imageDownloading, setImageDownloading] = useState(false)
  const [imageDownloaded, setImageDownloaded] = useState(false)
  const [pdfDownloading, setpdfDownloading] = useState(false)
  const [pdfDownloaded, setpdfDownloaded] = useState(false)

  useEffect(() => {
    const url = window.location.href; // Replace with your URL
    const svg = svgRef.current;

    QRCode.toDataURL(url, (err, dataUrl) => {
      if (err) throw err;

      const image = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'image'
      );
      image.setAttribute('x', '100');
      image.setAttribute('y', '500');
      image.setAttribute('width', '100');
      image.setAttribute('height', '100');
      image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUrl);

      svg.appendChild(image);
    });
  }, []);

  
  // async function saveDOMToHtmlFile(domElement) {
  //   try {
  //     const images = domElement.getElementsByTagName("img")
  //     // console.log(images)
  //     for (let i = 0; i < images.length; i++) {
  //       if (images[i].src) {
  //         const response = await fetchImageToDataURL(`${apiUrl}/proxy-image/?url=${images[i].src}`,images[i].src)
  //         // console.log(response);
  //         if (response && !(response == "error")) {
  //           console.log(images[i].src)
  //           const dataUrl = await response;
  //           images[i].src = dataUrl;
  //           // console.log(dataUrl);
  //         } else {
  //           images[i].remove()
  //         }
  //       } else {
  //         images[i].remove()
  //       }
  //     }
  //   } catch (error) {
  //     console.error(error)
  //   }
  //   const htmlString = domElement.outerHTML;
  //   const blob = new Blob([htmlString], { type: 'text/html' });
  //   const file = new File([blob], "Certificate", { type: "text/html" });
  //   return file;
  // }
  const handleDownloadImage = async () => {
    try {
      if (imageDownloaded) {
        const ans = confirm("you want to download again")
        if (!ans) {
          return;
        }
      }
      setImageDownloading(true)
      const input = document.getElementById('id-card-class').firstElementChild;
      input.style.padding="0px";
      input.style.margin="0px";
      // input.style.width = '841.92px';
      // input.style.height = '595.499987px';
      html2canvas(input, {
        x:1,
        y:1,
        width:input.firstElementChild.clientWidth,
        height:input.firstElementChild.clientHeight,
        logging: true,
        allowTaint: true,
        backgroundColor: "white",
        useCORS: true,
        foreignObjectRendering: true,
        scale:5,
      }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;

        link.download = 'certificate-by-XCEED.png';
        link.click();
        setImageDownloading(false)
      });
    } catch (error) {
      console.error(error);
      setImageDownloading(false);
    }
  };

    // const handleDownloadPDF = () => {
    //   // const input = document.getElementById('id-card');
    //   const input = document.getElementsByClassName('id-card-class');
    //   input.style.width = '1754px';
    //   input.style.height = '1240px';
    //   html2canvas(input, {
    //     logging: true,
    //     allowTaint: true,
    //     backgroundColor: '#ffffff',
    //     useCORS: true,
    //     foreignObjectRendering: true,
    //     scrollX: 0,
    //     scrollY: 0,
    //     windowWidth: document.documentElement.offsetWidth,
    //     windowHeight: document.documentElement.offsetHeight,
    //   }).then((canvas) => {
    //     const imgData = canvas.toDataURL('image/png');

    //     const pdf = new jsPDF({
    //       orientation: 'landscape',
    //       unit: 'px',
    //       format: [1754, 1240],
    //     });
    //     pdf.addImage(imgData, 'JPEG', 0, 0, 1754, 1240);
    //     pdf.save('download.pdf');
    //   });
    //   input.style.height = 'auto';
    //   input.style.width = 'auto';
    // };


    // const handleDownloadImage = async () => {
    //   try {
    //     if (imageDownloaded) {
    //       const ans = confirm("you want to download again")
    //       if (!ans) {
    //         return;
    //       }
    //     }
    //     setImageDownloading(true)
    //     const response = await fetch(
    //       `${apiUrl}/certificatemodule/certificate/download/image`,
    //       {
    //         method: 'POST',
    //         headers: {"Content-Type": "application/json"},
    //         credentials: 'include',
    //         body: JSON.stringify({url : window.location.href}),
    //       }
    //     );
    //     const data = await response.blob();
    //     const blob = new Blob([data], { type: 'image/png' });
    //     const url = URL.createObjectURL(blob);
    //     const link = document.createElement('a');
    //     link.href = url;
    //     link.download = 'certificate.' + 'png';
    //     link.click();
    //     URL.revokeObjectURL(url);
    //     setImageDownloading(false)
    //   } catch (error) {
    //     console.error('Error downloading:', error);
    //     alert('An unexpected error occurred while downloading image. Please try again later.');
    //     setImageDownloading(false)
    //   }
    // };
    // const handleDownloadImage = async () => {
    //   try {
    //     if (imageDownloaded) {
    //       const ans = confirm("you want to download again")
    //       if (!ans) {
    //         return;
    //       }
    //     }
    //     setImageDownloading(true)
    //     const html = document.getElementsByTagName("html")[0].cloneNode("html")
    //     const file = await saveDOMToHtmlFile(html)
    //     // console.log(file)
    //     console.log(html)
    //     let formData = new FormData()
    //     formData.append("certificate", file)
    //     const response = await fetch(
    //       `${apiUrl}/certificatemodule/certificate/download/image`,
    //       {
    //         method: 'POST',
    //         credentials: 'include',
    //         body: formData,
    //       }
    //     );
    //     const data = await response.blob();
    //     const blob = new Blob([data], { type: 'image/png' });
    //     const url = URL.createObjectURL(blob);
    //     const link = document.createElement('a');
    //     link.href = url;
    //     link.download = 'certificate.' + 'png';
    //     link.click();
    //     URL.revokeObjectURL(url);
    //     setImageDownloading(false)
    //   } catch (error) {
    //     console.error('Error downloading:', error);
    //     alert('An unexpected error occurred while downloading image. Please try again later.');
    //     setImageDownloading(false)
    //   }
    // };

    const handleDownloadPDF = async () => {
      try {
        if (pdfDownloaded) {
          const ans = confirm("you want to download again")
          if (!ans) {
            return;
          }
        }
        setpdfDownloading(true)
        const html = document.getElementsByTagName("html")[0].cloneNode("html")
        // console.log(html)
        const file = await saveDOMToHtmlFile(html)
        // console.log(file)
        let formData = new FormData()
        formData.append("certificate", file)
        const response = await fetch(
          `${apiUrl}/certificatemodule/certificate/download/pdf`,
          {
            method: 'POST',
            credentials: 'include',
            body: formData,
          },
          { responseType: 'blob' }
        );
        const data = await response.blob();
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'certificate.pdf');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        setpdfDownloading(false)
      } catch (error) {
        console.error('Error downloading the PDF:', error);
        alert('An unexpected error occurred while downloading pdf. Please try again later.');
        setpdfDownloading(false)
      }
    }
    const handleClick = (type) => {
      if (type == "image") { setImageDownloaded(true); handleDownloadImage() }
      else if (type == "pdf") { setpdfDownloaded(true); handleDownloadPDF() }
    }
    return (
      <>
        <div id="id-card-class" >
          <Content />
        </div>
        <div className='tw-hidden'>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1122.52 793.7"
            ref={svgRef}
          >
            <Top />
            <Bottom />
          </svg>
        </div>
        <div className="tw-flex tw-items-center">
          {imageDownloading ? <p>Downloading <Spinner /></p> : <Button disabled={imageDownloading} onClick={(e) => { handleClick("image") }} variant="solid" colorScheme="teal">
            Download Image
          </Button>}
          {/* {pdfDownloading ? <p>Downloading <Spinner /></p> : <Button disabled={pdfDownloading} onClick={(e) => { handleClick("pdf") }} variant="outline" colorScheme="teal">
            Download PDF
          </Button>} */}
          </div>
      </>
    );
  }

  export default Template01;
