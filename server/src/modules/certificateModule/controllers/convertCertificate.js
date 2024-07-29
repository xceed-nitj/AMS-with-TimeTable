const puppeteer = require('puppeteer');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const HttpException = require("../../../models/http-exception");
const path = require('path');


async function convertCertificateToImage(req, res) {
    console.log(req.files)
    const url = req?.files?.certificate[0]?.path;
    console.log(url)
    if (!url) {
        throw new HttpException(404, "file not recieved")
    }
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let data;
    try {
        // Original viewport size
        const originalWidth = 841;
        const originalHeight = 595;
        const filePath = path.join("file:///", __dirname, "/../../../../", url)

        await page.goto(filePath, { waitUntil: 'networkidle0', timeout: 30000 });
        await page.setViewport({ width: originalWidth, height: originalHeight, deviceScaleFactor: 4 }); //enhance quality of image



        data = await page.screenshot({ type: 'png', });
        if (data) {
            fs.unlink(url, err => console.log(err))
        }
        await browser.close();

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', 'attachment; filename=certificate.png');
        res.send(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error generating certificate.');
    }
}


async function convertCertificateToPDF(req, res) {
    console.log(req.files)
    const url = req?.files?.certificate[0]?.path;
    console.log(url)
    if (!url) {
        throw new HttpException(404, "file not recieved")
    }
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let data;
    try {
        // Original viewport size
        const originalWidth = 841;
        const originalHeight = 595;
        const filePath = path.join("file:///", __dirname, "/../../../../", url)

        await page.goto(filePath, { waitUntil: 'networkidle0', timeout: 30000 });
        await page.setViewport({ width: originalWidth, height: originalHeight, deviceScaleFactor: 4 }); //enhance quality of image



        data = await page.screenshot({ type: 'png', });
        if (data) {
            fs.unlink(url, err => console.log(err))
        }
    } catch (error) {
        console.log('Error:', error);
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
        console.log('Error:', error.message);
        res.status(500).send('Error generating PDF.');
    }
}


module.exports = { convertCertificateToImage, convertCertificateToPDF }