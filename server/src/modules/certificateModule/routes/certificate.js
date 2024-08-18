const express = require("express");
const certificateRouter = express.Router();
const CertificateController = require("../controllers/certificate");
const certificateController = new CertificateController();
// const ecmadminRoute = require("../../usermanagement/ecmadminroute");
const LockStatus = require("../helper/lockstatus");
const { upload } = require("../helper/multer.middleware")
const { convertToObject } = require("../controllers/formDataToObject")
const { getImagesOfUserByEventId } = require("../controllers/signimagesofuser")
const { convertCertificateToImage, convertCertificateToPDF } = require("../controllers/convertCertificate")
const { convertallCertificates } = require("../controllers/convertAllCertificates")
const { checkRole } = require("../../checkRole.middleware");
const UserEventService = require("../controllers/logoAndSignatureofUser");
const userEventService = new UserEventService();

// Route to create a new certificate
certificateRouter.post("/content/:id", checkRole(['CM']), LockStatus, upload.any(), async (req, res) => {
  try {
    console.log(req.body)
    const url = req.body.url;
    // console.log(req.files)
    const body = await convertToObject(req.params.id, req.body, req.files, url)
    const newcertificate = await certificateController.addcertificate(req.params.id, body);
    return res.status(200).json(newcertificate);
  } catch (e) {
    return res

      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to get all certificates
certificateRouter.get("/", async (req, res) => {
  try {
    const allCertificates = await certificateController.getAllcertificates();
    return res.status(200).json(allCertificates);
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

certificateRouter.get("/getcertificatedetails/:id/:type", async (req, res) => {
  try {
    const id = req.params?.id;
    const type = req.params?.type;
    const allCertificates = await certificateController.getcertificateByEventId(id, type);
    return res.status(200).json(allCertificates);
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});


certificateRouter.get("/getcertificateimages/:id", async (req, res) => {
  try {
    const id = req.params?.id;
    const allImages = await getImagesOfUserByEventId(id);
    return res.status(200).json(allImages);
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});


// Route to get a specific certificate by ID
certificateRouter.get("/:certificateId", async (req, res) => {
  try {
    const certificateId = req.params?.certificateId;
    const certificate = await certificateController.getcertificateById(certificateId);
    return res.status(200).json(certificate);
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to update a specific certificate by ID
certificateRouter.put('/:certificateId', checkRole(['CM']), LockStatus, async (req, res) => {
  try {
    const certificateId = req.params.certificateId;
    const updatedCertificate = req.body;
    const updatedone = await certificateController.updatecertificate(certificateId, updatedCertificate);
    return res.status(200).json(updatedone);
  }
  catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to delete a specific certificate by ID
certificateRouter.delete("/:certificateId", checkRole(['CM']), LockStatus, async (req, res) => {
  try {
    const certificateId = req.params?.certificateId;
    await certificateController.deletecertificateById(certificateId);
    return res.status(200).json({ response: "Certificate deleted successfully" });
  }
  catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});


// Route to get unique signatures of a user by event ID
certificateRouter.get("/signatures/:userId",checkRole(['admin']), async (req, res) => {
  try {
    const userId = req.params.userId;
    const signatures = await userEventService.getUniqueSignatures(userId);
    return res.status(200).json(signatures);
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to get unique logos of a user by event ID
certificateRouter.get("/logos/:userId",checkRole(['admin']), async (req, res) => {
  try {
    const userId = req.params.userId;
    const logos = await userEventService.getUniqueLogos(userId);
    return res.status(200).json(logos);
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to delete a signature across all certificates
certificateRouter.delete("/signatures/:userId", checkRole(['admin']), async (req, res) => {
  try {
    const userId = req.params.userId;
    const { signatureUrl } = req.body; // Expecting the URL in the body
    const response = await userEventService.deleteSignature(userId, signatureUrl);
    return res.status(200).json(response); // Updated to use res.status
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});


// Route to delete a logo across all certificates
certificateRouter.delete("/logos/:userId", checkRole(['admin']), async (req, res) => {
  try {
    const userId = req.params.userId;
    // console.log(userId)
    // console.log(req.body)
    const { logoUrl } = req.body; // Expecting the URL in the body
    const response = await userEventService.deleteLogo(userId, logoUrl);
    return res.status(200).json(response); // Update this line
  } catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});



// Route to download Certificate
certificateRouter.post("/download/image", convertCertificateToImage);
certificateRouter.post("/download/pdf", convertCertificateToPDF);
certificateRouter.post("/downloadall", convertallCertificates);


module.exports = certificateRouter;