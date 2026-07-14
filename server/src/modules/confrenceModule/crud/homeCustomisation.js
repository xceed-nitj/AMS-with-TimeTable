const HomeCustomisation = require("../../../models/conferenceModule/homeCustomisation");
const { DEFAULT_COMPONENTS, COMPONENT_LABELS } = require("../../../models/conferenceModule/homeCustomisation");
const HttpException = require("../../../models/conferenceModule/http-exception");

// Stored components merged with the defaults, so newly added component keys
// show up for conferences saved before those keys existed. Saved design
// numbers outside the valid range fall back to the default design.
const mergeWithDefaults = (stored = []) => {
  const byKey = new Map(stored.map((c) => [c.key, c]));
  return DEFAULT_COMPONENTS.map((def) => {
    const saved = byKey.get(def.key);
    const design = saved && Number.isInteger(saved.design) && saved.design >= 1 && saved.design <= def.designCount
      ? saved.design
      : def.design;
    return {
      key: def.key,
      label: COMPONENT_LABELS[def.key] || def.key,
      design,
      designCount: def.designCount,
    };
  });
};

class HomeCustomisationController {
  async getCustomisation(confId) {
    if (!confId) throw new HttpException(400, "Invalid confId");

    try {
      const doc = await HomeCustomisation.findOne({ confId });
      return { confId, components: mergeWithDefaults(doc?.components) };
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }

  async saveCustomisation(confId, components) {
    if (!confId) throw new HttpException(400, "Invalid confId");
    if (!Array.isArray(components)) throw new HttpException(400, "components must be an array");

    const cleaned = components
      .filter((c) => c && typeof c.key === "string")
      .map((c) => ({
        key: c.key,
        design: Number.isFinite(Number(c.design)) ? Number(c.design) : 1,
      }));

    try {
      const doc = await HomeCustomisation.findOneAndUpdate(
        { confId },
        { $set: { components: cleaned } },
        { new: true, upsert: true, runValidators: true }
      );
      return { confId, components: mergeWithDefaults(doc.components) };
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }
}

module.exports = HomeCustomisationController;
