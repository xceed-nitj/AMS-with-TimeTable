// Importing necessary modules
const { removeBackground } = require('@imgly/background-removal-node');
const fs = require("fs");
const { base } = require('../../../models/certificateModule/certificate');
// Function to remove background from an image
async function removeImageBackground(imgSource, eventId, fieldname, index) {
    try {
        console.log("entered bgremove")
        // Removing background
        const blob = await removeBackground(imgSource);
        console.log("blob done")

        // Converting Blob to buffer
        const buffer = Buffer.from(await blob.arrayBuffer());

        // Generating data URL
        const dataURL = `data:image/png;base64,${buffer.toString("base64")}`;
        // Returning the data URL
        fs.writeFileSync(`uploads/tempImg/${eventId}-${fieldname}-${index}.png`, dataURL.split(';base64,').pop(), { encoding: 'base64' });
        const path = `tempImg/${eventId}-${fieldname}-${index}.png`
        if (path && imgSource.includes("uploads/tempImg")) {
            fs.unlink(imgSource, function (err) {
                if (err) throw err;
                console.log('File deleted!');
            })
        }
        console.log("exited bgremove")
        return path;
    } catch (error) {
        // Handling errors
        throw new Error('Error removing background: ' + error);
    }
}

module.exports = { removeImageBackground }