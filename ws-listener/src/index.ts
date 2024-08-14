import { getAssociatedTokenAddress } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import dotenv from "dotenv";
import WebSocket from "ws";
import { User } from "./models";
import connectDatabase from "./utils/database";
import processTransaction, {
  Deposit,
  Wallets,
} from "./utils/processTransaction";

dotenv.config();
const apiKey = process.env.HELIUS_API_KEY;

export const wallets: Wallets = {};
export const deposits: { [key: string]: Deposit } = {};

// Initialize WebSocket connection to Helius
function initializeWebSocket() {
  let ws: WebSocket;
  let statusCheckInterval: any;
  let pingInterval: any;
  let pongTimeout: any;

  console.log("Initializing WebSocket...");
  ws = new WebSocket(`wss://atlas-mainnet.helius-rpc.com/?api-key=${apiKey}`);

  async function sendRequest() {
    await connectDatabase();

    const users = await User.find({
      wallet: { $exists: true },
      iv: { $exists: true },
    });
    console.log("Users found:", users.length);

    const userWallets: string[] = [];
    const usdc = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

    for (const user of users) {
      try {
        const wallet = user.wallet;
        const ata = await getAssociatedTokenAddress(
          usdc,
          new PublicKey(wallet)
        );
        const usdcWallet = ata.toBase58();
        userWallets.push(wallet, usdcWallet);

        wallets[wallet] = {
          [usdc.toBase58()]: usdcWallet,
        };
      } catch (e) {
        console.error(e);
      }
    }

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

    const changeStream = User.watch();

    changeStream.on("change", async (data) => {
      if (data.operationType !== "insert") return;
      
      console.log("New user added:", data);

      const wallet = data.fullDocument.wallet;
      const ata = await getAssociatedTokenAddress(usdc, new PublicKey(wallet));
      const usdcWallet = ata.toBase58();
      userWallets.push(wallet, usdcWallet);

      wallets[wallet] = {
        [usdc.toBase58()]: usdcWallet,
      };

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
    });
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
        await processTransaction(messageObj?.params?.result);
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
