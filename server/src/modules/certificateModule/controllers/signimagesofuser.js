const HttpException = require("../../../models/http-exception");
const addEvent = require("../../../models/certificateModule/addevent");
const certificate = require("../../../models/certificateModule/certificate");

const getImagesOfUserByEventId = async (id) => {
    if (!id) {
        throw new HttpException(400, "Invalid Id");
    }
    try {
        const event = await addEvent.findById(id)
        const userId = event.user
        const events = await addEvent.find({ user: userId })
        const eventIds = events.map((event) => (event._id))
        const Signatures = [];
        for (let i = 0; i < eventIds.length; i++) {
            const certificates = await certificate.find({ eventId: eventIds[i] })
            certificates.forEach((cert) => {
                cert.signatures.forEach(signt => {Signatures.push(signt)});
            }
            )
        }
        console.log(Signatures)
        return Signatures
    } catch (error) {
        throw new HttpException(500, error)
    }
}

module.exports = { getImagesOfUserByEventId }