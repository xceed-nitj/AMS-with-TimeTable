// envUtils.js
function getEnvironment() {
  const currentURL = window.location.href;
  const development = 'http://localhost:8010';
  const production = 'https://nitjtt.onrender.com';
  const nitjServer = 'https://xceed.nitj.ac.in';
  if (currentURL.includes('localhost')) {
    return development;
  } else if (currentURL.includes('nitjtt')) {
    return production;
  } else {
    // Default to a specific environment or handle other cases
    return nitjServer;
  }
}

export default getEnvironment;
