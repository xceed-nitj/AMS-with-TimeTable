const mongoose = require("mongoose");

// Design customisation for the public conference site's home page components:
// which design variant (a number) each component should render with.
// One document per conference. Follows the same pattern as homeLayout.
const componentDesignSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    design: { type: Number, default: 1 },
  },
  { _id: false }
);

const homeCustomisationSchema = new mongoose.Schema(
  {
    confId: { type: String, required: true, unique: true, index: true },
    components: { type: [componentDesignSchema], default: [] },
  },
  { timestamps: true }
);

const HomeCustomisation = mongoose.model("cf-homecustomisation", homeCustomisationSchema);

// The home-page components that support multiple designs on the public site.
// `designCount` is how many numbered designs the public frontend implements
// for that component — bump it here when a new design is added.
const DEFAULT_COMPONENTS = [
  { key: "countdown", design: 1, designCount: 4 },
  { key: "eventDates", design: 1, designCount: 3 },
  // Speakers section layout: the public site renders /speakers1 … /speakers5
  // depending on the chosen design. Managed from its own "Speaker Layout"
  // admin tab rather than the generic Customisation list.
  { key: "speakers", design: 1, designCount: 5 },
];

// Human-readable labels for the admin panel.
const COMPONENT_LABELS = {
  countdown: "Countdown Timer",
  eventDates: "Event Dates",
  speakers: "Speakers Section",
};

module.exports = HomeCustomisation;
module.exports.DEFAULT_COMPONENTS = DEFAULT_COMPONENTS;
module.exports.COMPONENT_LABELS = COMPONENT_LABELS;
