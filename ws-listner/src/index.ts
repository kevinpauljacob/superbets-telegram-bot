import mongoose from "mongoose";
import dotenv from "dotenv";
// import connectDatabase from "./utils/database";
import WebSocket from "ws";

dotenv.config();
const PORT = process.env.PORT || 3001;
const apiKey = process.env.HELIUS_API_KEY;

// Initialize WebSocket connection to Helius
function initializeWebSocket() {
  let lastMessageDate = new Date();
  let ws: WebSocket;
  let statusCheckInterval: any;
  let pingInterval: any;
  let pongTimeout: any;

  console.log("Initializing WebSocket...", apiKey);
  ws = new WebSocket(`wss://atlas-mainnet.helius-rpc.com/?api-key=${apiKey}`);

  function sendRequest() {
    const request = {
      jsonrpc: "2.0",
      id: 420,
      method: "transactionSubscribe",
      params: [
        {
          //Meteora Pools
          accountInclude: ["2zbhu6RBWzWddZHtWtGJg3JwNrbpZurTyx5pP8dU5fxD"],
        },
        {
          vote: false,
          failed: true,
          commitment: "processed",
          encoding: "jsonParsed",
          transactionDetails: "full",
          maxSupportedTransactionVersion: 0,
        },
      ],
    };
    ws.send(JSON.stringify(request));
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

  // Check if we have received any messages in the last 20 seconds
  function statusCheck() {
    statusCheckInterval = setInterval(() => {
      if (lastMessageDate.getTime() < Date.now() - 20000) {
        console.log(
          "No messages received in the last 20 seconds, closing connection"
        );
        ws.terminate();
      }
    }, 20000);
  }

  ws.on("open", function open() {
    console.log("WebSocket is open");
    sendRequest();
    startPing();
    statusCheck();
  });

  ws.on("message", async function incoming(data) {
    const messageStr = data.toString("utf8");
    try {
      const messageObj = JSON.parse(messageStr);

      if (messageObj?.params?.result?.transaction) {
        lastMessageDate = new Date();
        // await callback(messageObj.params.result);
        let trans = messageObj?.params?.result?.transaction;
        console.log(
          "Message is: ",
          trans.transaction,
          trans.meta.preTokenBalances,
          trans.meta.postTokenBalances
        );
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
