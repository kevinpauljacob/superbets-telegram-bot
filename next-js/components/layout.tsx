import React, { ReactNode, useEffect, useState } from "react";
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
import { useWallet } from "@solana/wallet-adapter-react";
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
import { handleSignIn } from "./ConnectWallet";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

interface Props {
  children: ReactNode;
}

export default function ({ children }: Props) {
  const router = useRouter();
  const wallet = useWallet();
  const walletModal = useWalletModal();
  const game = router.pathname.split("/")[1];

  const {
    showWalletModal,
    showConnectModal,
    showCreateCampaignModal,
    setShowCreateCampaignModal,
    getBalance,
    getWalletBalance,
    isVerifyModalOpen,
    closeVerifyModal,
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
    setIsFirstSignUp,
  } = useGlobalContext();

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
      if (
        (wallet?.publicKey && session?.user?.wallet) ||
        session?.user?.email
      ) {
        const pfData = await getProvablyFairData();
        if (pfData) setModalData(pfData);
      }
    })();

    if (wallet?.publicKey && session?.user)
      localStorage.setItem("connectedAccountKey", wallet.publicKey.toBase58());

    if (session?.user?.wallet && (!wallet.connected || !wallet.publicKey))
      handleSignIn(wallet, walletModal);
  }, [wallet.publicKey, session?.user]);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     const storedKey = localStorage.getItem("connectedAccountKey");

  //     if ("solana" in window) {
  //       const provider = window.solana;

  //       //@ts-ignore
  //       if (provider?.publicKey) {
  //         //@ts-ignore
  //         // console.log("checking", provider?.publicKey.toBase58());
  //         //@ts-ignore
  //         if (storedKey && storedKey !== provider.publicKey.toBase58()) {
  //           (async () => {
  //             // console.log("Account changed");
  //             localStorage.removeItem("connectedAccountKey");
  //             await wallet.disconnect();
  //             await signOut();
  //           })();
  //         }
  //       }
  //     }
  //   }, 5000);

  //   return () => clearInterval(interval);
  // }, []);

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
      getWalletBalance();
      getUserDetails();
    }
    setCurrentGame(game);
    setMinGameAmount(
      maxPayouts[selectedCoin.tokenMint as GameTokens][game as GameType] *
        minAmtFactor,
    );
  }, [wallet?.publicKey, session?.user, game, showWalletModal, selectedCoin]);

  useEffect(() => {
    if (session?.user && !showWalletModal) {
      getBalance();
    }
    getGlobalInfo();
  }, [wallet?.publicKey, session?.user, game, showWalletModal]);

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
          wallet={wallet.publicKey?.toBase58()}
        />
      ) : verifyModalData.game === GameType.dice ? (
        <VerifyDiceModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Dice)! }}
          wallet={wallet.publicKey?.toBase58()}
        />
      ) : verifyModalData.game === GameType.dice2 ? (
        <VerifyDice2Modal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Dice2)! }}
          wallet={wallet.publicKey?.toBase58()}
        />
      ) : verifyModalData.game === GameType.limbo ? (
        <VerifyLimboModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ flip: (verifyModalData as Limbo)! }}
          wallet={wallet.publicKey?.toBase58()}
        />
      ) : verifyModalData.game === GameType.wheel ? (
        <VerifyWheelModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Wheel)! }}
          wallet={wallet.publicKey?.toBase58()}
        />
      ) : verifyModalData.game === GameType.keno ? (
        <VerifyKenoModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Keno)! }}
          wallet={wallet.publicKey?.toBase58()}
        />
      ) : verifyModalData.game === GameType.mines ? (
        <VerifyMinesModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Mines)! }}
          wallet={wallet.publicKey?.toBase58()}
        />
      ) : verifyModalData.game === GameType.roulette1 ? (
        <VerifyRoulette1Modal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Roulette1)! }}
          wallet={wallet.publicKey?.toBase58()}
        />
      ) : verifyModalData.game === GameType.roulette2 ? (
        <VerifyRoulette2Modal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Roulette2)! }}
          wallet={wallet.publicKey?.toBase58()}
        />
      ) : verifyModalData.game === GameType.plinko ? (
        <VerifyPlinkoModal
          isOpen={isVerifyModalOpen}
          onClose={closeVerifyModal}
          modalData={{ bet: (verifyModalData as Plinko)! }}
          wallet={wallet.publicKey?.toBase58()}
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
    </>
  );
}
