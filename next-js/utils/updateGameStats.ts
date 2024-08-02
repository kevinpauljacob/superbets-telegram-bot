import { commissionLevels } from "@/context/config";
import { GameStats } from "@/models/games";
import { Campaign, User } from "@/models/referral";
import { GameType } from "@/utils/provably-fair";
import Decimal from "decimal.js";

async function updateGameStats(
  wallet: string | null,
  email: string | null,
  game: GameType,
  tokenMint: string,
  amount: number,
  incrementWallets: boolean,
  feeGenerated: number,
) {
  const gameStat = await GameStats.findOne({ game }).then((res) =>
    res?.toJSON(),
  );

  const numOfWallets = incrementWallets ? 1 : 0;

  if (!gameStat) {
    await GameStats.create({
      game,
      volume: { [tokenMint]: amount },
      feeGenerated: { [tokenMint]: feeGenerated },
      numOfWallets,
    });
  } else {
    if (!gameStat.volume.hasOwnProperty(tokenMint))
      await GameStats.updateOne(
        { game },
        {
          $set: {
            [`volume.${tokenMint}`]: amount,
            [`feeGenerated.${tokenMint}`]: feeGenerated,
          },
          $inc: {
            numOfWallets,
          },
        },
      );
    else
      await GameStats.updateOne(
        { game },
        {
          $inc: {
            [`volume.${tokenMint}`]: amount,
            [`feeGenerated.${tokenMint}`]: feeGenerated,
            numOfWallets,
          },
        },
      );
  }

  const query = wallet ? { wallet } : { email };
  const referralInfo = await User.findOneAndUpdate(
    query,
    {
      $inc: {
        [`volume.${tokenMint}`]: amount,
        [`feeGenerated.${tokenMint}`]: feeGenerated,
      },
    },
    { upsert: true, new: true },
  );

  for (let i = 0; i < referralInfo.referredByChain.length; i++) {
    const _id = referralInfo.referredByChain[i];

    const earnings = Decimal.mul(commissionLevels[i], feeGenerated).toNumber();

    await Campaign.findOneAndUpdate(
      { _id },
      {
        $inc: {
          [`totalEarnings.${tokenMint}`]: earnings,
          [`unclaimedEarnings.${tokenMint}`]: earnings,
        },
      },
    );
  }
}

export default updateGameStats;
