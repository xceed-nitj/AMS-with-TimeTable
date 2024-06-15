import * as pdfMake from 'pdfmake/build/pdfmake';
import * as Pvfs from 'pdfmake/build/vfs_fonts';

const pdfMakeInitializer = () => {
    // Check if the pdfMake object already exists
    if (!globalThis.pdfMake) {
        // Initialize pdfMake with the fonts
        pdfMake.vfs = Pvfs.vfs;
        globalThis.pdfMake = pdfMake;
    }
};

export default pdfMakeInitializer;
