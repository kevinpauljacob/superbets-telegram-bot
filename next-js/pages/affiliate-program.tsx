import { useGlobalContext } from "@/components/GlobalContext";
import { TButton, TablePagination } from "@/components/table/Table";
import { errorCustom } from "@/components/toasts/ToastGroup";
import { formatNumber, translator } from "@/context/transactions";
import { useWallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ReferralLink from "@/components/affiliate-program/ReferralLink";
import CreateCampaignModal from "@/components/affiliate-program/CreateCampaignModal";
import Levels from "@/components/affiliate-program/Levels";
import Loader from "@/components/games/Loader";
import {
  obfuscatePubKey,
  truncateNumber,
  claimEarnings,
} from "@/context/transactions";
import { SPL_TOKENS, commissionLevels } from "@/context/config";

interface Referral {
  _id: string;
  wallet: string;
  email: string;
  __v: number;
  campaigns: Campaign[];
  createdAt: string;
  feeGenerated: Record<string, any>;
  referredByChain: any[];
  updatedAt: string;
  volume: Record<string, any>;
}

type ReferralData = Referral[];

interface Campaign {
  _id: string;
  wallet: string;
  campaignName: string;
  referralCode: string;
  totalEarnings: Record<string, any>;
  unclaimedEarnings: Record<string, any>;
  signupCount: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

type CampaignData = Campaign[];

interface Earnings {
  tokenName: string;
  totalEarnings: number;
  unclaimedEarnings: number;
}

type EarningsData = Earnings[];

interface ReferralLevel {
  userId: string;
  level: number;
}

interface ReferralLevelData {
  signUps: number;
  totalEarnings: number;
}

export const copyToClipboard = (text?: string) => {
  if (text) {
    navigator.clipboard
      .writeText(text)
      .catch((err) => console.error("Failed to copy text: ", err));
  } else {
    console.warn("No text provided to copy to clipboard.");
  }
};

export default function AffiliateProgram() {
  const wallet = useWallet();
  const router = useRouter();
  const {
    language,
    liveTokenPrice,
    showCreateCampaignModal,
    setShowCreateCampaignModal,
    getBalance,
    session,
  } = useGlobalContext();
  const transactionsPerPage = 10;
  const [page, setPage] = useState(1);
  const [referred, setReferred] = useState(true);
  const [campaigns, setCampaigns] = useState(false);
  const [earnings, setEarnings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [userCampaigns, setUserCampaigns] = useState<CampaignData>([]);
  const [referredUsers, setReferredUsers] = useState<ReferralData>([]);
  const [sortedUsers, setSortedUsers] = useState<ReferralData>([]);
  const [user, setUser] = useState([]);
  const [referralLevels, setReferralLevels] = useState<ReferralLevel[]>([]);
  const [earningsData, setEarningsData] = useState<EarningsData>([]);
  const [totalClaimed, setTotalClaimed] = useState(0);
  const [totalClaimable, setTotalClaimable] = useState(0);
  const initialReferralLevelData: ReferralLevelData[] = Array.from(
    { length: 5 },
    () => ({
      signUps: 0,
      totalEarnings: 0,
    }),
  );

  const [referralLevelData, setReferralLevelData] = useState<
    ReferralLevelData[]
  >(initialReferralLevelData);

  const [buttonText, setButtonText] = useState("Copy");

  const colors = ["4594FF", "E17AFF", "00C278", "4594FF", "00C278"];

  const referredTabHeaders = [
    "User",
    "Level",
    "Wagered",
    "Commission %",
    "Earned",
  ];
  const earningsTabHeaders = [
    "Cryptocurreny",
    "Previously Claimed",
    "Claimable",
  ];
  const smallScreenReferredTabHeaders = ["User", "Level", "Earned"];

  useEffect(() => {
    const calculateReferralLevels = () => {
      const levels: ReferralLevel[] = referredUsers.map((referredUser) => {
        let level = -1;
        userCampaigns.forEach((campaign, index) => {
          const pos = referredUser.referredByChain.indexOf(campaign._id);
          if (pos !== -1 && (level === -1 || pos < level)) {
            level = pos;
          }
        });
        return { userId: referredUser._id, level };
      });
      setReferralLevels(levels);
      // console.log("referralLevels", levels);
    };

    calculateReferralLevels();
  }, [referredUsers]);

  const getReferralLevel = (userId: string): number => {
    const referral = referralLevels.find((r) => r.userId === userId);
    return referral ? referral.level : -1;
  };

  const calculateWagerAmount = (
    volume: Record<string, number>,
  ): { amount: number; currency: string } => {
    console.log("volume", volume);
    let totalAmountInDollars = 0;
    let superAmount = 0;

    const realTokens = ["SOL", "USDC"];
    let hasRealTokens = false;

    for (const [token, amount] of Object.entries(volume)) {
      if (token === "SUPER") {
        superAmount += amount;
      } else if (realTokens.includes(token)) {
        hasRealTokens = true;
        const tokenPriceObj = liveTokenPrice.find(
          (priceObj) => priceObj.mintAddress === token,
        );
        if (tokenPriceObj) {
          totalAmountInDollars += amount * tokenPriceObj.price;
        }
      }
    }

    if (hasRealTokens) {
      return { amount: totalAmountInDollars, currency: "$" };
    } else if (superAmount > 0) {
      return { amount: superAmount, currency: "SUPER" };
    } else {
      return { amount: 0, currency: "$" };
    }
  };

  const calculateFeeGenerated = (
    feeGenerated: Record<string, any>,
    referralLevel: number,
  ): { amount: number; currency: string } => {
    console.log("feeGenerated", feeGenerated);
    let totalAmountInDollars = 0;
    let superAmount = 0;

    const realTokens = ["SOL", "USDC"];
    let hasRealTokens = false;

    for (const [token, amount] of Object.entries(feeGenerated)) {
      if (typeof amount !== "number") {
        console.warn(`Skipping non-number amount for token ${token}`);
        continue;
      }

      if (token === "SUPER") {
        superAmount += amount;
      } else if (realTokens.includes(token)) {
        hasRealTokens = true;
        const tokenPriceObj = liveTokenPrice.find(
          (priceObj) => priceObj.mintAddress === token,
        );
        if (tokenPriceObj) {
          totalAmountInDollars += amount * tokenPriceObj.price;
        }
      }
    }

    const commission = commissionLevels[referralLevel];

    if (hasRealTokens) {
      return {
        amount: totalAmountInDollars * commission,
        currency: "$",
      };
    } else if (superAmount > 0) {
      return {
        amount: superAmount * commission,
        currency: "SUPER",
      };
    } else {
      return { amount: 0, currency: "$" };
    }
  };

  const calculateTotalEarnings = (
    feeGenerated: Record<string, number>,
  ): { dollarValue: number; hasSuperOnly: boolean } => {
    let totalDollarValue = 0;
    let hasSuperOnly = true;

    for (const [token, amount] of Object.entries(feeGenerated)) {
      if (token === "SUPER") {
        // Assuming SUPER has no real dollar value
        continue;
      }

      hasSuperOnly = false;
      const tokenPriceObj = liveTokenPrice.find(
        (priceObj) => priceObj.mintAddress === token,
      );
      if (tokenPriceObj) {
        totalDollarValue += amount * tokenPriceObj.price;
      }
    }

    // If only SUPER tokens, use the SUPER amount as a sorting value
    if (hasSuperOnly && feeGenerated.SUPER) {
      totalDollarValue = feeGenerated.SUPER;
    }

    return { dollarValue: totalDollarValue, hasSuperOnly };
  };

  // Sorting function
  const sortUsersByEarnings = (users: any[]) => {
    return users.sort((a, b) => {
      const aEarnings = calculateTotalEarnings(a.feeGenerated);
      const bEarnings = calculateTotalEarnings(b.feeGenerated);

      // First, sort by whether they have real tokens or only SUPER
      if (aEarnings.hasSuperOnly && !bEarnings.hasSuperOnly) return 1;
      if (!aEarnings.hasSuperOnly && bEarnings.hasSuperOnly) return -1;

      // Then, sort by dollar value in descending order
      return bEarnings.dollarValue - aEarnings.dollarValue;
    });
  };

  const referralData = () => {
    console.log("Here 1");
    referredUsers.forEach((user) => {
      const referralLevel = getReferralLevel(user._id) ?? -1;
      if (referralLevel === -1) {
        return;
      }
      const { feeGenerated } = user;
      let totalEarnings = 0;

      for (const [token, amount] of Object.entries(feeGenerated)) {
        // Assuming liveTokenPrice is available
        const tokenPriceObj = liveTokenPrice.find(
          (priceObj) => priceObj.mintAddress === token,
        );
        if (tokenPriceObj) {
          totalEarnings += amount * tokenPriceObj.price;
        }
      }

      // console.log("referral level", referralLevel);
      if (referralLevel !== -1) {
        initialReferralLevelData[referralLevel].signUps += 1;
        initialReferralLevelData[referralLevel].totalEarnings += totalEarnings;
      }
    });

    // console.log("Here 2");
    // console.log("updatedReferralLevelData", initialReferralLevelData);
    setReferralLevelData(initialReferralLevelData);
  };

  console.log("session", session);
  useEffect(() => {
    if (referredUsers.length > 0) referralData();
  }, [referredUsers, referralLevels]);

  const calculateEarnings = () => {
    // Temporary object to accumulate earnings
    const tempEarningsData: Record<
      string,
      { totalEarnings: number; unclaimedEarnings: number }
    > = {};

    // Iterate over each campaign to accumulate earnings
    userCampaigns.forEach((campaign) => {
      const { totalEarnings, unclaimedEarnings } = campaign;

      // Helper function to process earnings
      const processEarnings = (
        earnings: Record<string, number> | undefined,
        key: "totalEarnings" | "unclaimedEarnings",
      ) => {
        if (earnings && typeof earnings === "object") {
          Object.entries(earnings).forEach(([tokenMint, amount]) => {
            const tokenPriceObj = liveTokenPrice.find(
              (priceObj) => priceObj.mintAddress === tokenMint,
            );

            if (tokenPriceObj) {
              const { price } = tokenPriceObj;
              const dollars = amount * price;
              const tokenName = SPL_TOKENS.find(
                (token) => token.tokenMint === tokenMint,
              )?.tokenName;

              if (tokenName) {
                tempEarningsData[tokenName] = tempEarningsData[tokenName] || {
                  totalEarnings: 0,
                  unclaimedEarnings: 0,
                };
                tempEarningsData[tokenName][key] =
                  (tempEarningsData[tokenName][key] || 0) + dollars;
              }
            }
          });
        }
      };

      // Process totalEarnings and unclaimedEarnings
      processEarnings(totalEarnings, "totalEarnings");
      processEarnings(unclaimedEarnings, "unclaimedEarnings");
    });

    // Convert tempEarningsData object to an array
    const earningsDataArray: {
      tokenName: string;
      totalEarnings: number;
      unclaimedEarnings: number;
    }[] = Object.entries(tempEarningsData).map(
      ([tokenName, { totalEarnings, unclaimedEarnings }]) => ({
        tokenName,
        totalEarnings,
        unclaimedEarnings,
      }),
    );

    // Set the earningsData state once
    setEarningsData(earningsDataArray);

    // Calculate total claimed and total claimable earnings
    const totalClaimed = earningsDataArray.reduce(
      (acc, { totalEarnings, unclaimedEarnings }) =>
        acc + totalEarnings - unclaimedEarnings,
      0,
    );
    const totalClaimable = earningsDataArray.reduce(
      (acc, { unclaimedEarnings }) => acc + unclaimedEarnings,
      0,
    );

    // Set the state for total claimed and total claimable earnings
    setTotalClaimed(totalClaimed);
    setTotalClaimable(totalClaimable);
  };

  useEffect(() => {
    if (userCampaigns.length > 0) calculateEarnings();
  }, [userCampaigns]);

  const fetchData = async () => {
    try {
      const url = "/api/referral";

      const payload: { email?: string } = {};

      if (session?.user) {
        if (session.user.email) {
          payload.email = session.user.email;
        }
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Error fetching data:", error);
        throw new Error("Failed to fetch data");
      }
      const { success, user, referredUsers, message } = await response.json();

      if (success) {
        setUser(user);
        setUserId(user._id);
        setUserCampaigns(user.campaigns);
        setReferredUsers(referredUsers);
        console.log("referred users", referredUsers);
        // console.log("user", user);
        // console.log("referredUsers", referredUsers);
      }
    } catch (error: any) {
      // console.error("Error fetching data:", error.message);
    }
  };

  // fetch user data
  useEffect(() => {
    if ((wallet && wallet.connected && session?.user) || session?.user?.email) {
      fetchData();
    }
  }, [wallet, session?.user?.email]);

  useEffect(() => {
    const claimEarnings = async (email: string, userCampaigns: Campaign[]) => {
      console.log("Checking for claimable SUPER tokens");
      try {
        const campaignsWithSuperTokens = userCampaigns.filter((campaign) => {
          const unclaimedSuper = campaign.unclaimedEarnings["SUPER"];
          return unclaimedSuper && unclaimedSuper > 0;
        });

        if (campaignsWithSuperTokens.length === 0) {
          console.log("No campaigns with claimable SUPER tokens found");
          return;
        }

        for (const campaign of campaignsWithSuperTokens) {
          const response = await fetch("/api/referral/web2User/claim", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email,
              campaignId: campaign._id,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to claim earnings");
          }

          const data = await response.json();
          console.log(
            `Claimed SUPER earnings for campaign ${campaign.campaignName}:`,
            data,
          );
        }

        await fetchData();
        await getBalance();
      } catch (error) {
        console.error("Error claiming earnings:", error);
      }
    };

    if (userCampaigns.length > 0 && session?.user?.email) {
      claimEarnings(session.user.email, userCampaigns);
    }
  }, [session?.user?.email, userCampaigns]);

  useEffect(() => {
    const users = sortUsersByEarnings(referredUsers);
    setSortedUsers(users);
    console.log("sorted users", users);
  }, [referredUsers]);

  // useEffect(() => {
  //   console.log("userData", user);
  // }, [user]);

  // useEffect(() => {
  //   console.log("totalClaimed", totalClaimed);
  //   console.log("totalClaimable", totalClaimable);
  // }, [totalClaimed, totalClaimable]);

  useEffect(() => {
    console.log("referralLevelData", referralLevelData);
  }, [referralLevelData]);

  return (
    <div className="px-5 lg2:px-[4rem] md:px-[3rem] pt-5">
      <h1 className="font-chakra font-bold text-[1.75rem] text-white mb-3.5">
        {translator("AFFILIATE PROGRAM", language)}
      </h1>

      {/* mobile tabs */}
      <div className="flex flex-col sm:hidden gap-4 justify-between mb-4">
        <div className="flex w-full md:w-max items-center gap-2 justify-center md:justify-end border-2 p-1.5 rounded-lg border-white border-opacity-[5%]">
          <TButton
            active={referred}
            onClick={() => {
              if (wallet.publicKey || session?.user?.email) {
                setReferred(true);
                setCampaigns(false);
                setEarnings(false);
              } else {
                errorCustom(translator("Wallet not connected", language));
              }
            }}
            label={translator("Referred", language)}
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
            className="bg-[#5F4DFF] hover:bg-[#7F71FF] focus:bg-[#4C3ECC] transition-all cursor-pointer text-white font-chakra font-semibold text-sm rounded-[5px] px-8 py-4"
            onClick={() => setShowCreateCampaignModal(!showCreateCampaignModal)}
          >
            {translator("CREATE CAMPAIGN", language)}
          </button>
        )}
      </div>

      <div
        className={`${campaigns || earnings ? "hidden sm:flex" : ""} flex flex-col gap-[11px] sm:gap-[14px] sm:mt-7 mb-[1.75rem] sm:mb-[3.25rem]`}
      >
        <div className="flex gap-[14px] w-full">
          <div className="flex flex-col justify-between grow bg-staking-bg rounded-[5px] p-4 w-[30%]">
            <div>
              <p className="text-white font-semibold text-base text-opacity-75">
                {translator("Multi-Level Referral", language)}
              </p>
              <p className="text-[#94A3B8] font-semibold text-[11px] text-opacity-50 md:max-w-[340px]">
                {translator(
                  "Our affiliate program includes a comprehensive retention program that keeps referred customers engaged and invested.",
                  language,
                )}
              </p>
            </div>
            {userCampaigns.length > 0 && (
              <div className="mt-3.5">
                <p className="text-white/50 font-chakra font-semibold text-xs mb-2">
                  {translator("Referral Link", language)}
                </p>
                <div className="flex gap-3 mb-4">
                  <span className="text-ellipsis overflow-hidden bg-white/5 rounded-[5px] text-sm font-chakra text-[#94A3B8] font-normal px-4 py-1">
                    {`referralCode=${userCampaigns[userCampaigns.length - 1]?.referralCode}`}
                  </span>
                  <button
                    onClick={() => {
                      copyToClipboard(
                        `https://superbets.games?referralCode=${userCampaigns[userCampaigns.length - 1]?.referralCode}`,
                      );
                      setButtonText("Copied!");
                      setTimeout(() => {
                        setButtonText("Copy");
                      }, 2000);
                    }}
                    className="bg-[#5F4DFF] hover:bg-[#7F71FF] focus:bg-[#4C3ECC] transition-all cursor-pointer rounded-[5px] text-white/75 text-[13px] font-chakra font-medium px-5"
                  >
                    {translator(buttonText, language)}
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="hidden lg:flex flex-col justify-between bg-staking-bg rounded-[5px] px-4 pt-4 pb-8">
            <p className="text-white/75 font-semibold">
              {translator("How it Works?", language)}
            </p>
            <Image
              src="/assets/banners/affiliate-program.png"
              alt="how it works image"
              width={805}
              height={205}
            />
          </div>
        </div>
        <Levels referralLevelData={referralLevelData} />
      </div>

      {/* tabs */}
      <div className="hidden sm:flex gap-4 justify-between mb-6">
        <div className="flex w-full md:w-max items-center gap-2 justify-center md:justify-end border-2 p-1.5 rounded-lg border-white border-opacity-[5%]">
          <TButton
            active={referred}
            onClick={() => {
              if (wallet.publicKey || session?.user?.email) {
                setReferred(true);
                setCampaigns(false);
                setEarnings(false);
              } else {
                errorCustom(translator("Wallet not connected", language));
              }
            }}
            label={translator("Referred", language)}
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
            className="bg-[#5F4DFF] hover:bg-[#7F71FF] focus:bg-[#4C3ECC] transition-all cursor-pointer text-white font-chakra font-semibold text-sm rounded-[5px] px-8 py-4"
            onClick={() => setShowCreateCampaignModal(!showCreateCampaignModal)}
          >
            {translator("CREATE CAMPAIGN", language)}
          </button>
        )}
      </div>

      {/* earnings tab */}
      {earnings && (
        <div className="flex flex-col sm:flex-row gap-[14px] sm:gap-[1.85rem] w-full mt-[5px] sm:mt-0 mb-[2.15rem] sm:mb-[2.63rem]">
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
              <p className="text-white font-medium text-xs lg:text-base text-opacity-50">
                {translator("Total Claimed", language)}
              </p>
              <p className="text-[#94A3B8] font-semibold font-chakra text-lg lg:text-2xl">
                ${formatNumber(totalClaimed, 2) ?? 0}
              </p>
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
                <p className="text-white font-medium text-xs lg:text-base text-opacity-50">
                  {translator("Total Claimable", language)}
                </p>
                <p className="text-[#94A3B8] font-semibold font-chakra text-lg lg:text-2xl">
                  ${formatNumber(totalClaimable, 2) ?? 0}
                </p>
              </div>
            </div>
            <div className="sm:mr-4">
              <button
                disabled={totalClaimable === 0}
                className="disabled:cursor-default disabled:opacity-70 disabled:bg-[#555555] text-white text-xs lg:text-base font-semibold font-chakra bg-[#5F4DFF] hover:bg-[#7F71FF] focus:bg-[#4C3ECC] transition-all cursor-pointer rounded-[5px] py-2 px-7 lg:px-11"
                onClick={() => claimEarnings(wallet, userCampaigns)}
              >
                {translator("CLAIM", language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* table headers */}
      {!campaigns && (
        <>
          <div className="mb-[1.125rem] hidden md:flex w-full flex-row items-center gap-2 bg-[#121418] py-1 rounded-[5px]">
            {referred
              ? referredTabHeaders.map((header, index) => (
                  <span
                    key={index}
                    className="w-full text-center font-changa text-[#F0F0F080]"
                  >
                    {translator(header, language)}
                  </span>
                ))
              : earnings
                ? earningsTabHeaders.map((header, index) => (
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
            {smallScreenReferredTabHeaders.map((header, index) => (
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

      {/* referred table */}
      {referred && (
        <div className={`flex w-full flex-col ${loading ? "h-[50rem]" : ""}`}>
          {loading ? (
            <div className="h-20">
              <Loader />
            </div>
          ) : (
            <>
              <div className="scrollbar w-full pb-8">
                <div className="flex w-full flex-col items-center">
                  <div className="relative flex flex-col items-center w-full max-h-[36rem] overflow-hidden">
                    {sortedUsers?.length ? (
                      <>
                        {sortedUsers
                          .slice(
                            page * transactionsPerPage - transactionsPerPage,
                            page * transactionsPerPage,
                          )
                          .map((user, index) => {
                            const level = getReferralLevel(user._id);
                            return (
                              <div
                                key={index}
                                className="mb-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] bg-[#121418] hover:bg-[#1f2024] py-3"
                              >
                                <div className="w-full flex items-center justify-between cursor-pointer">
                                  <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                                    {!user.wallet || user.wallet === null
                                      ? user.email
                                      : obfuscatePubKey(user.wallet)}
                                  </span>
                                  <span className="w-full text-center font-changa text-sm text-opacity-75">
                                    <span
                                      className="rounded-[5px] px-2.5"
                                      style={{
                                        backgroundColor: `rgba(${parseInt(colors[level]?.slice(0, 2), 16)}, ${parseInt(colors[level]?.slice(2, 4), 16)}, ${parseInt(colors[level]?.slice(4, 6), 16)}, 0.1)`,
                                        color: `#${colors[level]}`,
                                      }}
                                    >
                                      {translator("Level", language)}{" "}
                                      {level + 1}
                                    </span>
                                  </span>
                                  <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                                    {(() => {
                                      const result = calculateWagerAmount(
                                        user.volume,
                                      );
                                      return result.currency === "$"
                                        ? `$${formatNumber(result.amount, 2)}`
                                        : `${formatNumber(result.amount, 2)} ${result.currency}`;
                                    })()}
                                  </span>
                                  <span className="w-full hidden md:block text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                                    {user._id &&
                                      truncateNumber(
                                        commissionLevels[level] * 100,
                                      )}
                                    %
                                  </span>
                                  <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                                    {(() => {
                                      const result = calculateFeeGenerated(
                                        user.feeGenerated,
                                        level,
                                      );
                                      return result.currency === "$"
                                        ? `$${formatNumber(result.amount, 2)}`
                                        : `${formatNumber(result.amount, 2)} ${result.currency}`;
                                    })()}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </>
                    ) : (
                      <span className="font-changa text-[#F0F0F080]">
                        {translator("You have not referred anyone.", language)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* <TablePagination
              page={page}
              setPage={setPage}
              maxPages={maxPages}
              bets={bets}
            /> */}
            </>
          )}
        </div>
      )}

      {/* campaigns tab */}
      {campaigns && (
        <div>
          {userCampaigns.length > 0 ? (
            userCampaigns.map((campaign, index) => (
              <ReferralLink
                campaignName={campaign?.campaignName}
                referralCode={campaign?.referralCode}
                totalEarnings={campaign?.totalEarnings}
                signupCount={campaign?.signupCount}
                key={index}
              />
            ))
          ) : (
            <p className="text-center font-changa text-[#F0F0F080]">
              {translator("No campaigns created", language)}
            </p>
          )}
        </div>
      )}

      {/* earnings table */}
      {earnings && (
        <div className={`flex w-full flex-col ${loading ? "h-[50rem]" : ""}`}>
          {loading ? (
            <div className="h-20">
              <Loader />
            </div>
          ) : (
            <>
              <div className="scrollbar w-full pb-8">
                <div className="flex w-full flex-col items-center">
                  <div className="relative flex flex-col items-center w-full max-h-[36rem] overflow-hidden">
                    {earningsData?.length ? (
                      <>
                        {earningsData
                          .slice(
                            page * transactionsPerPage - transactionsPerPage,
                            page * transactionsPerPage,
                          )
                          .map((token, index) => (
                            <div
                              key={index}
                              className="mb-2.5 flex w-full flex-row items-center gap-2 rounded-[5px] bg-[#121418] hover:bg-[#1f2024] py-3"
                            >
                              <div className="w-full flex items-center justify-between cursor-pointer">
                                <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                                  ${token.tokenName}
                                </span>
                                <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                                  {formatNumber(
                                    token.totalEarnings -
                                      token.unclaimedEarnings ?? 0,
                                    2,
                                  )}
                                </span>
                                <span className="w-full text-center font-changa text-sm text-[#F0F0F0] text-opacity-75">
                                  {formatNumber(
                                    token.unclaimedEarnings ?? 0,
                                    2,
                                  )}
                                </span>
                              </div>
                            </div>
                          ))}
                      </>
                    ) : (
                      <span className="font-changa text-[#F0F0F080]">
                        {translator("You have not referred anyone.", language)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* <TablePagination
              page={page}
              setPage={setPage}
              maxPages={maxPages}
              bets={bets}
            /> */}
            </>
          )}
        </div>
      )}
    </div>
  );
}
