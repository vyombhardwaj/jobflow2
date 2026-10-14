"use client";

import { useState } from "react";

type DashboardWelcomeProps = {
  name: string;
  date: string;
};

export function DashboardWelcome({ name, date }: DashboardWelcomeProps) {
  const [isLit, setIsLit] = useState(false);

  return (
    <section className={`dashboard-welcome${isLit ? " is-lit" : ""}`}>
      <button
        type="button"
        className="dashboard-welcome-button"
        aria-label="Reveal welcome message"
        aria-expanded={isLit}
        onPointerEnter={() => setIsLit(true)}
        onFocus={() => setIsLit(true)}
        onClick={() => setIsLit(true)}
      >
        <span className="dashboard-welcome-title" role="heading" aria-level={1}>
          Welcome, <span className="dashboard-welcome-name">{name}</span>
        </span>
      </button>
      <p className="dashboard-welcome-date">{date}</p>
    </section>
  );
}
