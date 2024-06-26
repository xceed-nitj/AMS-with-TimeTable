const participant = require("../../../models/certificateModule/participant");
const addEvent = require("../../../models/certificateModule/addevent");

const issuedCertificates = async (eventId) => {
    const event = await addEvent.findById(eventId, { cache: false });
        console.log(event);
        const certificateIssued = await participant.countDocuments({
          $and: [
            { eventId: eventId },
            { isCertificateSent: true },
          ],
        })
        console.log(certificateIssued)
        event.certificateIssued = certificateIssued
        await event.save()
}

module.exports = {issuedCertificates}