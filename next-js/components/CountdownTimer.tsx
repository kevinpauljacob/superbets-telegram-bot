import React from "react";
import Countdown from "react-countdown-now";

const CountdownTimer = ({ targetDate }: { targetDate: Date }) => {
  const renderer = ({
    days,
    hours,
    minutes,
    seconds,
    completed,
  }: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    completed: boolean;
  }) => {
    const formatValue = (value: number) => value.toString().padStart(2, "0");
    if (completed) {
      // Countdown completed
      return <>00:00:00:00</>;
    } else {
      // Render the countdown
      return (
        <>
          {formatValue(days)}d {formatValue(hours)}h {formatValue(minutes)}m {formatValue(seconds)}s
        </>
      );
    }
  };

  return <Countdown date={targetDate} renderer={renderer} />;
};

export default CountdownTimer;
