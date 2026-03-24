import * as pdfMake from 'pdfmake/build/pdfmake';
import * as Pvfs from 'pdfmake/build/vfs_fonts';

const pdfMakeInitializer = () => {
  if (!globalThis.pdfMake) {
    const pdfMakeWithVfs = { ...pdfMake, vfs: Pvfs.vfs };
    globalThis.pdfMake = pdfMakeWithVfs;  // ← use the one with vfs
  }
};

export default pdfMakeInitializer;