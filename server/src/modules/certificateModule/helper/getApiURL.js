
function getApiURL(url) {
    const currentURL = url;
    const localhostBackend = 'http://localhost:8010';
    const nitjServer = 'https://xceed.nitj.ac.in';
    const productionFrontend = 'https://nitjtt.onrender.com';
  
    if (currentURL.includes('localhost')) {
      return localhostBackend;
    } else if (currentURL.includes('nitjtt')) {
      return productionFrontend;
    } else if (currentURL.includes('xceed.nitj.ac.in')) {
      return nitjServer;
    } else {
      // Default to localhost if no match is found
      return nitjServer;
    }
  }
  
  module.exports = getApiURL;
  