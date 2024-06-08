import GameStats from "@/models/games/gameStats";
import { GameType } from "@/utils/provably-fair";

async function updateGameStats(
  game: GameType,
  tokenMint: string,
  amount: number,
  incrementWallets: boolean,
) {
  const gameStat = await GameStats.findOne({ game });

  const numOfWallets = incrementWallets ? 1 : 0;

  if (!gameStat) {
    await GameStats.create({
      game,
      volume: { [tokenMint]: amount },
      numOfWallets,
    });
  } else {
    if (!(tokenMint in gameStat.volume))
      await GameStats.updateOne(
        { game },
        {
          $set: {
            [`volume.${tokenMint}`]: amount,
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
            numOfWallets,
          },
        },
      );
  }
}

export default updateGameStats;
