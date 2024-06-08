import GameStats from "@/models/games/gameStats";

async function updateGameStats(
  game: string,
  wallet: string,
  amount: number,
  token: string,
) {
  try {
    const updateQuery: any = {
      $inc: {},
      $addToSet: { wallets: wallet },
    };
    updateQuery.$inc[`volumes.${token}`] = amount;

    await GameStats.updateOne({ game }, updateQuery, { upsert: true });

    console.log(`Successfully updated ${token} volume for game ${game}`);
  } catch (error) {
    console.error("Error updating game stats:", error);
  }
}

export default updateGameStats;