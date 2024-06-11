
function getEnvironmentURL() {
    const currentURL = typeof window !== 'undefined' ? window.location.href : '';
    const localhostFrontend = 'http://localhost:5173';
    const nitjServer = 'https://xceed.nitj.ac.in';
    const productionFrontend = 'https://nitjtt.onrender.com';
  
    if (currentURL.includes('localhost')) {
      return localhostFrontend;
    } else if (currentURL.includes('nitjtt')) {
      return productionFrontend;
    } else if (currentURL.includes('xceed.nitj.ac.in')) {
      return nitjServer;
    } else {
      // Default to localhost if no match is found
      return localhostFrontend;
    }
  }
  
  module.exports = getEnvironmentURL;
  