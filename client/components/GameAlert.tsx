import { AlertProps } from "@/types";
import React, { useEffect, useState } from "react";

function GameAlert({ text, subText, isTop = false, delay = 0 }: AlertProps) {
  const [isVisible, setIsVisible] = useState(true);
  const alertRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (alertRef.current) {
      setTimeout(() => {
        if (!alertRef.current) return;
        alertRef.current.style.transform = `translate(-50%, ${
          isTop ? "100px" : "-144px"
        }) scale(1)`;
      }, delay);

      setTimeout(() => {
        if (!alertRef.current) return;
        alertRef.current.style.transform = `translate(-50%, ${
          isTop ? "-50px" : "50px"
        }) scale(0.4)`;
      }, 3000 + delay);

      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 4000 + delay);

      return () => clearTimeout(hideTimer);
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={alertRef}
      className={`absolute transition-all px-16 py-10 left-1/2 flex-col ${
        isTop ? "-top-[100px]" : "bottom-[0px]"
      } bg-main-gray min-h-20 flex items-center justify-center mx-auto rounded-lg shadow-lg`}
    >
      {isTop && (
        <div className="absolute left-1/2 transform -translate-x-1/2 -top-[10px] w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-main-gray"></div>
      )}
      <p className="text-white text-sm w-full">{text}</p>
      {subText && <p className="text-white/60 text-[10px] mt-2">{subText}</p>}
      {!isTop && (
        <div className="absolute left-1/2 transform -translate-x-1/2 bottom-[-10px] w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-main-gray"></div>
      )}
    </div>
  );
}

export default GameAlert;
