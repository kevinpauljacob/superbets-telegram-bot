import GameStats from "@/models/games/gameStats";
import { GameType } from "@/utils/provably-fair";

async function updateGameStats(
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
}

export default updateGameStats;
