const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function main() {
    const formData = new FormData();
    formData.append('file', fs.createReadStream('c:/Users/KARAN/OneDrive/Desktop/Coding/IAMS/AMS-with-TimeTable/python-ml-service/dummy_video.mp4')); // Use generated video
    
    try {
        console.log("Connecting...");
        const response = await axios({
            method: 'post',
            url: `http://localhost:8501/institute-gate-identify-video`,
            data: formData,
            headers: formData.getHeaders(),
            responseType: 'stream',
            timeout: 0,
        });

        response.data.on('data', (chunk) => {
            console.log("Received chunk of size", chunk.length);
        });

        response.data.on('error', (err) => {
            console.error("Stream error:", err);
        });

        response.data.on('end', () => {
            console.log("Stream ended.");
        });

    } catch (err) {
        console.error("Axios Error:", err.message);
    }
}

main();
