const CommonTemplate = require("../../../models/conferenceModule/commonTemplate"); // Change to the appropriate commontemplates model
const HttpException = require("../../../models/conferenceModule/http-exception");

class CommonTemplateController {
  // GET /commontemplates/conference/:id
  async getCommonTemplateByConferenceId(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const commontemplates = await CommonTemplate.find({ confId: id });
      res.json(commontemplates);
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // GET /commontemplates
  async getAllCommonTemplates(req, res) {
    try {
      const commontemplates = await CommonTemplate.find();
      res.json(commontemplates);
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // GET /commontemplates/:id
  async getCommonTemplateById(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const commontemplate = await CommonTemplate.findById(id);
      if (commontemplate) {
        res.json(commontemplate);
      } else {
        res.status(404).json({ error: "CommonTemplate not found" });
      }
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // GET /commontemplates/:confid/:templateid
   async getTemplateByConfAndId(req, res) {
    const { confid, templateid } = req.params;

    try {
      const template = await CommonTemplate.findOne({
        _id: templateid,
        confId: confid
      });

      if (!template) {
        return res.status(404).json({ error: "Template not found for given conference ID" });
      }

      res.status(200).json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // POST /commontemplates
  async createCommonTemplate(req, res) {
    const newCommonTemplate = req.body;
    // if(!isValidCommonTemplates(newCommonTemplate)) {
    //     return res.status(400).json({ error: 'Invalid award data' });
    //   }
    try {
      const createdCommonTemplate = await CommonTemplate.create(newCommonTemplate);
      res.json(createdCommonTemplate);
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // PUT /commontemplates/:id
  async updateCommonTemplate(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    const updatedCommonTemplate = req.body;
    // if(!isValidCommonTemplates(updatedCommonTemplate)) {
    //     return res.status(400).json({ error: 'Invalid award data' });
    //   }
    try {
      const commontemplate = await CommonTemplate.findByIdAndUpdate(id, updatedCommonTemplate, {
        new: true,
      });
      if (commontemplate) {
        res.json(commontemplate);
      } else {
        res.status(404).json({ error: "CommonTemplate not found" });
      }
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }

  // DELETE /commontemplates/:id
  async deleteCommonTemplate(req, res) {
    const { id } = req.params;
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const commontemplate = await CommonTemplate.findByIdAndRemove(id);
      if (commontemplate) {
        res.json(commontemplate);
      } else {
        res.status(404).json({ error: "CommonTemplate not found" });
      }
    } catch (error) {
      throw new HttpException(500, error?.message || "Internal server error");
    }
  }
}

module.exports = CommonTemplateController;

function isValidCommonTemplate(commontemplate) {
  return (
    commontemplate &&
    typeof commontemplate === "object" &&
    typeof commontemplate.id === "string" &&
    typeof commontemplate.confId === "string" &&
    typeof commontemplate.pageTitle === "string" &&
    (typeof commontemplate.description === "string" ||
      commontemplate.description === null ||
      commontemplate.description === undefined) &&
    typeof commontemplate.feature === "boolean" &&
    commontemplate.createdAt instanceof Date &&
    commontemplate.updatedAt instanceof Date
  );
}
