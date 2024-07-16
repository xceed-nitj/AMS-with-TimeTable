const puppeteer = require('puppeteer');
const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const Participant = require('../../../models/certificateModule/participant');


async function convertallCertificatesToImage(req, res) {
    // const { url } = req.body || {};
    const type = "image";
    const eventID = "66938b189a2a42bb89e94769";
    const participantList = await Participant.find({ eventId: eventID })
    const zip = new JSZip();
    const imageFolder = zip.folder('images');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    for (let i = 0; i < participantList.length; i++) {
        let participantID = participantList[i]._id
        const svgUrl = `http://localhost:5173/cm/c/${eventID}/${participantID}`;
        console.log(svgUrl)
        try {
            // Original viewport size
            const originalWidth = 841;
            const originalHeight = 595;

            await page.goto(svgUrl, { waitUntil: 'networkidle0', timeout: 30000 });
            await page.waitForSelector('.chakra-image');
            await page.setViewport({ width: originalWidth, height: originalHeight, deviceScaleFactor: 4 }); //enhance quality of image



            let data = await page.screenshot({ type: 'png', });
            imageFolder.file(`image${i + 1}.png`, data);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).send('Error generating certificate.');
        }
    }
    await browser.close();
    zip.generateAsync({ type: 'nodebuffer' }).then((content) => {
        const filePath = path.join(__dirname, 'images.zip');
        fs.writeFileSync(filePath, content);
        res.download(filePath, 'images.zip', () => {
            fs.unlinkSync(filePath);
        });
    });
}


async function convertallCertificatesToPDF(req, res) {
    const { url } = req.body || {};
    const svgUrl = url;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let data;
    try {
        // Original viewport size
        const originalWidth = 841;
        const originalHeight = 595;

        await page.goto(svgUrl, { waitUntil: 'networkidle0', timeout: 30000 });
        await page.waitForSelector('.chakra-image');
        await page.setViewport({ width: originalWidth, height: originalHeight, deviceScaleFactor: 4 }); //enhance quality of image



        data = await page.screenshot({ type: 'png', });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error generating certificate.');
    }

    try {
        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        // Embed the PNG image into the PDF
        const pngImage = await pdfDoc.embedPng(data);
        const { width, height } = pngImage.scale(1);

        // Add a page with the dimensions of the PNG image
        const Page = pdfDoc.addPage([width, height]);
        Page.drawImage(pngImage, {
            x: 0,
            y: 0,
            width,
            height,
        });

        // Serialize the PDF document to bytes (a Uint8Array)
        const pdfBytes = await pdfDoc.save();
        // Send the PDF buffer as a response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=image.pdf');
        res.send(Buffer.from(pdfBytes));
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('Error generating PDF.');
    }
}


module.exports = { convertallCertificatesToImage, convertallCertificatesToPDF }