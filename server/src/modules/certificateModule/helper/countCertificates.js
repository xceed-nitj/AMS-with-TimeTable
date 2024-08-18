const participant = require("../../../models/certificateModule/participant");
const addEvent = require("../../../models/certificateModule/addevent");

const issuedCertificates = async (eventId) => {
  const event = await addEvent.findById(eventId, { cache: false });
  // event.certificatesIssued = event.certificatesIssued + 1;
  // console.log(event);
  const certificatesIssued = await participant.countDocuments({
    $and: [
      { eventId: eventId },
      { isCertificateSent: true },
    ],
  })
  event.certificatesIssued = certificatesIssued
  await event.save()
  return certificatesIssued;
}

const totalCertificates = async (eventId) => {
  const event = await addEvent.findById(eventId, { cache: false });
  // console.log(event);
  const totalCertificates = await participant.countDocuments({
    $and: [
      { eventId: eventId },
    ],
  })
  event.totalCertificates = totalCertificates
  await event.save()
  return totalCertificates;
}
module.exports = { issuedCertificates, totalCertificates }