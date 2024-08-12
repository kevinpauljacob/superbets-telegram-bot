import GameUser from "./models/gameUser";
import connectDatabase from "./utils/database";

const main = async () => {
  const connection = await connectDatabase();

  try {
    const result = await GameUser.updateMany(
      {
        "deposit.tokenMint": "SUPER",
      },
      {
        $set: { "deposit.$.amount": 100, isUSDCClaimed: false },
        $unset: { claimCount: "" },
      }
    );
    console.log(result);
  } catch (error: any) {
    console.log(error.message);
  }

  connection.disconnect();
};

main();
