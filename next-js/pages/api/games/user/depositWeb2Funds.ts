import connectDatabase from "../../../../utils/database";
import { User } from "../../../../models/games";

export const depositWeb2Funds = async () => {
  try {
    await connectDatabase();
    const users = await User.find({ isWeb2User: true });
    const airdrop = 100;

    for (const user of users) {
      const depositIndex = user.deposit.findIndex(
        (d: any) => d.tokenMint === "WEB2",
      );
      if (depositIndex !== -1) {
        // Update the existing deposit entry
        user.deposit[depositIndex].amount += airdrop;
      } else {
        user.deposit.push({ amount: airdrop, tokenMint: "WEB2" });
      }
      await user.save();
      console.log(`Deposited ${airdrop} web2 funds to ${user.wallet}`);
    }

    return { message: "Daily web2 funds deposit completed successfully." };
  } catch (error) {
    console.error("Daily web2 funds deposit failed:", error);
    throw new Error("Daily web2 funds deposit failed.");
  }
};
