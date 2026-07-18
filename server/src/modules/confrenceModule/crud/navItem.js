const NavItem = require("../../../models/conferenceModule/navItem");
const Conf = require("../../../models/conferenceModule/confrence");
const HomeCustomisation = require("../../../models/conferenceModule/homeCustomisation");
const HttpException = require("../../../models/conferenceModule/http-exception");

// Resolves the Speaker Layout design currently selected for this conference
// into the public route it renders (e.g. design 2 -> "/speakers2").
async function resolveSpeakersUrl(confId) {
  const doc = await HomeCustomisation.findOne({ confId });
  const speakers = doc?.components?.find((c) => c.key === "speakers");
  const design = Number.isInteger(speakers?.design) ? speakers.design : 1;
  return `/speakers${design}`;
}

// Any nav item (or sub-item) with linkType "speakers" gets its url overwritten
// with the live Speaker Layout selection, so it never goes stale when the
// design is changed from the Speaker Layout tab.
async function applySpeakersLinks(confId, items) {
  const isSpeakersLink = (i) => i.linkType === "speakers";
  const hasSpeakersLink = items.some(
    (i) => isSpeakersLink(i) || (i.subItems || []).some(isSpeakersLink)
  );
  if (!hasSpeakersLink) return items;

  const url = await resolveSpeakersUrl(confId);
  return items.map((item) => {
    const obj = item.toObject ? item.toObject() : item;
    if (isSpeakersLink(obj)) obj.url = url;
    if (Array.isArray(obj.subItems)) {
      obj.subItems = obj.subItems.map((s) => (isSpeakersLink(s) ? { ...s, url } : s));
    }
    return obj;
  });
}

class NavItemController {
  async getNavItemsByConfId(confId) {
    if (!confId) throw new HttpException(400, "Invalid confId");

    try {
      const items = await NavItem.find({ confId }).sort({ section: 1, order: 1 });
      return await applySpeakersLinks(confId, items);
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }

  async getNavItemById(id) {
    if (!id) throw new HttpException(400, "Invalid Id");

    try {
      const item = await NavItem.findById(id);
      if (!item) throw new HttpException(404, "Nav item not found");
      const [resolved] = await applySpeakersLinks(item.confId, [item]);
      return resolved;
    } catch (e) {
      throw new HttpException(e?.code || 500, e?.message || "Internal Server Error");
    }
  }

  async createNavItem(data) {
    if (!data?.confId || !data?.label) {
      throw new HttpException(400, "confId and label are required");
    }

    try {
      return await NavItem.create(data);
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }

  async updateNavItem(id, data) {
    if (!id) throw new HttpException(400, "Invalid Id");

    try {
      const updated = await NavItem.findByIdAndUpdate(id, data, { new: true });
      if (!updated) throw new HttpException(404, "Nav item not found");
      return updated;
    } catch (e) {
      throw new HttpException(e?.code || 500, e?.message || "Internal Server Error");
    }
  }

  async deleteNavItem(id) {
    if (!id) throw new HttpException(400, "Invalid Id");

    try {
      return await NavItem.findByIdAndRemove(id);
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }

  async reorderNavItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new HttpException(400, "items array ([{id, order}]) is required");
    }

    try {
      await Promise.all(
        items.map(({ id, order }) => NavItem.findByIdAndUpdate(id, { order }))
      );
      return { success: true };
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }

  async setNavbarMode(confId, navbarMode) {
    if (!confId) throw new HttpException(400, "Invalid confId");
    if (!["static", "dynamic"].includes(navbarMode)) {
      throw new HttpException(400, "navbarMode must be 'static' or 'dynamic'");
    }

    try {
      const updated = await Conf.findByIdAndUpdate(
        confId,
        { navbarMode },
        { new: true }
      );
      if (!updated) throw new HttpException(404, "Conference not found");
      return updated;
    } catch (e) {
      throw new HttpException(e?.code || 500, e?.message || "Internal Server Error");
    }
  }

  // Combined, unauthenticated endpoint for the external conference frontend
  // to fetch everything it needs to render the navbar in one call.
  async getPublicNavbar(confId) {
    if (!confId) throw new HttpException(400, "Invalid confId");

    try {
      const conf = await Conf.findById(confId);
      const items = await NavItem.find({ confId, isActive: true }).sort({
        section: 1,
        order: 1,
      });
      return {
        navbarMode: conf?.navbarMode || "static",
        items: await applySpeakersLinks(confId, items),
      };
    } catch (e) {
      throw new HttpException(500, e?.message || "Internal Server Error");
    }
  }
}

module.exports = NavItemController;
