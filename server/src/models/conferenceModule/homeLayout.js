const mongoose = require("mongoose");

// Layout configuration for the public conference site's home page:
// which sections are shown and in what order. One document per conference.
const sectionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const homeLayoutSchema = new mongoose.Schema(
  {
    confId: { type: String, required: true, unique: true, index: true },
    sections: { type: [sectionSchema], default: [] },
  },
  { timestamps: true }
);

const HomeLayout = mongoose.model("cf-homelayout", homeLayoutSchema);

// The known home-page sections of the public site, in default order.
// Speakers and Sponsors ship hidden so existing sites don't change until
// the organiser enables them from the admin panel.
const DEFAULT_SECTIONS = [
  { key: "slider", visible: true, order: 1 },
  { key: "aboutConf", visible: true, order: 2 },
  { key: "timeline", visible: true, order: 3 },
  { key: "aboutInstitute", visible: true, order: 4 },
  { key: "countdown", visible: true, order: 5 },
  { key: "aboutDept", visible: true, order: 6 },
  { key: "speakers", visible: false, order: 7 },
  { key: "sponsors", visible: false, order: 8 },
  { key: "cmtNotice", visible: true, order: 9 },
];

// Human-readable labels for the admin panel.
const SECTION_LABELS = {
  slider: "Hero Slider",
  aboutConf: "About Conference",
  timeline: "Timeline / Important Dates",
  aboutInstitute: "About Institute (NITJ)",
  countdown: "Countdown Timer",
  aboutDept: "About Department",
  speakers: "Speakers",
  sponsors: "Sponsors",
  cmtNotice: "Microsoft CMT Notice",
};

module.exports = HomeLayout;
module.exports.DEFAULT_SECTIONS = DEFAULT_SECTIONS;
module.exports.SECTION_LABELS = SECTION_LABELS;
