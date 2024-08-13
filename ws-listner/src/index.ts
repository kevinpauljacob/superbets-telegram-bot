import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDatabase from "./utils/database";
import WebSocket from "ws";
import fs from "fs";
import { User } from "./models";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import processTransaction, {
  Deposit,
  Wallets,
} from "./utils/processTransaction";
import depositFunds from "./utils/depositFunds";

dotenv.config();
const PORT = process.env.PORT || 3001;
const apiKey = process.env.HELIUS_API_KEY;

export const wallets: Wallets = {};
export const deposits: { [key: string]: Deposit } = {};

// Initialize WebSocket connection to Helius
function initializeWebSocket() {
  let lastMessageDate = new Date();
  let ws: WebSocket;
  let statusCheckInterval: any;
  let pingInterval: any;
  let pongTimeout: any;

  console.log("Initializing WebSocket...", apiKey);
  ws = new WebSocket(`wss://atlas-mainnet.helius-rpc.com/?api-key=${apiKey}`);

  async function sendRequest() {
    await connectDatabase();

    const users = await User.find({});
    const userWallets: string[] = [];
    const usdc = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

    for (const user of users) {
      try {
        const wallet = user.wallet;
        const usdcWallet = await getAssociatedTokenAddress(
          usdc,
          new PublicKey(wallet)
        );
        userWallets.push(wallet, usdcWallet.toString());

        wallets[wallet] = {
          EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: usdcWallet.toString(),
        };
      } catch (e) {
        console.error(e);
      }
    }

    console.log(userWallets, wallets);

    if (userWallets.length > 0) {
      const request = {
        jsonrpc: "2.0",
        id: 420,
        method: "transactionSubscribe",
        params: [
          {
            //Meteora Pools
            accountInclude: userWallets,
          },
          {
            vote: false,
            failed: false,
            commitment: "finalized",
            encoding: "jsonParsed",
            transactionDetails: "full",
            maxSupportedTransactionVersion: 0,
          },
        ],
      };
      ws.send(JSON.stringify(request));
    }
  }

  // Send a ping every 30 seconds to keep the connection alive
  function startPing() {
    pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
        console.log("Ping sent");

        pongTimeout = setTimeout(() => {
          console.log("Pong not received in time, closing connection");
          ws.terminate();
        }, 5000);
      }
    }, 30000);
  }

  ws.on("open", function open() {
    console.log("WebSocket is open");
    sendRequest();
    startPing();
  });

  ws.on("message", async function incoming(data) {
    const messageStr = data.toString("utf8");
    try {
      const messageObj = JSON.parse(messageStr);

      if (messageObj?.params?.result?.transaction) {
        lastMessageDate = new Date();
        let trans = messageObj?.params?.result?.transaction;
        console.log(
          "Message is: ",
          trans.transaction,
          trans.meta.preTokenBalances,
          trans.meta.postTokenBalances
        );
        await processTransaction(messageObj?.params?.result);
        fs.writeFileSync("transfer.json", JSON.stringify(messageObj));
      } else {
        console.log("Received message:", messageObj);
        if (messageObj?.params?.error) {
          ws.terminate();
        }
      }
    } catch (e) {
      console.log("Failed to parse JSON:", e);
    }
  });

  ws.on("pong", function pong() {
    console.log("Pong received");
    clearTimeout(pongTimeout);
  });

  ws.on("error", function error(err) {
    console.log("WebSocket error:", err);
  });

  // Cleanup and restart the WebSocket connection if it's closed
  ws.on("close", function close() {
    console.log("WebSocket is closed, attempting to restart...");
    clearInterval(statusCheckInterval);
    clearInterval(pingInterval);
    clearTimeout(pongTimeout);
    setTimeout(initializeWebSocket, 5000);
  });
}

initializeWebSocket();

const handleQueuedDeposits = () => {
  console.log(deposits);
  Object.keys(deposits).forEach((deposit) => depositFunds(deposits[deposit]));

  // Continuously check for new deposits
  setTimeout(handleQueuedDeposits, 10000);
};

handleQueuedDeposits();
