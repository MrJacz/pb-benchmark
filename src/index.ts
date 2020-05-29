import { Client, ClientEvents } from "@klasa/core";
import { WebSocketShard, WebSocketManagerEvents } from "@Klasa/ws";
import { TOKEN } from "../config";
import { promises as fsp } from "fs";

const client = new Client({ cache: { messageLifetime: 300000, messageSweepInterval: 60000 } })
    .on(ClientEvents.Debug, console.log)
    .on(ClientEvents.WTF, console.log)
    .on(ClientEvents.EventError, console.log)
    .on(ClientEvents.Error, console.log)
    .on(ClientEvents.Ready, () => console.log("Ready"))
    .on(ClientEvents.ShardReady, (shard: WebSocketShard) => console.log(`${shard.id} is ready`));

client.ws.on(WebSocketManagerEvents.Debug, msg => {
    if (msg.toLowerCase().includes("heartbeat")) return;
    console.log(msg);
});

client.token = TOKEN;

client.connect()
    .then(writeStats)
    .then(() => setInterval(writeStats, 300000))
    .catch(console.error);

async function writeStats(): Promise<void> {
    const memory = process.memoryUsage();
    const rss = Math.round(100 * (memory.rss / 1048576)) / 100;
    const heapTotal = Math.round(100 * (memory.heapTotal / 1048576)) / 100;
    const heapUsed = Math.round(100 * (memory.heapUsed / 1048576)) / 100;

    const date = new Intl.DateTimeFormat("en-AU", {
        year: "numeric", month: "numeric", day: "numeric",
        hour: "numeric", minute: "numeric", second: "numeric"
    }).format(new Date());

    await fsp.appendFile("./stats.csv", `${date},${client.users.size},${client.guilds.size},${client.channels.size},${rss},${heapUsed},${heapTotal}\n`).catch(console.error);
}
