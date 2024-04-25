import React from "react";
import Image from "next/image";

function Footer() {
  return (
    <div className="w-full h-full bg-[#121519] flex flex-col pl-20 pr-28">
      <div className="w-full flex items-center justify-items-start">
        <div className="w-[1/3] flex gap-1">
          <Image
            src={"/assets/logowhite.svg"}
            width={50}
            height={40}
            alt={"FOMO"}
            className="mb-32"
          ></Image>
          <span className="items-center font-medium text-[1.6rem] text-white">
            FOMO
          </span>
        </div>
        <div className="w-full flex items-start justify-items-start mt-20 mb-20 gap-5 mx-24">
          <div className="px-10">
            <h3 className="font-semibold font-changa text-white text-lg leading-[18px] mb-4 text-opacity-90">
              Support
            </h3>
            <div className="text-[#94A3B8] font-chakra flex flex-col items-start justify-start gap-5 text-sm leading-[14px] font-medium text-opacity-80">
              <span>Live Support</span>
              <span>Help Center</span>
              <span>Game Responsibily</span>
            </div>
          </div>
          <div className="px-10">
            <h3 className="font-semibold font-changa text-white text-lg leading-[18px] mb-4 text-opacity-90">
              Platform
            </h3>
            <div className="text-[#94A3B8] font-chakra flex flex-col items-start justify-start gap-5 text-sm leading-[14px] font-medium text-opacity-80">
              <span>Provably Fair</span>
              <span>Affiliate Program</span>
              <span>Redeem Code</span>
            </div>
          </div>
          <div className="px-10">
            <h3 className="font-semibold font-changa text-white text-lg leading-[18px] mb-4 text-opacity-90">
              Policy
            </h3>
            <div className="text-[#94A3B8] font-chakra flex flex-col items-start justify-start gap-5 text-sm leading-[14px] font-medium text-opacity-80">
              <span>Terms Of Service</span>
              <span>Privacy Policy</span>
              <span>AML Policy</span>
              <span>License</span>
            </div>
          </div>
          <div className="px-10">
            <h3 className="font-semibold font-changa text-white text-lg leading-[18px] mb-4 text-opacity-90">
              Community
            </h3>
            <div className="text-[#94A3B8] font-chakra flex flex-col items-start justify-start gap-5 text-sm leading-[14px] font-medium text-opacity-80">
              <span>Twitter</span>
              <span>Telegram</span>
              <span>BUY FOMO</span>
            </div>
          </div>
        </div>
      </div>
      <div>
        <p className="text-[#94A3B8] font-medium font-chakra text-sm leading-6 mt-10 text-opacity-80">
          Shuffle is owned and operated by Natural Nine B.V., Curaçao company
          registration number 160998, with its registered address at
          Korporaalweg 10, Willemstad, Curaçao. Shuffle is authorized and
          regulated by the Government of Curaçao and operates under License No.
          8048/JAZ issued to Antillephone. Shuffle’s payment agent company is
          River Card Limited, Cyprus company registration number HE 431566, with
          its registered address at 50 Spyrou Kyprianou Avenue, Irida Tower 3,
          Floor 6, 6057 Larnaca, Cyprus. Contact us at support@shuffle.com.
        </p>
      </div>
      <div className="w-full h-[0.1rem] bg-[#94A3B8] bg-opacity-30 rounded-full mb-20 mt-8" />
    </div>
  );
}

export default Footer;
