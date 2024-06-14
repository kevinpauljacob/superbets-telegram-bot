import { useGlobalContext } from "@/components/GlobalContext";
import { TButton } from "@/components/table/Table";
import { errorCustom } from "@/components/toasts/ToastGroup";
import { translator } from "@/context/transactions";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import User from "@/public/assets/User";
import ReferralLink from "@/components/affiliate-program/ReferralLink";
import CreateCampaignModal from "@/components/affiliate-program/CreateCampaignModal";

interface PaginationProps {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  bets: any[];
  maxPages: number;
}

interface TableButtonProps {
  all: boolean;
  setAll: React.Dispatch<React.SetStateAction<boolean>>;
}

interface Referral {
  _id: string;
  wallet: string;
  __v: number;
  createdAt: string;
  feeGenerated: Record<string, any>;
  referralCode: string;
  referredByChain: string[];
  totalEarnings: Record<string, any>;
  unclaimedEarnings: Record<string, any>;
  updatedAt: string;
  volume: Record<string, any>;
}

type ReferralData = Referral[];

export default function AffiliateProgram() {
  const wallet = useWallet();
  const router = useRouter();
  const { language } = useGlobalContext();
  const transactionsPerPage = 10;
  const [referred, setReferred] = useState(true);
  const [campaigns, setCampaigns] = useState(false);
  const [earnings, setEarnings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [referredData, setReferredData] = useState<ReferralData>([]);
  const [earningsData, setEarningsData] = useState([]);

  const referredHeaders = [
    "Wallet",
    "Level",
    "Wagered",
    "Commission %",
    "Earned",
  ];
  const earningsHeaders = ["Cryptocurreny", "Previously Claimed", "Claimable"];
  const smallScreenHeaders = ["Game", "Payout"];

  const toggleModal = () => {
    setModal(true);
  };

  useEffect(() => {
    const fetchReferredData = async () => {
      try {
        const response = await fetch(
          `/api/games/referralCode/${wallet.publicKey}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const { success, data } = await response.json();

        if (success) {
          data !== null && setReferredData(data);
          console.log("data", data);
        }
      } catch (error: any) {
        throw new Error(error.message);
      }
    };

    if (wallet) {
      fetchReferredData();
    }
  }, [wallet]);

  useEffect(() => {
    console.log("referredData", referredData);
  }, [referredData]);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const response = await fetch(
          `/api/games/referralCode/${wallet.publicKey}/earnings`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const { success, user, data, message } = await response.json();

        if (success) {
          setEarningsData(data);
          console.log("data", data);
        }
      } catch (error: any) {
        throw new Error(error.message);
      }
    };

    if (wallet) {
      fetchEarnings();
    }
  }, [earnings, wallet]);

  return (
    <div className="px-5 lg2:px-[4rem] md:px-[3rem] pt-5">
      <h1 className="font-chakra font-bold text-[1.75rem] text-white mb-3.5">
        AFFILIATE PROGRAM
      </h1>
      <div className="flex flex-col gap-[14px] mt-7 mb-[3.25rem]">
        <div className="flex gap-[14px] w-full">
          <div className="flex flex-col justify-between grow bg-staking-bg rounded-[5px] p-4 w-[30%]">
            <div>
              <p className="text-white font-semibold text-base text-opacity-75">
                Multi-Level Referral
              </p>
              <p className="text-[#94A3B8] font-semibold text-[11px] text-opacity-50 md:max-w-[340px]">
                Our affiliate program includes a comprehensive retention program
                that keeps referred customers engaged and invested.
              </p>
            </div>
            <div className="mt-3.5">
              <p className="text-white/50 font-chakra font-semibold text-xs mb-2">
                Referral Link
              </p>
              <div className="flex gap-3 mb-4">
                <span className="text-ellipsis overflow-hidden bg-white/5 rounded-[5px] text-sm font-chakra text-[#94A3B8] font-normal px-4 py-1">
                  www.figma.com/La9ivJdfAk1cEkALohDSdx
                </span>
                <button className="bg-[#7839C5] rounded-[5px] text-white/75 text-[13px] font-chakra font-medium px-5">
                  Copy
                </button>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex flex-col justify-between bg-staking-bg rounded-[5px] px-4 pt-4 pb-8">
            <p className="text-white/75 font-semibold">How it Works?</p>
            <Image
              src="/assets/banners/affiliate-program.png"
              alt="how it works image"
              width={805}
              height={205}
            />
          </div>
        </div>
        <div className="flex gap-[14px] overflow-x-auto overflow-y-hidden w-full">
          <div className="flex flex-col gap-[30px] bg-staking-bg rounded-[5px] p-4 w-full min-w-[330px] xl:min-w-0">
            <div className="w-full">
              <div className="flex gap-[6px]">
                <User fill="#4594FF" />
                <p className="text-[#4594FF] text-[13px] font-semibold bg-[#4594FF]/10 rounded-[5px] px-1">
                  Level 1
                </p>
                <p className="text-[#94A3B8]/75 text-[13px] font-semibold bg-[#94A3B8]/5 rounded-[5px] px-1">
                  3% Commission
                </p>
              </div>
              <div className="flex items-center gap-[7px] font-chakra text-white/50 font-medium text-xs mt-2">
                <p>Signups</p>
                <svg
                  width="4"
                  height="4"
                  viewBox="0 0 4 4"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    opacity="0.5"
                    d="M0.556524 2L1.9999 3.44338L3.44328 2L1.9999 0.556624L0.556524 2ZM2 1.75H1.99998V2.25H2V1.75ZM1.99993 1.75H1.9999V2.25H1.99993V1.75ZM0.556524 2L1.9999 3.44338L3.44328 2L1.9999 0.556624L0.556524 2ZM2 1.75H1.99998V2.25H2V1.75ZM1.99993 1.75H1.9999V2.25H1.99993V1.75Z"
                    fill="#94A3B8"
                  />
                </svg>
                <p>Earnings</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-[10px] font-chakra font-semibold text-[20px]">
              <p className="text-[#94A3B8]/90">23</p>
              <svg
                width="35"
                height="6"
                viewBox="0 0 35 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  opacity="0.5"
                  d="M34.8868 3L32 0.113249L29.1132 3L32 5.88675L34.8868 3ZM0.113249 3L3 5.88675L5.88675 3L3 0.113249L0.113249 3ZM32 2.5H30.9643V3.5H32V2.5ZM28.8929 2.5H26.8214V3.5L28.8929 3.5V2.5ZM24.75 2.5L22.6786 2.5V3.5H24.75V2.5ZM20.6071 2.5L18.5357 2.5V3.5L20.6071 3.5V2.5ZM16.4643 2.5L14.3929 2.5V3.5L16.4643 3.5V2.5ZM12.3214 2.5L10.25 2.5V3.5H12.3214V2.5ZM8.17857 2.5H6.10715V3.5L8.17857 3.5V2.5ZM4.03572 2.5H3V3.5H4.03572V2.5ZM34.8868 3L32 0.113249L29.1132 3L32 5.88675L34.8868 3ZM0.113249 3L3 5.88675L5.88675 3L3 0.113249L0.113249 3ZM32 2.5H30.9643V3.5H32V2.5ZM28.8929 2.5H26.8214V3.5L28.8929 3.5V2.5ZM24.75 2.5L22.6786 2.5V3.5H24.75V2.5ZM20.6071 2.5L18.5357 2.5V3.5L20.6071 3.5V2.5ZM16.4643 2.5L14.3929 2.5V3.5L16.4643 3.5V2.5ZM12.3214 2.5L10.25 2.5V3.5H12.3214V2.5ZM8.17857 2.5H6.10715V3.5L8.17857 3.5V2.5ZM4.03572 2.5H3V3.5H4.03572V2.5Z"
                  fill="#94A3B8"
                />
              </svg>
              <p className="text-[#00C278]">$10.6</p>
            </div>
          </div>
          <div className="flex flex-col gap-[30px] bg-staking-bg rounded-[5px] p-4 w-full min-w-[330px] xl:min-w-0">
            <div>
              <div className="flex gap-[6px]">
                <User fill="#E17AFF" />
                <p className="text-[#E17AFF] text-[13px] font-semibold bg-[#E17AFF]/10 rounded-[5px] px-1">
                  Level 2
                </p>
                <p className="text-[#94A3B8]/75 text-[13px] font-semibold bg-[#94A3B8]/5 rounded-[5px] px-1">
                  2.5% Commission
                </p>
              </div>
              <div className="flex items-center gap-[7px] font-chakra text-white/50 font-medium text-xs mt-2">
                <p>Signups</p>
                <svg
                  width="4"
                  height="4"
                  viewBox="0 0 4 4"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    opacity="0.5"
                    d="M0.556524 2L1.9999 3.44338L3.44328 2L1.9999 0.556624L0.556524 2ZM2 1.75H1.99998V2.25H2V1.75ZM1.99993 1.75H1.9999V2.25H1.99993V1.75ZM0.556524 2L1.9999 3.44338L3.44328 2L1.9999 0.556624L0.556524 2ZM2 1.75H1.99998V2.25H2V1.75ZM1.99993 1.75H1.9999V2.25H1.99993V1.75Z"
                    fill="#94A3B8"
                  />
                </svg>
                <p>Earnings</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-[10px] font-chakra font-semibold text-[20px]">
              <p className="text-[#94A3B8]/90">23</p>
              <svg
                width="35"
                height="6"
                viewBox="0 0 35 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  opacity="0.5"
                  d="M34.8868 3L32 0.113249L29.1132 3L32 5.88675L34.8868 3ZM0.113249 3L3 5.88675L5.88675 3L3 0.113249L0.113249 3ZM32 2.5H30.9643V3.5H32V2.5ZM28.8929 2.5H26.8214V3.5L28.8929 3.5V2.5ZM24.75 2.5L22.6786 2.5V3.5H24.75V2.5ZM20.6071 2.5L18.5357 2.5V3.5L20.6071 3.5V2.5ZM16.4643 2.5L14.3929 2.5V3.5L16.4643 3.5V2.5ZM12.3214 2.5L10.25 2.5V3.5H12.3214V2.5ZM8.17857 2.5H6.10715V3.5L8.17857 3.5V2.5ZM4.03572 2.5H3V3.5H4.03572V2.5ZM34.8868 3L32 0.113249L29.1132 3L32 5.88675L34.8868 3ZM0.113249 3L3 5.88675L5.88675 3L3 0.113249L0.113249 3ZM32 2.5H30.9643V3.5H32V2.5ZM28.8929 2.5H26.8214V3.5L28.8929 3.5V2.5ZM24.75 2.5L22.6786 2.5V3.5H24.75V2.5ZM20.6071 2.5L18.5357 2.5V3.5L20.6071 3.5V2.5ZM16.4643 2.5L14.3929 2.5V3.5L16.4643 3.5V2.5ZM12.3214 2.5L10.25 2.5V3.5H12.3214V2.5ZM8.17857 2.5H6.10715V3.5L8.17857 3.5V2.5ZM4.03572 2.5H3V3.5H4.03572V2.5Z"
                  fill="#94A3B8"
                />
              </svg>
              <p className="text-[#00C278]">$10.6</p>
            </div>
          </div>
          <div className="flex flex-col gap-[30px] bg-staking-bg rounded-[5px] p-4 w-full min-w-[330px] xl:min-w-0">
            <div>
              <div className="flex gap-[6px]">
                <User fill="#00C278" />
                <p className="text-[#00C278] text-[13px] font-semibold bg-[#00C278]/10 rounded-[5px] px-1">
                  Level 3
                </p>
                <p className="text-[#94A3B8]/75 text-[13px] font-semibold bg-[#94A3B8]/5 rounded-[5px] px-1">
                  2% Commission
                </p>
              </div>
              <div className="flex items-center gap-[7px] font-chakra text-white/50 font-medium text-xs mt-2">
                <p>Signups</p>
                <svg
                  width="4"
                  height="4"
                  viewBox="0 0 4 4"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    opacity="0.5"
                    d="M0.556524 2L1.9999 3.44338L3.44328 2L1.9999 0.556624L0.556524 2ZM2 1.75H1.99998V2.25H2V1.75ZM1.99993 1.75H1.9999V2.25H1.99993V1.75ZM0.556524 2L1.9999 3.44338L3.44328 2L1.9999 0.556624L0.556524 2ZM2 1.75H1.99998V2.25H2V1.75ZM1.99993 1.75H1.9999V2.25H1.99993V1.75Z"
                    fill="#94A3B8"
                  />
                </svg>
                <p>Earnings</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-[10px] font-chakra font-semibold text-[20px]">
              <p className="text-[#94A3B8]/90">23</p>
              <svg
                width="35"
                height="6"
                viewBox="0 0 35 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  opacity="0.5"
                  d="M34.8868 3L32 0.113249L29.1132 3L32 5.88675L34.8868 3ZM0.113249 3L3 5.88675L5.88675 3L3 0.113249L0.113249 3ZM32 2.5H30.9643V3.5H32V2.5ZM28.8929 2.5H26.8214V3.5L28.8929 3.5V2.5ZM24.75 2.5L22.6786 2.5V3.5H24.75V2.5ZM20.6071 2.5L18.5357 2.5V3.5L20.6071 3.5V2.5ZM16.4643 2.5L14.3929 2.5V3.5L16.4643 3.5V2.5ZM12.3214 2.5L10.25 2.5V3.5H12.3214V2.5ZM8.17857 2.5H6.10715V3.5L8.17857 3.5V2.5ZM4.03572 2.5H3V3.5H4.03572V2.5ZM34.8868 3L32 0.113249L29.1132 3L32 5.88675L34.8868 3ZM0.113249 3L3 5.88675L5.88675 3L3 0.113249L0.113249 3ZM32 2.5H30.9643V3.5H32V2.5ZM28.8929 2.5H26.8214V3.5L28.8929 3.5V2.5ZM24.75 2.5L22.6786 2.5V3.5H24.75V2.5ZM20.6071 2.5L18.5357 2.5V3.5L20.6071 3.5V2.5ZM16.4643 2.5L14.3929 2.5V3.5L16.4643 3.5V2.5ZM12.3214 2.5L10.25 2.5V3.5H12.3214V2.5ZM8.17857 2.5H6.10715V3.5L8.17857 3.5V2.5ZM4.03572 2.5H3V3.5H4.03572V2.5Z"
                  fill="#94A3B8"
                />
              </svg>
              <p className="text-[#00C278]">$10.6</p>
            </div>
          </div>
          <div className="flex flex-col gap-[30px] bg-staking-bg rounded-[5px] p-4 w-full min-w-[330px] xl:min-w-0">
            <div>
              <div className="flex gap-[6px]">
                <User fill="#4594FF" />
                <p className="text-[#4594FF] text-[13px] font-semibold bg-[#4594FF]/10 rounded-[5px] px-1">
                  Level 4
                </p>
                <p className="text-[#94A3B8]/75 text-[13px] font-semibold bg-[#94A3B8]/5 rounded-[5px] px-1">
                  &lt;2% Commission
                </p>
              </div>
              <div className="flex items-center gap-[7px] font-chakra text-white/50 font-medium text-xs mt-2">
                <p>Signups</p>
                <svg
                  width="4"
                  height="4"
                  viewBox="0 0 4 4"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    opacity="0.5"
                    d="M0.556524 2L1.9999 3.44338L3.44328 2L1.9999 0.556624L0.556524 2ZM2 1.75H1.99998V2.25H2V1.75ZM1.99993 1.75H1.9999V2.25H1.99993V1.75ZM0.556524 2L1.9999 3.44338L3.44328 2L1.9999 0.556624L0.556524 2ZM2 1.75H1.99998V2.25H2V1.75ZM1.99993 1.75H1.9999V2.25H1.99993V1.75Z"
                    fill="#94A3B8"
                  />
                </svg>
                <p>Earnings</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-[10px] font-chakra font-semibold text-[20px]">
              <p className="text-[#94A3B8]/90">23</p>
              <svg
                width="35"
                height="6"
                viewBox="0 0 35 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  opacity="0.5"
                  d="M34.8868 3L32 0.113249L29.1132 3L32 5.88675L34.8868 3ZM0.113249 3L3 5.88675L5.88675 3L3 0.113249L0.113249 3ZM32 2.5H30.9643V3.5H32V2.5ZM28.8929 2.5H26.8214V3.5L28.8929 3.5V2.5ZM24.75 2.5L22.6786 2.5V3.5H24.75V2.5ZM20.6071 2.5L18.5357 2.5V3.5L20.6071 3.5V2.5ZM16.4643 2.5L14.3929 2.5V3.5L16.4643 3.5V2.5ZM12.3214 2.5L10.25 2.5V3.5H12.3214V2.5ZM8.17857 2.5H6.10715V3.5L8.17857 3.5V2.5ZM4.03572 2.5H3V3.5H4.03572V2.5ZM34.8868 3L32 0.113249L29.1132 3L32 5.88675L34.8868 3ZM0.113249 3L3 5.88675L5.88675 3L3 0.113249L0.113249 3ZM32 2.5H30.9643V3.5H32V2.5ZM28.8929 2.5H26.8214V3.5L28.8929 3.5V2.5ZM24.75 2.5L22.6786 2.5V3.5H24.75V2.5ZM20.6071 2.5L18.5357 2.5V3.5L20.6071 3.5V2.5ZM16.4643 2.5L14.3929 2.5V3.5L16.4643 3.5V2.5ZM12.3214 2.5L10.25 2.5V3.5H12.3214V2.5ZM8.17857 2.5H6.10715V3.5L8.17857 3.5V2.5ZM4.03572 2.5H3V3.5H4.03572V2.5Z"
                  fill="#94A3B8"
                />
              </svg>
              <p className="text-[#00C278]">$10.6</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between mb-8">
        <div className="flex w-full md:w-max items-center gap-2 justify-center md:justify-end border-2 p-1.5 rounded-lg border-white border-opacity-[5%]">
          <TButton
            active={referred}
            onClick={() => {
              if (wallet.publicKey) {
                setReferred(true);
                setCampaigns(false);
                setEarnings(false);
              } else {
                errorCustom("Wallet not connected");
              }
            }}
            label={translator("Reffered", language)}
          />
          <TButton
            active={campaigns}
            onClick={() => {
              setReferred(false);
              setCampaigns(true);
              setEarnings(false);
            }}
            label={translator("Campaigns", language)}
          />
          <TButton
            active={earnings}
            onClick={() => {
              setReferred(false);
              setCampaigns(false);
              setEarnings(true);
            }}
            label={translator("Earnings", language)}
          />
        </div>
        {campaigns && (
          <button
            className="bg-[#7839C5] text-white font-chakra font-semibold text-sm rounded-[5px] px-8"
            onClick={() => toggleModal()}
          >
            CREATE CAMPAIGN
          </button>
        )}
      </div>

      {campaigns && (
        <div>
          {referredData.length > 0 ? (
            referredData.map((data, index) => (
              <ReferralLink
                signUps={data?.volume || "0"}
                totalEarnings={data?.totalEarnings || "0"}
                referralCode={data?.referralCode}
                key={index}
              />
            ))
          ) : (
            <p className="text-center font-changa text-[#F0F0F080]">No data</p>
          )}
        </div>
      )}

      {earnings && (
        <div className="flex gap-[1.85rem] w-full mb-[3.25rem]">
          <div className="flex items-start gap-[12px] bg-staking-bg rounded-[5px] p-4 h-[50%] w-full">
            <div className="flex justify-center items-center bg-[#202329] rounded-lg w-[73px] h-[68px]">
              <Image
                src="/assets/wallet.svg"
                alt="boost logo"
                height={44}
                width={41}
              />
            </div>
            <div>
              <p className="text-white font-medium text-base text-opacity-50">
                Total Claimed
              </p>
              <p className="text-[#94A3B8] font-semibold text-2xl">$0.00</p>
            </div>
          </div>
          <div className="flex items-center justify-between bg-staking-bg rounded-[5px] p-4 h-[50%] w-full">
            <div className="flex items-start gap-[12px]">
              <div className="flex justify-center items-center bg-[#202329] rounded-lg w-[73px] h-[68px]">
                <Image
                  src="/assets/envelope.svg"
                  alt="boost logo"
                  height={48}
                  width={48}
                />
              </div>
              <div>
                <p className="text-white font-medium text-base text-opacity-50">
                  Total Claimable
                </p>
                <p className="text-[#94A3B8] font-semibold text-2xl">$0.00</p>
              </div>
            </div>
            <div className="mr-4">
              <button className="text-white font-semibold font-chakra bg-[#7839C5] rounded-[5px] py-2 px-11">
                CLAIM
              </button>
            </div>
          </div>
        </div>
      )}
      {!campaigns && (
        <>
          <div className="mb-[1.125rem] hidden md:flex w-full flex-row items-center gap-2 bg-[#121418] py-1 rounded-[5px]">
            {referred
              ? referredHeaders.map((header, index) => (
                  <span
                    key={index}
                    className="w-full text-center font-changa text-[#F0F0F080]"
                  >
                    {translator(header, language)}
                  </span>
                ))
              : earnings
                ? earningsHeaders.map((header, index) => (
                    <span
                      key={index}
                      className="w-full text-center font-changa text-[#F0F0F080]"
                    >
                      {translator(header, language)}
                    </span>
                  ))
                : null}
          </div>
          <div className="mb-[1.4rem] flex md:hidden w-full flex-row items-center bg-[#121418] rounded-md py-1 gap-2">
            {smallScreenHeaders.map((header, index) => (
              <span
                key={index}
                className="w-full text-center font-changa text-[#F0F0F080]"
              >
                {header}
              </span>
            ))}
          </div>
        </>
      )}

      {/* <div
        className={`flex w-full flex-col
        ${loading ? " h-[50rem]" : ""}`}
      >
        {loading ? (
          <div className="h-20">
            <Loader />
          </div>
        ) : (
          <>
            <div className="scrollbar w-full mt-[1.125rem] pb-8">
              <div className="flex w-full md:min-w-[50rem] flex-col items-center">
                <div className="relative flex flex-col items-center w-full max-h-[36rem] overflow-hidden">
                  {tableData?.length ? (
                    <>
                      {tableData
                        .slice(
                          page * transactionsPerPage - transactionsPerPage,
                          page * transactionsPerPage,
                        )
                        .map((data, index) => (
                          <div
                            key={index}
                            className="mb-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] bg-[#121418] hover:bg-[#1f2024] py-3"
                          >
                            {referred && (
                              <div className="w-full flex items-center justify-between cursor-pointer">
                                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                                  {obfuscatePubKey(data.wallet)}
                                </span>
                                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                                  ${truncateNumber(data.wagered ?? 0)}
                                </span>
                                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                                  {data.commission ?? 0}%
                                </span>
                                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                                  ${truncateNumber(data.earned ?? 0)}
                                </span>
                              </div>
                            )}
                            {earnings && (
                              <div className="w-full flex items-center justify-between cursor-pointer">
                                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                                  ${data.cryptocurreny)}
                                </span>
                                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                                  ${truncateNumber(data.claimed ?? 0)}
                                </span>
                                <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                                  ${truncateNumber(data.claimable ?? 0)}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                    </>
                  ) : (
                    <span className="font-changa text-[#F0F0F080]">
                      {translator("No have not referred anyone.", language)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <TablePagination
              page={page}
              setPage={setPage}
              maxPages={maxPages}
              bets={bets}
            />
          </>
        )}
      </div> */}
      {modal && <CreateCampaignModal modal={modal} setModal={setModal} />}
    </div>
  );
}
