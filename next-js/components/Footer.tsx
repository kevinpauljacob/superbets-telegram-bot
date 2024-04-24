import React from "react";
import Image from "next/image";

function Footer() {
  return (
    <div className="w-full h-full bg-[#121519] flex flex-col pl-36 pr-16">
      <div className="w-full flex items-center justify-start">
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
        <div className="w-full flex items-start justify-evenly mt-20 mb-20">
          <div className="">
            <h3 className="font-semibold font-changa text-white text-lg mb-2">
              Support
            </h3>
            <div className="text-[#94A3B8] font-chakra flex flex-col items-start justify-start gap-3">
              <span>Live Support</span>
              <span>Help Center</span>
              <span>Game Responsibily</span>
            </div>
          </div>
          <div className="">
            <h3 className="font-semibold font-changa text-white text-lg mb-2">
              Platform
            </h3>
            <div className="text-[#94A3B8] font-chakra flex flex-col items-start justify-start gap-3">
              <span>Provably Fair</span>
              <span>Affiliate Program</span>
              <span>Redeem Code</span>
            </div>
          </div>
          <div className="">
            <h3 className="font-semibold font-changa text-white text-lg mb-2">
              Policy
            </h3>
            <div className="text-[#94A3B8] font-chakra flex flex-col items-start justify-start gap-3">
              <span>Terms Of Service</span>
              <span>Privacy Policy</span>
              <span>AML Policy</span>
              <span>License</span>
            </div>
          </div>
          <div className="">
            <h3 className="font-semibold font-changa text-white text-lg mb-2">
              Community
            </h3>
            <div className="text-[#94A3B8] font-chakra flex flex-col items-start justify-start gap-3">
              <span>Twitter</span>
              <span>Telegram</span>
              <span>BUY FOMO</span>
            </div>
          </div>
        </div>
      </div>
      <div>
        <p className="text-[#94A3B8] font-chakra">
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
      <div className="w-full h-[0.1rem] bg-[#94A3B8] bg-opacity-30 rounded-full mb-32 mt-5" />
    </div>
  );
}

export default Footer;
