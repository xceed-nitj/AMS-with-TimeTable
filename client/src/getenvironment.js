// envUtils.js
function getEnvironment() {
    const currentURL = window.location.href;
    const development='http://localhost:8000'
    const production='https://nitjtt.onrender.com'
  
    if (currentURL.includes('localhost')) {
      return development;
    } else if (currentURL.includes('nitjtt')) {
      return production;
    } else {
      // Default to a specific environment or handle other cases
      return development;
    }
  }
  
  export default getEnvironment;
  