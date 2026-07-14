const HomeLayout = require("../../../models/conferenceModule/homeLayout");
const { DEFAULT_SECTIONS, SECTION_LABELS } = require("../../../models/conferenceModule/homeLayout");
const HttpException = require("../../../models/conferenceModule/http-exception");

// Stored sections merged with the defaults, so newly added section keys show
// up for conferences saved before those keys existed.
const mergeWithDefaults = (stored = []) => {
  const byKey = new Map(stored.map((s) => [s.key, s]));
  const merged = DEFAULT_SECTIONS.map((def) => {
    const saved = byKey.get(def.key);
    return {
      key: def.key,
      label: SECTION_LABELS[def.key] || def.key,
      visible: saved ? !!saved.visible : def.visible,
      order: saved ? saved.order : def.order,
    };
  });
  return merged.sort((a, b) => a.order - b.order);
};

class HomeLayoutController {
  async getLayout(confId) {
    if (!confId) throw new HttpException(400, "Invalid confId");

    try {
      const doc = await HomeLayout.findOne({ confId });
      return { confId, sections: mergeWithDefaults(doc?.sections) };
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }

  async saveLayout(confId, sections) {
    if (!confId) throw new HttpException(400, "Invalid confId");
    if (!Array.isArray(sections)) throw new HttpException(400, "sections must be an array");

    const cleaned = sections
      .filter((s) => s && typeof s.key === "string")
      .map((s, i) => ({
        key: s.key,
        visible: !!s.visible,
        order: Number.isFinite(Number(s.order)) ? Number(s.order) : i + 1,
      }));

    try {
      const doc = await HomeLayout.findOneAndUpdate(
        { confId },
        { $set: { sections: cleaned } },
        { new: true, upsert: true, runValidators: true }
      );
      return { confId, sections: mergeWithDefaults(doc.sections) };
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }
}

module.exports = HomeLayoutController;
