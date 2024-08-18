const HttpException = require("../../../models/http-exception");
const addEvent = require("../../../models/certificateModule/addevent");
const certificate = require("../../../models/certificateModule/certificate");

class UserEventService {
    async getUserEvents(userId) {
        if (!userId) {
            throw new HttpException(400, "Invalid User ID");
        }
        try {
            const events = await addEvent.find({ user: userId });
            return events;
        } catch (error) {
            throw new HttpException(500, error.message || "Error fetching user events");
        }
    }

    async getUniqueSignatures(userId) {
        if (!userId) {
            throw new HttpException(400, "Invalid User ID");
        }
        try {
            const events = await this.getUserEvents(userId);
            const eventIds = events.map(event => event._id);

            const uniqueSignatures = new Set();

            for (const eventId of eventIds) {
                const certificates = await certificate.find({ eventId });
                certificates.forEach(cert => {
                    cert.signatures.forEach(signature => {
                        uniqueSignatures.add(signature.url);
                    });
                });
            }

            return Array.from(uniqueSignatures);
        } catch (error) {
            throw new HttpException(500, error.message || "Server Error");
        }
    }

    async getUniqueLogos(userId) {
        if (!userId) {
            throw new HttpException(400, "Invalid User ID");
        }
        try {
            const events = await this.getUserEvents(userId);
            const eventIds = events.map(event => event._id);

            const uniqueLogos = new Set();

            for (const eventId of eventIds) {
                const certificates = await certificate.find({ eventId });
                certificates.forEach(cert => {
                    cert.logos.forEach(logo => {
                        uniqueLogos.add(logo.url);
                    });
                });
            }

            return Array.from(uniqueLogos);
        } catch (error) {
            throw new HttpException(500, error.message || "Server Error");
        }
    }

    async deleteSignature(userId, signatureUrl) {
        if (!userId) {
            throw new HttpException(400, "Invalid User ID");
        }
        try {
            const events = await this.getUserEvents(userId);
            const eventIds = events.map(event => event._id);
    
            // console.log(`Deleting signature: ${signatureUrl} for user: ${userId}`); // Log details
    
            for (const eventId of eventIds) {
                await certificate.updateMany(
                    { eventId },
                    { $pull: { signatures: { url: signatureUrl } } } // Correct path to 'url'
                );
            }
    
            return { message: "Signature deleted successfully from all certificates." };
        } catch (error) {
            // console.error(`Error deleting signature for user: ${userId} - ${error.message}`); // Log error details
            throw new HttpException(500, error.message || "Error deleting signature.");
        }
    }
    
    
    async deleteLogo(userId, logoUrl) {
        if (!userId) {
            throw new HttpException(400, "Invalid User ID");
        }
        try {
            const events = await this.getUserEvents(userId);
            const eventIds = events.map(event => event._id);

            for (const eventId of eventIds) {
                await certificate.updateMany(
                    { eventId },
                    { $pull: { logos: { url: logoUrl } } }
                );
            }

            return { message: "Logo deleted successfully from all certificates." };
        } catch (error) {
            throw new HttpException(500, error.message || "Error deleting logo.");
        }
    }
}

module.exports = UserEventService;
