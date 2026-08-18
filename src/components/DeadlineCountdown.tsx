"use client";
import { useEffect, useState } from "react";

interface Props {
  deadline: number; // unix timestamp
}

export default function DeadlineCountdown({ deadline }: Props) {
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = deadline - now;

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft("Expired");
        return;
      }

      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-semibold"
      style={{
        background: expired ? "rgba(239,68,68,0.1)" : "rgba(251,146,60,0.1)",
        color: expired ? "#EF4444" : "#FB923C",
        border: `1px solid ${expired ? "rgba(239,68,68,0.25)" : "rgba(251,146,60,0.25)"}`,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M6 3v3l2 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
      {timeLeft}
    </div>
  );
}
