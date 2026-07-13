import React from 'react';

// Shared loader for the conference module — a soft white card with a
// dual-ring spinner and pulsing label, matching the admin panel design.
export default function LoadingIcon({ label = "Loading…" }) {
  return (
    <div
      aria-label="Loading..."
      role="status"
      className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-min-w-full tw-min-h-[250px] tw-bg-white tw-rounded-2xl tw-shadow-md"
    >
      <div className="tw-relative tw-h-14 tw-w-14">
        {/* Track ring */}
        <div className="tw-absolute tw-inset-0 tw-rounded-full tw-border-4 tw-border-indigo-100" />
        {/* Spinning arc */}
        <div className="tw-absolute tw-inset-0 tw-rounded-full tw-border-4 tw-border-transparent tw-border-t-indigo-500 tw-border-r-blue-400 tw-animate-spin" />
        {/* Inner pulse dot */}
        <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center">
          <div className="tw-h-3 tw-w-3 tw-rounded-full tw-bg-indigo-400 tw-animate-pulse" />
        </div>
      </div>
      <span className="tw-text-sm tw-font-semibold tw-tracking-wide tw-text-slate-500 tw-animate-pulse">
        {label}
      </span>
    </div>
  );
}
