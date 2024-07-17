const puppeteer = require('puppeteer');
const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const Participant = require('../../../models/certificateModule/participant');


async function convertallCertificatesToImage(eventID, participantList, baseURL,res) {
    const zip = new JSZip();
    const imageFolder = zip.folder('images');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    for (let i = 0; i < participantList.length; i++) {
        let participantID = participantList[i]._id
        const svgUrl = `${baseURL}/cm/c/${eventID}/${participantID}`;
        console.log(svgUrl)
        try {
            // Original viewport size
            const originalWidth = 841;
            const originalHeight = 595;

            await page.goto(svgUrl, { waitUntil: 'networkidle0', timeout: 30000 });
            await page.setViewport({ width: originalWidth, height: originalHeight, deviceScaleFactor: 4 }); //enhance quality of image



            let data = await page.screenshot({ type: 'png', });
            imageFolder.file(`${participantList[i].name}.png`, data);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).send('Error generating certificate.');
        }
    }
    await browser.close();
    zip.generateAsync({ type: 'nodebuffer' }).then((content) => {
        res.set({
            'Content-Disposition': 'attachment; filename="certificates.zip"',
            'Content-Type': 'application/zip',
        });
        res.send(content);
    }).catch(err => {
        console.error('Error generating zip:', err);
        res.status(500).send('Error generating zip');
    });
}


async function convertallCertificatesToPDF(eventID, participantList, baseURL,res) {
    const zip = new JSZip();
    const pdfFolder = zip.folder('pdf');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    for (let i = 0; i < participantList.length; i++) {
        let participantID = participantList[i]._id
        const svgUrl = `${baseURL}/cm/c/${eventID}/${participantID}`;
        console.log(svgUrl)
        try {
            // Original viewport size
            const originalWidth = 841;
            const originalHeight = 595;

            await page.goto(svgUrl, { waitUntil: 'networkidle0', timeout: 30000 });
            await page.setViewport({ width: originalWidth, height: originalHeight, deviceScaleFactor: 4 }); //enhance quality of image



            let data = await page.screenshot({ type: 'png', });

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
            const buff = Buffer.from(pdfBytes)
            pdfFolder.file(`${participantList[i].name}.pdf`, buff);

        } catch (error) {
            console.error('Error:', error);
            res.status(500).send('Error generating certificate.');
        }
    }
    await browser.close();
    zip.generateAsync({ type: 'nodebuffer' }).then((content) => {
        res.set({
            'Content-Disposition': 'attachment; filename="certificates.zip"',
            'Content-Type': 'application/zip',
        });
        res.send(content);
    }).catch(err => {
        console.error('Error generating zip:', err);
        res.status(500).send('Error generating zip');
    });


}


const convertallCertificates = async (req, res) => {
    const { eventID, type } = req.body;
    const baseURL = req.headers.origin;
    const participantList = await Participant.find({ eventId: eventID });
    if (type === "image") { convertallCertificatesToImage(eventID, participantList, baseURL,res) }
    else if (type === "pdf") { convertallCertificatesToPDF(eventID, participantList, baseURL,res) }
    else {
        res.status(500).json({
            error: "Type not found"
        })
    }
}

module.exports = { convertallCertificates }