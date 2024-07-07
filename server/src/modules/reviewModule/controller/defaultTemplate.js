const DefaultTemplate=require("../../../models/reviewModule/defaultTemplate")

const getDefaultTemplate = async (req, res) => {
    try {
        const defaultTemplate = await DefaultTemplate.findOne({});
        res.status(200).json(defaultTemplate);
    } catch (error) {
        res.status(500).json({ message: "Error fetching default template", error });
    }
};

const updateDefaultTemplate = async (req, res) => {
    const { paperSubmission, reviewerInvitation, paperAssignment, reviewSubmission, paperRevision, signature } = req.body;

    try {
        const defaultTemplate = await DefaultTemplate.findOneAndUpdate(
            {},
            { paperSubmission, reviewerInvitation, paperAssignment, reviewSubmission, paperRevision, signature },
            { new: true, upsert: true }
        );
        res.status(200).json(defaultTemplate);
    } catch (error) {
        res.status(500).json({ message: "Error updating default template", error });
    }
};

const postDefaultTemplate = async (req, res) => {
    const { paperSubmission, reviewerInvitation, paperAssignment, reviewSubmission, paperRevision,  signature } = req.body;

    try {
        const newTemplate = new DefaultTemplate({
            paperSubmission,
            reviewerInvitation,
            paperAssignment,
            reviewSubmission,
            paperRevision,
            signature
        });

        await newTemplate.save();
        res.status(201).json(newTemplate);
    } catch (error) {
        res.status(500).json({ message: "Error posting default template", error });
    }
};
module.exports = {
    getDefaultTemplate,
    updateDefaultTemplate,
    postDefaultTemplate
};