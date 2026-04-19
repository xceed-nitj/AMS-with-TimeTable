// envUtils.js
function getEnvironment() {
  const { hostname } = window.location;
  const development = 'http://localhost:8010';
  const production = 'https://nitjtt.onrender.com';
  const nitjServer = 'https://xceed.nitj.ac.in';

  const isLocalDev =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.16.');

  if (isLocalDev) {
    return development;
  } else if (hostname.includes('nitjtt')) {
    return production;
  } else {
    // Default to a specific environment or handle other cases
    return nitjServer;
  }
}

export default getEnvironment;
