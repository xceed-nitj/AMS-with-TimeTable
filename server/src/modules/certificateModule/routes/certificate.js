const express = require("express");
const certificateRouter = express.Router();
const CertificateController = require("../controllers/certificate");
const certificateController = new CertificateController();

// Route to create a new certificate
certificateRouter.post("/content/:id", async (req, res) => {
  try {
    const newcertificate=await certificateController.addcertificate(req.params.id, req.body);
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
    const id=req.params?.id;
    const type=req.params?.type;
    const allCertificates = await certificateController.getcertificateByEventId(id,type);
    return res.status(200).json(allCertificates);
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
certificateRouter.put('/:certificateId', async (req, res) => {
  try {
    const certificateId = req.params.certificateId;
    const updatedCertificate = req.body;
    const updatedone=await certificateController.updatecertificate(certificateId, updatedCertificate);
    return res.status(200).json(updatedone);
  } 
  catch (e) {
    return res
      .status(e?.status || 500)
      .json({ error: e?.message || "Internal Server Error" });
  }
});

// Route to delete a specific certificate by ID
certificateRouter.delete("/:certificateId", async (req, res) => {
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


module.exports = certificateRouter;