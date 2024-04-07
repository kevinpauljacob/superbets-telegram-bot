import React from "react";
import Image from "next/image";
import twitter from "../public/assets/Twitter.svg";
import telegram from "../public/assets/Telegram.svg";
import circle from "../public/assets/Group 1624 1.svg";

const Footer = () => {
  return (
    <div
      className="fixed mb-4 flex items-center justify-end px-5"
      style={{ bottom: "0", right: "0" }}
    >
      <div className="px-3 ">
        <a
          target="_blank"
          className="hover:text-v2-primary h-6 w-6 px-1 py-1.5 text-white/50"
          href="https://solscan.io/token/Cx9oLynYgC3RrgXzin7U417hNY9D6YB1eMGw4ZMbWJgw"
          rel="noopener noreferrer"
        >
          <Image src={circle} width={20} alt="" />
        </a>
      </div>
      <div className="px-3 ">
        <a
          target="_blank"
          className="hover:text-v2-primary h-6 w-6 px-1 py-1.5 text-white/50"
          href="https://twitter.com/FOMOSolana"
          rel="noopener noreferrer"
        >
          <Image src={twitter} width={20} alt="" />
        </a>
      </div>
      <div className="px-3 ">
        <a
          target="_blank"
          className="hover:text-v2-primary h-6 w-6 px-1 py-1.5 text-white/50"
          href="https://t.me/FOMOSolana"
          rel=""
        >
          <Image src={telegram} width={20} alt="" />
        </a>
      </div>
    </div>
  );
};

export default Footer;
