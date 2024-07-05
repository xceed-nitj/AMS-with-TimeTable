// Importing necessary modules
const { removeBackground } = require('@imgly/background-removal-node');
const fs = require("fs");
const getEnvironmentURL = require("../../../getEnvironmentURL")
const apiURL = getEnvironmentURL() == "http://localhost:5173" ? "http://localhost:8010" : getEnvironmentURL()
// Function to remove background from an image
async function removeImageBackground(imgSource, eventId, fieldname, index, certiType) {
    try {
        if (!imgSource.includes(`${apiURL}/certificatemodule/images`)) {
            // Removing background
            const blob = await removeBackground(imgSource);

            // Converting Blob to buffer
            const buffer = Buffer.from(await blob.arrayBuffer());

            // Generating data URL
            const dataURL = `data:image/png;base64,${buffer.toString("base64")}`;
            // Returning the data URL
            fs.writeFileSync(`uploads/certificateModuleImages/${eventId}-${certiType}-${fieldname}-${index}.png`, dataURL.split(';base64,').pop(), { encoding: 'base64' });
            const path = `${apiURL}/certificatemodule/images/uploads/certificateModuleImages/${eventId}-${certiType}-${fieldname}-${index}.png`
            if (path && imgSource.includes("uploads")) {
                fs.unlink(imgSource, function (err) {
                    if (err) throw err;
                    console.log('File deleted!');
                })
            }
            return path;
        }else{
            return imgSource;
        }
    } catch (error) {
        // Handling errors
        throw new Error('Error removing background: ' + error);
    }
}

module.exports = { removeImageBackground }