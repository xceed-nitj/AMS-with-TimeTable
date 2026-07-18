// src/components/Timeline.jsx
import axios from "axios";
import getEnvironment from "../getenvironment";
import { useState, useEffect, forwardRef } from "react";
import formatDate from "../conferencemodule/utils/formatDate";
import { motion } from "framer-motion";

const descriptionMap = {
  "Paper submission deadline":
    "Submit your research papers before this date for peer review consideration.",
  "Starting of Registration ":
    "Registration opens — secure your spot early for the best rates.",
  "Early Bird Registration ":
    "Take advantage of discounted early-bird registration rates.",
  "Conference Starting Date":
    "The conference officially begins. Join sessions, keynotes, and networking.",
};

const getDesc = (title) =>
  descriptionMap[title] ||
  "An important milestone for the conference — mark your calendar.";

const icons = [
  // Document / paper
  <svg key="0" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>,
  // Bell / notification
  <svg key="1" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>,
  // ID card / registration
  <svg key="2" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
  </svg>,
  // Calendar / conference
  <svg key="3" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>,
];

// Accent colours per card index
const accents = [
  { from: "#2563eb", to: "#60a5fa", light: "#eff6ff", text: "#1d4ed8" },
  { from: "#1d4ed8", to: "#93c5fd", light: "#dbeafe", text: "#1e40af" },
  { from: "#1e40af", to: "#3b82f6", light: "#bfdbfe", text: "#1e3a8a" },
  { from: "#1e3a8a", to: "#1d4ed8", light: "#dbeafe", text: "#172554" },
];

