import { Subtitles } from "lucide-react";
import React from "react";

interface BannerProps {
  title?: string;
  subtitle?: string;
}

const Banner: React.FC<BannerProps> = ({ title = "Welcome back!", subtitle }) => {
  return (
    <div className="w-full mb-6 bg-gradient-to-r from-[#58B980] via-[#88E0C8] to-[#478BE3] h-30 text-white p-6 shadow-md flex flex-col items-start">
      <h2 className="text-2xl font-bold">{title}</h2>
      {subtitle ? (
        <p className="text-sm opacity-90 mt-1">{subtitle}</p>
      ) : null}
    </div>
  );
};

export default Banner;
