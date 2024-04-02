import { minGameAmount } from "@/context/gameTransactions";

export default function GameFooterInfo({multiplier,amount,chance}:{multiplier:number;amount:number;chance:number}) {
    return(
        <div className="flex flex-col sm:flex-row w-full justify-between">
              <div className="flex flex-col w-full">
                <span className="text-[#F0F0F0] text-xs mb-1">Multiplier</span>
                <span className="bg-[#202329] rounded-md px-5 py-2">
                  {multiplier}x
                </span>
              </div>
              {/* <div className="flex justify-between">
              <span className="text-[#F0F0F0] text-opacity-75">Tax</span>
              <span className="text-[#F0F0F0] text-opacity-75">
                {ROLL_TAX * 100}%
              </span>
            </div> */}
              <div className="flex flex-col w-full sm:mx-8 my-3 sm:my-0">
                <span className="text-[#F0F0F0] text-xs mb-1">
                  Winning Amount
                </span>
                <span className="bg-[#202329] rounded-md px-5 py-2">
                  {minGameAmount} $SOL
                </span>
              </div>
              <div className="flex flex-col w-full">
                <span className="text-[#F0F0F0] text-xs mb-1">Chance</span>
                <span className="bg-[#202329] rounded-md px-5 py-2">
                  {chance}%
                </span>
              </div>
              {!user ||
                (user.deposit[0].amount < 0.1 && (
                  <div className="mb-5 w-full rounded-lg bg-[#C20FC5] bg-opacity-10 px-3 pb-2 pt-4 text-white md:px-6">
                    <div className="-full mb-3 text-center font-changa font-medium text-[#F0F0F0] text-opacity-75">
                      Please deposit funds to start playing. View{" "}
                      <Link href="/balance">
                        <u>WALLET</u>
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
    )
}