import Image from "next/image";
import { AdaptiveModal, AdaptiveModalContent } from "./AdaptiveModal";
import { useGlobalContext } from "./GlobalContext";
import { formatNumber, translator } from "@/context/transactions";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import Loader from "./games/Loader";
import { errorCustom, successCustom } from "./toasts/ToastGroup";

export default function ClaimModal({
  reached500,
  tokenAmount,
}: {
  reached500: boolean;
  tokenAmount: number;
}) {
  const methods = useForm();

  const {
    isClaimModalOpen,
    setIsClaimModalOpen,
    threshold,
    gambleUSDCReward,
    language,
    fetchClaimInfo,
    getLeaderBoard,
    session,
    getBalance,
  } = useGlobalContext();

  const handleCloseModal = () => {
    setIsClaimModalOpen(false);
  };

  const [withdraw, setWithdraw] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [withdrawWallet, setWithdrawWallet] = useState<string>("");

  const handleWalletChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setWithdrawWallet(e.target.value);
  };

  const onSubmit = async (data: any) => {
    if (!loading) {
      setLoading(true);
      let response: { success: boolean; message: string };

      try {
        const response = await fetch("/api/games/user/claimUSDC", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: session?.user?.id,
            option: 2,
            wallet: withdrawWallet,
            email: session?.user?.email,
          }),
        });

        const data = await response.json();
        if (data.success) {
          fetchClaimInfo();
          getLeaderBoard();
          getBalance();
          successCustom("USDC reward withdrawn successfully.");
          setIsClaimModalOpen(false);
        } else {
          errorCustom(translator(data.message, language));
        }
        setLoading(false);
      } catch (error) {
        console.error("Error withdrawing USDC reward:", error);
        errorCustom(translator("Error withdrawing USDC reward.", language));
        setLoading(false);
      }
    }
  };

  return (
    <AdaptiveModal open={isClaimModalOpen} onOpenChange={handleCloseModal}>
      <AdaptiveModalContent
        className={`bg-[#121418] sm:overflow-y-auto min-h-[40dvh] max-h-[85dvh] w-full pb-6`}
      >
        <div className="flex flex-col w-full gap-3.5 px-4 sm:p-0 pt-6 justify-center overflow-y-auto">
          {!reached500 && (
            <div className="mx-auto mb-4">
              <Image
                src={"/assets/supertoken.png"}
                width={180}
                height={150}
                alt={"Coin"}
              />
            </div>
          )}
          {!reached500 ? (
            <div className="flex flex-col bg-[#FFFFFF05] font-semibold text-lg text-white text-opacity-75 text-center p-3.5 rounded-md md:mt-8 font-changa">
              <p className="pb-3">Congrats! you’ve received</p>
              <p className="flex items-center justify-center gap-2 text-white font-bold text-[2.5rem]">
                <Image
                  src={"/assets/headCoin.png"}
                  width={30}
                  height={30}
                  alt={"User"}
                  className="rounded-full overflow-hidden"
                />
                <span>100</span>
              </p>
            </div>
          ) : (
            <div className="flex flex-col bg-[#FFFFFF05] font-semibold text-lg text-white text-opacity-75 text-center p-3.5 rounded-md md:mt-8 font-changa">
              <p className="pb-3">Congrats! you've won</p>
              <p className="text-white font-bold text-[2.5rem]">
                <span>$1 USDC</span>
              </p>
            </div>
          )}

          <div className="bg-[#252740] bg-opacity-50 rounded-[0.625rem] p-4">
            <div className="text-white text-xs font-medium text-opacity-50 mb-1">
              Claim $1 progress
            </div>
            <div className="flex items-center justify-between gap-8">
              <div className="flex items-baseline gap-1">
                <span className="text-white text-sm font-semibold text-opacity-75">
                  {formatNumber((tokenAmount * 100) / threshold, 2)}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Image
                  src={"/assets/headCoin.png"}
                  width={13}
                  height={13}
                  alt={"User"}
                  className="rounded-full overflow-hidden"
                />
                <span className="text-white text-sm font-semibold text-opacity-75">
                  {tokenAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  /500
                </span>
              </div>
            </div>
            <div
              className={`relative flex transition-width duration-1000 w-full rounded-full overflow-hidden h-1 bg-[#282E3D] mt-2 mb-2`}
            >
              <div className="absolute h-full w-full bg-transparent flex items-center justify-evenly">
                {Array.from({ length: 4 }, (_, index) => index + 1).map(
                  (_, index) => (
                    <div key={index} className="bg-[#202138] w-1 h-1" />
                  ),
                )}
              </div>
              <div
                style={{
                  width: `${(tokenAmount * 100) / threshold}%`,
                }}
                // className="h-full bg-[linear-gradient(91.179deg,#C867F0_0%,#1FCDF0_50.501%,#19EF99_100%)]"
                className="h-full bg-[#5F4DFF]"
              />
            </div>
          </div>

          {!reached500 && (
            <div className="mx-auto w-full">
              <Image
                src={"/assets/campaign-banner.png"}
                width={350}
                height={300}
                alt={"Banner"}
                className="w-full"
              />
            </div>
          )}

          {reached500 && (
            <div className="flex items-center gap-4">
              <div
                onClick={() => {
                  setWithdraw(true);
                }}
                className="bg-[#5F4DFF] text-white bg-opacity-50 rounded-[10px] text-center text-sm text-opacity-90 font-semibold w-full py-3 cursor-pointer"
              >
                Withdraw your 1 USDC!
              </div>
              <div
                onClick={() => gambleUSDCReward()}
                className="bg-[#5F4DFF] text-white bg-opacity-50 rounded-[10px] text-center text-sm text-opacity-90 font-semibold w-full py-3 cursor-pointer"
              >
                Gamble your 1 USDC!
              </div>
            </div>
          )}

          {withdraw && (
            <FormProvider {...methods}>
              <form
                className="flex w-full flex-col gap-0"
                autoComplete="off"
                onSubmit={methods.handleSubmit(onSubmit)}
              >
                <>
                  {/* wallet input box  */}
                  <div className="mb-0 flex w-full flex-col">
                    <label className="mb-1 font-changa font-medium text-xs text-white text-opacity-90">
                      {translator("Withdraw Wallet", language)}
                    </label>

                    <div
                      className={`group flex h-11 w-full cursor-pointer items-center rounded-[8px] bg-[#202329] pl-4 pr-2.5`}
                    >
                      <input
                        id={"withdraw-wallet"}
                        {...methods.register("withdraw-wallet", {
                          required: "Wallet is required",
                        })}
                        type={"text"}
                        lang="en"
                        step={"any"}
                        autoComplete="off"
                        onChange={handleWalletChange}
                        placeholder={""}
                        value={withdrawWallet}
                        className={`flex w-full min-w-0 bg-transparent text-sm text-[#94A3B8] placeholder-[#94A3B8]  placeholder-opacity-40 outline-none`}
                      />
                    </div>

                    <span
                      className={`${
                        methods.formState.errors["withdraw-wallet"]
                          ? "opacity-100"
                          : "opacity-0"
                      } mt-1.5 flex items-center gap-1 text-xs text-[#D92828]`}
                    >
                      {methods.formState.errors["withdraw-wallet"]
                        ? methods.formState.errors[
                            "withdraw-wallet"
                          ]!.message!.toString()
                        : "NONE"}
                    </span>
                  </div>
                  {/* button  */}
                  <button
                    type="submit"
                    className="rounded-[5px] -mt-1 mb-4 disabled:opacity-50 border border-[#F200F21A] bg-[#5F4DFF] hover:bg-[#7F71FF] focus:bg-[#4C3ECC] transition-all py-2.5 font-changa text-base font-medium text-[#F0F0F0] text-opacity-90"
                    disabled={
                      loading || !withdrawWallet || !(withdrawWallet.length > 0)
                    }
                  >
                    {loading ? <Loader /> : translator("Withdraw", language)}
                  </button>
                </>
              </form>
            </FormProvider>
          )}
        </div>
      </AdaptiveModalContent>
    </AdaptiveModal>
  );
}
