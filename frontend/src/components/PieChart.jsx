import React from "react";

export default function PieChart({ segments }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return <div className="pie-chart pie-chart-empty" aria-hidden="true"></div>;
  }

  let cursor = 0;
  const stops = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const start = (cursor / total) * 360;
      cursor += s.value;
      const end = (cursor / total) * 360;
      return `${s.color} ${start}deg ${end}deg`;
    })
    .join(", ");

  return (
    <div
      className="pie-chart"
      style={{ background: `conic-gradient(${stops})` }}
      role="img"
      aria-label="Task breakdown chart"
    ></div>
  );
}