// Date chip + extended badge — shared by all designs
const DateChip = ({ item, acc }) => {
  const date = item.extended ? item.newDate : item.date;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-1 rounded-lg"
        style={{ background: acc.light, color: acc.text }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {formatDate(date)}
      </span>
      {item.extended && (
        <>
          <span className="text-xs text-gray-400 line-through">
            {formatDate(item.date)}
          </span>
          <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full font-medium">
            Extended
          </span>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// Design 1 — numbered cards grid (default / original design)
// ═══════════════════════════════════════════════════════════════════════════

const TimelineCard = ({ item, idx }) => {
  const acc = accents[idx % accents.length];

  return (
    <motion.div
      className="relative flex flex-col h-full"
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Step number */}
      <div
        className="absolute -top-4 left-5 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md z-10"
        style={{ background: `linear-gradient(135deg, ${acc.from}, ${acc.to})` }}
      >
        {idx + 1}
      </div>

      <motion.div
        className="bg-white rounded-2xl overflow-hidden shadow-md border border-blue-50 flex flex-col h-full"
        whileHover={{ y: -4, boxShadow: "0 16px 40px -8px rgba(30,58,138,0.14)" }}
        transition={{ duration: 0.22 }}
      >
        {/* Coloured top stripe */}
        <div
          className="h-1.5 w-full"
          style={{ background: `linear-gradient(90deg, ${acc.from}, ${acc.to})` }}
        />

        {/* Card body */}
        <div className="p-5 sm:p-6 flex flex-col gap-3 flex-1">
          {/* Icon + title */}
          <div className="flex items-start gap-3">
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: acc.light, color: acc.text }}
            >
              {icons[idx % icons.length]}
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="text-sm sm:text-base font-semibold leading-snug"
                style={{ color: acc.text }}
              >
                {item.title}
              </h3>
            </div>
          </div>

          <DateChip item={item} acc={acc} />

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed flex-1">
            {getDesc(item.title)}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

const TimelineDesign1 = ({ datesData }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pt-5">
    {datesData.map((item, idx) => (
      <TimelineCard key={idx} item={item} idx={idx} />
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// Design 2 — classic vertical timeline: centre line on desktop with cards
// alternating left/right, left-aligned line on mobile
// ═══════════════════════════════════════════════════════════════════════════

const TimelineDesign2 = ({ datesData }) => (
  <div className="relative max-w-3xl mx-auto">
    {/* Vertical line */}
    <div className="absolute left-4 sm:left-1/2 top-2 bottom-2 w-0.5 sm:-translate-x-1/2 bg-gradient-to-b from-blue-200 via-blue-400 to-blue-200" />

    {datesData.map((item, idx) => {
      const acc = accents[idx % accents.length];
      const left = idx % 2 === 0;
      return (
        <motion.div
          key={idx}
          className={`relative mb-8 last:mb-0 pl-14 sm:pl-0 sm:flex ${left ? "sm:justify-start" : "sm:justify-end"}`}
          initial={{ opacity: 0, x: left ? -32 : 32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: idx * 0.08 }}
        >
          {/* Node on the line */}
          <div
            className="absolute left-4 sm:left-1/2 top-5 -translate-x-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md z-10 ring-4 ring-blue-50"
            style={{ background: `linear-gradient(135deg, ${acc.from}, ${acc.to})` }}
          >
            {idx + 1}
          </div>

          {/* Card */}
          <div className="sm:w-[calc(50%-2.75rem)] bg-white rounded-2xl border border-blue-50 shadow-md p-5 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-start gap-3 mb-3">
              <div
                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: acc.light, color: acc.text }}
              >
                {icons[idx % icons.length]}
              </div>
              <h3
                className="text-sm sm:text-base font-semibold leading-snug pt-1.5"
                style={{ color: acc.text }}
              >
                {item.title}
              </h3>
            </div>
            <DateChip item={item} acc={acc} />
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-3">
              {getDesc(item.title)}
            </p>
          </div>
        </motion.div>
      );
    })}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// Design 3 — horizontal stepper: numbered nodes joined by a line on desktop,
// stacking into simple rows on mobile
// ═══════════════════════════════════════════════════════════════════════════

const TimelineDesign3 = ({ datesData }) => (
  <div className="relative max-w-6xl mx-auto">
    {/* Connecting line (desktop) */}
    <div className="hidden lg:block absolute top-6 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />

    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-6">
      {datesData.map((item, idx) => {
        const acc = accents[idx % accents.length];
        return (
          <motion.div
            key={idx}
            className="relative flex lg:flex-col items-start lg:items-center gap-4 lg:gap-0 lg:text-center"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
          >
            {/* Numbered node */}
            <div
              className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md ring-4 ring-blue-50"
              style={{ background: `linear-gradient(135deg, ${acc.from}, ${acc.to})` }}
            >
              {idx + 1}
            </div>

            <div className="flex-1 lg:mt-5 lg:flex lg:flex-col lg:items-center">
              <h3
                className="text-sm sm:text-base font-semibold leading-snug"
                style={{ color: acc.text }}
              >
                {item.title}
              </h3>
              <div className="mt-2 lg:flex lg:justify-center">
                <DateChip item={item} acc={acc} />
              </div>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-2 lg:px-2">
                {getDesc(item.title)}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// Top-level component — fetches dates and design once, renders the design
// chosen from the admin panel's Customisation tab (homeCustomisation
// component key "eventDates"). Missing/unknown values fall back to design 1.
// ═══════════════════════════════════════════════════════════════════════════

const TIMELINE_DESIGNS = {
  1: TimelineDesign1,
  2: TimelineDesign2,
  3: TimelineDesign3,
};

const Timeline = forwardRef((props, ref) => {
  const { confid } = props;
  const [datesData, setDatesData] = useState([]);
  const [design, setDesign] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const apiUrl = getEnvironment();

  useEffect(() => {
    setIsLoading(true);
    axios
      .get(`${apiUrl}/conferencemodule/eventDates/conference/${confid}`, {
        withCredentials: true,
      })
      .then((res) => {
        setDatesData(res.data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [apiUrl, confid]);

  // Design variant comes from the admin panel's Customisation tab
  // (homeCustomisation, component key "eventDates") rather than a prop.
  useEffect(() => {
    axios
      .get(`${apiUrl}/conferencemodule/homecustomisation/public/${confid}`, {
        withCredentials: true,
      })
      .then((res) => {
        const eventDates = res.data?.components?.find((c) => c.key === "eventDates");
        if (eventDates?.design) setDesign(eventDates.design);
      })
      .catch(() => {});
  }, [apiUrl, confid]);

  const Design = TIMELINE_DESIGNS[Number(design)] || TimelineDesign1;

  return (
    <section ref={ref} className="relative w-full py-14 sm:py-20 overflow-hidden">
      {/* Subtle blue gradient bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, #f8faff 0%, #eff6ff 50%, #f8faff 100%)",
        }}
      />
      {/* Decorative dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #2563eb 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Section header ── */}
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-blue-500 mb-3">
            Schedule
          </span>
          <h2 className="text-3xl sm:text-4xl font-poppins font-bold text-slate-900 mb-4">
            Important Dates
          </h2>
          {/* Animated underline */}
          <motion.div
            className="mx-auto h-1 rounded-full"
            style={{
              background: "linear-gradient(90deg, #2563eb, #60a5fa)",
              width: 0,
            }}
            whileInView={{ width: "64px" }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
          />
        </motion.div>

        {/* ── Loading skeleton ── */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-md animate-pulse">
                <div className="h-1.5 w-full bg-blue-100 rounded mb-5" />
                <div className="flex gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-blue-50 rounded w-3/4" />
                    <div className="h-3 bg-blue-50 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-7 bg-blue-50 rounded-lg w-1/2 mb-4" />
                <div className="space-y-2">
                  <div className="h-3 bg-blue-50 rounded" />
                  <div className="h-3 bg-blue-50 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── No data state ── */}
        {!isLoading && datesData.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">Conference dates will be announced soon.</p>
          </div>
        )}

        {/* ── Dates — design fetched from the admin panel ── */}
        {!isLoading && datesData.length > 0 && <Design datesData={datesData} />}
      </div>
    </section>
  );
});

Timeline.displayName = "Timeline";
export default Timeline;
