import React, { useEffect, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import {
  connection,
  deposit,
  obfuscatePubKey,
  translator,
  truncateNumber,
  withdraw,
} from "@/context/transactions";
import Loader from "./Loader";
import { useGlobalContext } from "../GlobalContext";
import { IoCloseOutline, IoWalletOutline } from "react-icons/io5";
import Image from "next/image";
import { timestampParser } from "@/utils/timestampParser";
import { useRouter } from "next/router";
import { AdaptiveModal, AdaptiveModalContent } from "../AdaptiveModal";
import { SPL_TOKENS, spl_token } from "@/context/config";
import { Connection, ParsedAccountData, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { errorCustom, successCustom } from "../toasts/ToastGroup";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { handleGoogle } from "../ConnectWallet";
import { Google, Wallet } from "iconsax-react";
import { signOut, useSession } from "next-auth/react";
import { MdEdit } from "react-icons/md";
import { FaCheck } from "react-icons/fa6";

export default function ConnectModal() {
  const { update } = useSession();
  const router = useRouter();

  const [editUser, setEditUser] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const { c: campaignId } = router.query;

  const {
    showConnectModal,
    setShowConnectModal,
    language,
    userTokens,
    setUserTokens,
    getBalance,
    coinData,
    session,
    status,
  } = useGlobalContext();

  const [loading, setLoading] = useState<boolean>(false);

  const onSubmit = async (data: any) => {
    if (editUser && data?.name) {
      try {
        const res = await fetch("/api/games/user/update", {
          method: "POST",
          body: JSON.stringify({
            email: session?.user?.email,
            name: data.name,
          }),
          headers: { "Content-Type": "application/json" },
        });

        const { success, message } = await res.json();

        if (success) {
          await update({ name: data.name });
          successCustom(message);
        } else throw new Error(translator(message, language));
      } catch (e: any) {
        console.error("Error updating user name:", e);
        errorCustom(translator(e?.message ?? "", language));
      }
      setEditUser(false);
    } else setEditUser(true);
  };

  return (
    <AdaptiveModal
      open={showConnectModal}
      onOpenChange={() => setShowConnectModal(false)}
    >
      <AdaptiveModalContent className="bg-[#121418] sm:overflow-y-auto min-h-[0dvh] max-h-[80dvh] w-full pb-6">
        <div className="flex flex-1 px-6 sm:p-0 justify-center overflow-y-auto nobar">
          <div className="flex flex-col w-full">
            {/* header and logo  */}
            <div className="flex justify-center sm:justify-start items-center w-full mb-7 gap-2 mt-2">
              {/* <Image
                src={"/assets/wallet_color.png"}
                alt=""
                width={24}
                height={24}
              /> */}
              <span className=" text-[1.5rem] leading-5 mt-1 font-changa font-black text-[#e7e7e7]">
                {translator("Connect", language)}
              </span>
            </div>

            {session?.user && (
              // <span className="w-full mt-4 text-center text-lg font-semibold text-staking-secondary">
              //   OR
              // </span>

              <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
                <div className="flex flex-1 items-start justify-between mb-5">
                  <div className="flex items-start gap-2">
                    {session?.user?.image ? (
                      <Image
                        src={session?.user?.image ?? ""}
                        width={60}
                        height={60}
                        alt={"User"}
                        className="rounded-full overflow-hidden"
                      />
                    ) : (
                      <div className="bg-[#252740] rounded-full p-2.5 w-16 h-16" />
                    )}

                    <div className="flex flex-col items-start">
                      {editUser ? (
                        <input
                          {...register("name", {
                            required: "Name is required",
                            minLength: {
                              value: 2,
                              message: "Name must be at least 2 characters",
                            },
                            maxLength: {
                              value: 50,
                              message: "Name must not exceed 50 characters",
                            },
                          })}
                          className="text-white font-semibold text-opacity-75 bg-transparent border-b border-white border-opacity-50 focus:outline-none"
                          defaultValue={session?.user?.name ?? "Player"}
                        />
                      ) : (
                        <span
                          className="text-white font-semibold text-opacity-75"
                          onClick={() => setEditUser(true)}
                        >
                          {session?.user?.name ?? "Player"}
                        </span>
                      )}
                      <span
                        className={`${
                          errors?.name?.message
                            ? "opacity-100 mt-1.5"
                            : "opacity-0 h-0"
                        } flex items-center gap-1 text-xs text-[#D92828]`}
                      >
                        {errors?.name?.message?.toString() ?? "NONE"}
                      </span>

                      <span className="text-white text-sm font-medium text-opacity-50">
                        {session?.user?.email
                          ? session.user.email
                          : "player@superbets.com"}
                      </span>
                    </div>
                  </div>
                  <button type={"submit"} className="group">
                    {editUser ? (
                      <FaCheck className="text-white text-xl text-opacity-50 group-hover:text-opacity-90 cursor-pointer disabled:opacity-50 transition-all hover:duration-75" />
                    ) : (
                      <MdEdit className="text-white text-xl text-opacity-50 group-hover:text-opacity-90 cursor-pointer disabled:opacity-50 transition-all hover:duration-75" />
                    )}
                  </button>
                </div>
              </form>
            )}

            <button
              onClick={async (e) => {
                try {
                  if (session?.user?.email) {
                    e.preventDefault();
                    await signOut();
                  } else {
                    handleGoogle();
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
              className={`flex items-center justify-center text-white text-opacity-50 hover:text-opacity-90 focus:text-opacity-90 bg-white/5 hover:bg-[#47484A] focus:bg-[#5F4DFF] transition-all font-medium text-sm p-3 rounded-[0.625rem] gap-1`}
            >
              {session?.user?.email ? (
                `Disconnect Google`
              ) : (
                <>
                  <Google />
                  <span className="text-sm font-medium tracking-wider font-sans">
                    {translator("Connect with Google", language)}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </AdaptiveModalContent>
    </AdaptiveModal>
  );
}
