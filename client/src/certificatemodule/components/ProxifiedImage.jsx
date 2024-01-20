import { useEffect, useState } from 'react';
import getEnvironment from '../../getenvironment';

const ProxifiedImage = ({ src, ...rest }) => {
  const apiUrl = getEnvironment();
  const [imgSrc, setImgSrc] = useState(null);

  useEffect(() => {
    function arrayBufferToBase64(buffer) {
      var binary = '';
      var bytes = new Uint8Array(buffer);
      bytes.forEach((b) => (binary += String.fromCharCode(b)));
      return window.btoa(binary);
    }

    function downloadImageLocal(link) {
      // Return the fetch promise
      return fetch(`${apiUrl}/proxy-image?url=${link}`)
        .then((res) => res.arrayBuffer())
        .then((buffer) => {
          const base64Flag = 'data:image/jpeg;base64,';
          const imageStr = arrayBufferToBase64(buffer);
          const output = base64Flag + imageStr;
          return output;
        });
    }
    // console.log('src', src);
    downloadImageLocal(src).then((res) => {
      setImgSrc(res);
    });
  }, [src]);

  return <img src={imgSrc} {...rest} />;
};

export default ProxifiedImage;
