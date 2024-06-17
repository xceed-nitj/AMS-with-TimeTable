// import { useEffect } from 'react';

// const TabVisibilityHandler = ({ onTabChange }) => {
//   useEffect(() => {
//     const handleVisibilityChange = () => {
//       if (document.visibilityState === 'visible') {
//         onTabChange(true); // Tab is active (visible)
//       } else {
//         onTabChange(false); // Tab is inactive (hidden)
//       }
//     };

//     document.addEventListener('visibilitychange', handleVisibilityChange);

//     return () => {
//       document.removeEventListener('visibilitychange', handleVisibilityChange);
//     };
//   }, [onTabChange]);

//   return null;
// };

// export default TabVisibilityHandler;
