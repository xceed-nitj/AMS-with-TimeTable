import pdfMake from 'pdfmake/build/pdfmake';
import Pvfs from 'pdfmake/build/vfs_fonts';

const pdfMakeInitializer = () => {
  // Check if the pdfMake object already exists
  if (!globalThis.pdfMake) {
    // Initialize pdfMake with the fonts
    pdfMake.vfs = Pvfs.vfs;
    globalThis.pdfMake = pdfMake;
  }
};

// export default pdfMakeInitializer;

// const pdfMakeInitializer = () => {
//   // Always ensure the VFS is initialized
//   pdfMake.vfs = pdfFonts.pdfMake.vfs;
  
//   // Make it global if needed
//   if (typeof window !== 'undefined') {
//     window.pdfMake = pdfMake;
//   }
  
//   return pdfMake;
// };

export default pdfMakeInitializer;