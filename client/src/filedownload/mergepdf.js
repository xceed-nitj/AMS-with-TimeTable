import { PDFDocument } from 'pdf-lib';

function downloadMergedPdf(mergedPdfBytes, fileName) {
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;

    link.download = fileName;
    link.click();

    // Clean up the URL object
    URL.revokeObjectURL(url);

}

async function mergePdfs(buffer,fileName) {
    try {
        const mergedPdfDoc = await PDFDocument.create();

        for (let i in buffer) {
            const pdfDoc1 = await PDFDocument.load(buffer[i]);
            const copiedPage = await mergedPdfDoc.copyPages(pdfDoc1,pdfDoc1.getPageIndices());
            console.log(copiedPage[0])
            for(let j in copiedPage){
                mergedPdfDoc.addPage(copiedPage[j]);
            }
        }


        // Save the merged PDF
        const mergedPdfBytes = await mergedPdfDoc.save();
        downloadMergedPdf(mergedPdfBytes,fileName);
        // Do something with the merged PDF bytes, e.g., create a Blob, download, etc.
    } catch (error) {
        console.error('Error merging PDFs:', error);
    }
}

export default mergePdfs;
