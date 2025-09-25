import React from "react";

interface BannerProps {
  title?: string;
}

const Banner: React.FC<BannerProps> = ({ title = "Welcome back!" }) => {
  return (
<div className="w-full mb-6 bg-gradient-to-r from-[#58B980] via-[#88E0C8] to-[#478BE3] h-30 text-white p-6 shadow-md flex items-center">
      <h2 className="text-2xl font-bold">{title}</h2>
    </div>
  );
};

export default Banner;
