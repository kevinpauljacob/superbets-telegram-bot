import React, { ReactNode, useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { Header } from "./Header";
import InfoBar from "./Infobar";
import Sidebar from "./Sidebar";
import MobileSidebar from "./MobileSidebar";
import SubHeader from "./SubHeader";
import { useGlobalContext } from "./GlobalContext";
import BalanceModal from "./games/BalanceModal";
import { signOut, useSession } from "next-auth/react";
import MobileNavbar from "./MobileNavbar";
import VerifyFlipModal from "./games/CoinFlip/VerifyFlipModal";
import VerifyDiceModal from "./games/Dice/VerifyDiceModal";
import VerifyDice2Modal from "./games/Dice2/VerifyDice2Modal";
import VerifyLimboModal from "./games/Limbo/VerifyLimboModal";
import VerifyWheelModal from "./games/Wheel/VerifyWheelModal";
import VerifyKenoModal from "./games/Keno/VerifyKenoModal";
import VerifyMinesModal from "./games/Mines/VerifyMinesModal";
import { Flip } from "./games/CoinFlip/VerifyFlipModal";
import { Dice2 } from "./games/Dice2/VerifyDice2Modal";
import { Dice } from "./games/Dice/VerifyDiceModal";
import { Limbo } from "./games/Limbo/VerifyLimboModal";
import { Wheel } from "./games/Wheel/VerifyWheelModal";
import { Keno } from "./games/Keno/VerifyKenoModal";
import { Mines } from "./games/Mines/VerifyMinesModal";
import { GameTokens, GameType } from "@/utils/provably-fair";
import ConfigureAutoModal from "./games/ConfigureAutoModal";
import RollDiceProvablyFairModal from "./games/Dice/DiceProvablyFairModal";
import Dice2ProvablyFairModal from "./games/Dice2/Dice2ProvablyFairModal";
import CoinFlipProvablyFairModal from "./games/CoinFlip/CoinFlipProvablyFairModal";
import LimboProvablyFairModal from "./games/Limbo/LimboProvablyFairModal";
import WheelProvablyFairModal from "./games/Wheel/WheelProvablyFairModal";
import KenoProvablyFairModal from "./games/Keno/KenoProvablyFairModal";
import MinesProvablyFairModal from "./games/Mines/MinesProvablyFairModal";
import CreateCampaignModal from "@/components/affiliate-program/CreateCampaignModal";
import Footer from "./Footer";
import { soundAlert } from "@/utils/soundUtils";
import VerifyRoulette1Modal, {
  Roulette1,
} from "./games/roulette1/VerifyRoulette1Modal";
import VerifyRoulette2Modal, {
  Roulette2,
} from "./games/roulette2/VerifyRoulette2Modal";
import Roulette1ProvablyFairModal from "./games/roulette1/Roulette1ProvablyFairModal";
import Roulette2ProvablyFairModal from "./games/roulette2/Roulette2ProvablyFairModal";
import { maxPayouts, minAmtFactor } from "@/context/config";
import VerifyPlinkoModal, { Plinko } from "./games/Plinko/VerifyPlinkoModal";
import PlinkoProvablyFairModal from "./games/Plinko/PlinkoProvablyFairModal";
import ConnectModal from "./games/ConnectModal";
import {
  AdaptiveModal,
  AdaptiveModalContent,
} from "@/components/AdaptiveModal";
import { formatNumber } from "@/context/transactions";

interface Props {
  children: ReactNode;
}

export default function ({ children }: Props) {
  const router = useRouter();
  const game = router.pathname.split("/")[1];

  const {
    showWalletModal,
    showConnectModal,
    showCreateCampaignModal,
    setShowCreateCampaignModal,
    getBalance,
    isVerifyModalOpen,
    closeVerifyModal,
    coinData,
    verifyModalData,
    sidebar,
    mobileSidebar,
    setSidebar,
    setMobileSidebar,
    setAutoBetCount,
    setStartAuto,
    openPFModal,
    setOpenPFModal,
    getProvablyFairData,
    setCurrentGame,
    setUseAutoConfig,
    autoConfigState,
    setAutoWinChange,
    setAutoLossChange,
    setAutoStopProfit,
    setAutoStopLoss,
    setAutoWinChangeReset,
    setAutoLossChangeReset,
    getUserDetails,
    selectedCoin,
    minGameAmount,
    setMinGameAmount,
    session,
    status,
    getGlobalInfo,
    isModalOpen,
    myData,
    reached500,
    claimInfo,
    maxPages,
    transactionsPerPage,
    threshold,
    data,
    setIsModalOpen,
    setMyData,
    setReached500,
    setClaimInfo,
    setMaxPages,
    setData,
    getLeaderBoard,
    fetchClaimInfo,
    claimUSDCReward,
  } = useGlobalContext();

  const tokenAmount = useMemo(
    () =>
      Math.max(0, coinData?.find((c) => c.tokenMint === "SUPER")?.amount ?? 0),
    [coinData],
  );

  const [modalData, setModalData] = useState({
    activeGameSeed: {
      account: "",
      clientSeed: "",
      serverSeed: "",
      serverSeedHash: "",
      nonce: 0,
      status: "",
    },
    nextGameSeed: {
      account: "",
      clientSeed: "",
      serverSeed: "",
      serverSeedHash: "",
      nonce: 0,
      status: "",
    },
  });

  const scrollToTop = () => {
    const scrollElement = document.querySelector("#scroll-element");
    if (scrollElement) {
      scrollElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleUserInteraction = () => {
    soundAlert("/sounds/betbutton.wav", true);
    soundAlert("/sounds/diceshake.wav", true);
    soundAlert("/sounds/slider.wav", true);
    soundAlert("/sounds/win.wav", true);
    soundAlert("/sounds/bomb.wav", true);

    document.removeEventListener("mousemove", handleUserInteraction);
    document.removeEventListener("touchstart", handleUserInteraction);
    document.removeEventListener("touchmove", handleUserInteraction);
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleUserInteraction, {
      once: true,
    });
    document.addEventListener("touchstart", handleUserInteraction, {
      once: true,
    });
    document.addEventListener("touchmove", handleUserInteraction, {
      once: true,
    });
    return () => {
      document.removeEventListener("mousemove", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
      document.removeEventListener("touchmove", handleUserInteraction);
    };
  }, []);

  useEffect(() => {
    (async () => {
      if (session?.user?.email) {
        const pfData = await getProvablyFairData();
        if (pfData) setModalData(pfData);
      }
    })();
  }, [session?.user]);

  const toggleSidebar = () => {
    setSidebar(!sidebar);
    setMobileSidebar(!sidebar);
  };

  const openPfModal = () => {
    setOpenPFModal(true);
  };

  const closePfModal = () => {
    setOpenPFModal(false);
  };

  useEffect(() => {
    scrollToTop();
    setAutoBetCount(1);
    setStartAuto(false);
    const configOptions = autoConfigState.get(game);
    if (configOptions) {
      setAutoWinChange(configOptions.autoWinChange);
      setAutoLossChange(configOptions.autoLossChange);
      setAutoWinChangeReset(configOptions.autoWinChangeReset);
      setAutoLossChangeReset(configOptions.autoLossChangeReset);
      setAutoStopProfit(configOptions.autoStopProfit);
      setAutoStopLoss(configOptions.autoStopLoss);
      setUseAutoConfig(configOptions.useAutoConfig);
    } else {
      setAutoWinChange(null);
      setAutoLossChange(null);
      setAutoWinChangeReset(true);
      setAutoLossChangeReset(true);
      setAutoStopProfit(null);
      setAutoStopLoss(null);
      setUseAutoConfig(false);
    }
  }, [router.pathname]);

  useEffect(() => {
    if (session?.user && !showWalletModal) {
      getUserDetails();
    }
    setCurrentGame(game);
    setMinGameAmount(
      maxPayouts[selectedCoin.tokenMint as GameTokens][game as GameType] *
        minAmtFactor,
    );
  }, [session?.user, game, showWalletModal, selectedCoin]);

  useEffect(() => {
    if (session?.user && !showWalletModal) {
      getBalance();
    }
    getGlobalInfo();
  }, [session?.user, game, showWalletModal]);

  useEffect(() => {
    getLeaderBoard();
  }, [session?.user]);

  useEffect(() => {
    fetchClaimInfo();
  }, []);

  useEffect(() => {
    if (tokenAmount >= 500) {
      setReached500(true);
      if (!myData?.isUSDCClaimed) setIsModalOpen(true);
    }
  }, [tokenAmount]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* <InfoBar /> */}
      <Header sidebar={sidebar} toggleSidebar={toggleSidebar} />
      <section className="relative flex flex-1 max-h-[calc(100%-5rem)]">
        <Sidebar sidebar={sidebar} setSidebar={setSidebar} />
        <section className="w-full relative overflow-hidden">
          <MobileSidebar />
          <section className="relative w-full h-full pt-[4.4rem] md:pt-[0rem]">
            <SubHeader />
            <main
              className={`marker:w-full h-full max-h-[calc(100%-0rem)] pt-6`}
            >
              <section className="w-full h-full overflow-y-auto no-scrollbar">
                <div
                  id="scroll-element"
                  className="w-full min-h-[1px] bg-transparent"
                />
                {children}
                <div className="w-full">
                  <Footer />
                </div>
              </section>
            </main>
          </section>
        </section>
      </section>
      <div className="w-full fixed bottom-0 flex md:hidden z-[1000]">
        <MobileNavbar sidebar={mobileSidebar} toggleSidebar={toggleSidebar} />
      </div>
      {showWalletModal && <BalanceModal />}
      {showConnectModal && <ConnectModal />}
      {showCreateCampaignModal && <CreateCampaignModal />}
      {/* verify modals  */}
      {verifyModalData.game === GameType.coin ? (
        <VerifyFlipModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ flip: (verifyModalData as Flip)! }}
          wallet={session?.user?.wallet}
        />
      ) : verifyModalData.game === GameType.dice ? (
        <VerifyDiceModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Dice)! }}
          wallet={session?.user?.wallet}
        />
      ) : verifyModalData.game === GameType.dice2 ? (
        <VerifyDice2Modal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Dice2)! }}
          wallet={session?.user?.wallet}
        />
      ) : verifyModalData.game === GameType.limbo ? (
        <VerifyLimboModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ flip: (verifyModalData as Limbo)! }}
          wallet={session?.user?.wallet}
        />
      ) : verifyModalData.game === GameType.wheel ? (
        <VerifyWheelModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Wheel)! }}
          wallet={session?.user?.wallet}
        />
      ) : verifyModalData.game === GameType.keno ? (
        <VerifyKenoModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Keno)! }}
          wallet={session?.user?.wallet}
        />
      ) : verifyModalData.game === GameType.mines ? (
        <VerifyMinesModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Mines)! }}
          wallet={session?.user?.wallet}
        />
      ) : verifyModalData.game === GameType.roulette1 ? (
        <VerifyRoulette1Modal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Roulette1)! }}
          wallet={session?.user?.wallet}
        />
      ) : verifyModalData.game === GameType.roulette2 ? (
        <VerifyRoulette2Modal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Roulette2)! }}
          wallet={session?.user?.wallet}
        />
      ) : verifyModalData.game === GameType.plinko ? (
        <VerifyPlinkoModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Plinko)! }}
          wallet={session?.user?.wallet}
        />
      ) : null}

      {/* pf modals  */}
      {game === GameType.coin ? (
        <CoinFlipProvablyFairModal
          isOpen={openPFModal}
          onClose={closePfModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : game === GameType.dice ? (
        <RollDiceProvablyFairModal
          isOpen={openPFModal}
          onClose={closePfModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : game === GameType.dice2 ? (
        <Dice2ProvablyFairModal
          isOpen={openPFModal}
          onClose={closePfModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : game === GameType.limbo ? (
        <LimboProvablyFairModal
          isOpen={openPFModal}
          onClose={closePfModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : game === GameType.wheel ? (
        <WheelProvablyFairModal
          isOpen={openPFModal}
          onClose={closePfModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : game === GameType.keno ? (
        <KenoProvablyFairModal
          isOpen={openPFModal}
          onClose={closePfModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : game === GameType.mines ? (
        <MinesProvablyFairModal
          isOpen={openPFModal}
          onClose={closePfModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : game === GameType.roulette1 ? (
        <Roulette1ProvablyFairModal
          isOpen={openPFModal}
          onClose={closePfModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : game === GameType.roulette2 ? (
        <Roulette2ProvablyFairModal
          isOpen={openPFModal}
          onClose={closePfModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : game === GameType.plinko ? (
        <PlinkoProvablyFairModal
          isOpen={openPFModal}
          onClose={closePfModal}
          modalData={modalData}
          setModalData={setModalData}
        />
      ) : null}

      <ConfigureAutoModal />
      {/* Modal */}
      {isModalOpen && (
        <AdaptiveModal open={isModalOpen} onOpenChange={handleCloseModal}>
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
                <div
                  onClick={() => claimUSDCReward()}
                  className="bg-[#5F4DFF] text-white bg-opacity-50 rounded-[10px] text-center text-sm text-opacity-90 font-semibold w-full py-3"
                >
                  Claim your 1 USDC!
                </div>
              )}
            </div>
          </AdaptiveModalContent>
        </AdaptiveModal>
      )}
    </>
  );
}
