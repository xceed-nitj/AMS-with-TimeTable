const mongoose = require("mongoose");

const LINK_TYPES = ["template", "custom", "external"];

const subItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    linkType: { type: String, enum: LINK_TYPES, default: "custom" },
    templateId: { type: String, default: null },
    url: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const navItemSchema = new mongoose.Schema(
  {
    confId: { type: String, required: true, index: true },
    section: { type: String, enum: ["left", "right"], default: "left" },
    label: { type: String, required: true },
    linkType: { type: String, enum: LINK_TYPES, default: "custom" },
    templateId: { type: String, default: null },
    url: { type: String, default: "" },
    isButton: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    subItems: { type: [subItemSchema], default: [] },
  },
  { timestamps: true }
);

const NavItem = mongoose.model("cf-navitem", navItemSchema);

module.exports = NavItem;
module.exports.LINK_TYPES = LINK_TYPES;
