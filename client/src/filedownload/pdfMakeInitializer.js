import pdfMakeLib from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

const pdfMakeInitializer = () => {
  // Check if the pdfMake object already exists
  if (!globalThis.pdfMake) {
    // Create a new pdfMake instance with fonts
    const pdfMake = Object.assign({}, pdfMakeLib);
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
    globalThis.pdfMake = pdfMake;
  }
  return globalThis.pdfMake;
};

export default pdfMakeInitializer;