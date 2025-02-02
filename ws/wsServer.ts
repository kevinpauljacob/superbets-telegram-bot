import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import connectDatabase from "./utils/database";
import { WebSocket } from "ws";
import { IDL as fomoIDL } from "./utils/fomoIDL";
import { IDL as fomoJupIDL } from "./utils/fomoJupIDL";
import dotenv from "dotenv";
import { recentBuyers, user } from "./models";
import { pointTiers } from "./utils/helper";
dotenv.config({ path: "./.env.local" });

const port = parseInt(process.env.PORT || "4000");

const connection = new Connection(process.env.BACKEND_RPC!, "confirmed");
const devWalletKey = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(process.env.DEV_KEYPAIR!))
);
const fomoProgramId = new PublicKey(
  "FoMotN3mJB5QVorWrgF7gHRoguUYRr2dApDondesrYe"
);
const fomoJupProgramId = new PublicKey(
  "3ZVntpabyX5dh71gHeyEHcqUhV7Gu3irUT25tm8eQPnJ"
);

const server = new WebSocket.Server({ port });

const fomoChannelAuthKey = process.env.FOMO_CHANNEL_AUTH_KEY!;

const channels: { [key: string]: string } = {
  "fomo-casino_games-channel": fomoChannelAuthKey,
};

const channelClients: { [key: string]: Set<WebSocket> } = {};

const handleFomoBuyEvent = async (
  programId: PublicKey,
  IDL: any,
  dbName: string
) => {
  const provider = new AnchorProvider(connection, new Wallet(devWalletKey), {
    commitment: "processed",
  });
  const program = new Program(IDL, programId, provider);

  program.addEventListener("BuyTicketEvent", async (event, _, signature) => {
    await connectDatabase(dbName);

    const { buyer, gameId, quantity, totalAmount } = event;

    const wallet = (buyer as PublicKey).toBase58();
    const userData = await user.findOneAndUpdate(
      { wallet },
      {},
      { upsert: true, new: true }
    );

    await recentBuyers.create({
      buyer: wallet,
      gameId,
      numOfTickets: (quantity as any).toNumber(),
      totalAmount,
      txnSignature: signature,
    });

    const numOfGamesPlayed = await recentBuyers
      .distinct("gameId", { buyer: wallet })
      .then((gameIds) => gameIds.length);

    const pointsGained =
      1.2 * numOfGamesPlayed +
      1.4 * (totalAmount as number) * userData.multiplier;

    await user.findOneAndUpdate(
      {
        wallet,
      },
      {
        $inc: {
          points: pointsGained,
        },
      }
    );
  });

  console.log("Fomo buyTicket event listener started");
};

const handleAPIClient = (socket: WebSocket, message: any) => {
  const { channel, authKey, payload } = message;

  if (channels[channel] === authKey) {
    socket.send(JSON.stringify({ success: true }));

    // Forward payload to all clients on channel
    channelClients[channel].forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ channel, payload }));
      }
    });
  } else {
    socket.send(JSON.stringify({ success: false }));
  }
};

const handleListenerClient = (socket: WebSocket, message: any) => {
  const { channel } = message;

  if (channels[channel]) {
    // Add the socket to the channel's clients
    if (!channelClients[channel]) {
      channelClients[channel] = new Set();
    }
    channelClients[channel].add(socket);

    socket.send(
      JSON.stringify({
        success: true,
        clientsCount: channelClients[channel].size,
      })
    );
  } else {
    socket.send(JSON.stringify({ success: false }));
  }

  socket.on("close", () => {
    // Remove the disconnected client from all channels
    Object.values(channelClients).forEach((clients) => {
      clients.delete(socket);
    });
  });
};

try {
  handleFomoBuyEvent(fomoProgramId, fomoIDL, "exitscam");
  handleFomoBuyEvent(fomoJupProgramId, fomoJupIDL, "jupexit");

  server.on("connection", (socket: WebSocket) => {
    socket.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.clientType === "api-client") {
          handleAPIClient(socket, message);
        } else if (message.clientType === "listener-client") {
          handleListenerClient(socket, message);
        }

        // Handle other types of clients or messages here if needed
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });
  });

  console.log("WebSocket server is running on port :", port);
} catch (error) {
  console.log(error);
}
