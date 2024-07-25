import { depositWeb2Funds } from "./depositWeb2Funds";
const { CronJob } = require("cron");

const startScheduler = () => {
  new CronJob(
    '*/1 * * * *',
    async () => {
      try {
        await depositWeb2Funds();
        console.log("WEB2 funds deposit completed successfully.");
      } catch (error) {
        console.error("Error during WEB2 funds deposit:", error);
      }
    },
    null,
    true,
    "America/Los_Angeles",
  );
};

export default startScheduler;
