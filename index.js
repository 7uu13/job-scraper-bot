import { Client, IntentsBitField } from "discord.js";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import mongoose from "mongoose";
import "dotenv/config";

puppeteer.use(StealthPlugin());

const baseUrl =
  "https://cv.ee/et/search?limit=1000&offset=0&categories%5B0%5D=INFORMATION_TECHNOLOGY&fuzzy=true&searchId=9ce6c326-392d-423a-a411-c6345eecc086";
const dbURI =  process.env.MONGO_URI;
const channelID = process.env.CHANNEL_ID;
const botToken = process.env.BOT_TOKEN;

// Bot logic
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessagePolls,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.on("ready", (c) => {
  console.log(`Bot ${c.user.tag} is online`);
});

client.login(botToken);

// Mongo connection logic
mongoose
  .connect(dbURI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

const urlSchema = new mongoose.Schema({
  url: { type: String, unique: true },
});

const Url = mongoose.model("Url", urlSchema);

const addUrl = async (href) => {
    const existingUrl = await Url.findOne({ url: href });
  
    if (!existingUrl) {
      try {
        client.channels.cache.get(channelID).send(`**[Uus postitus!](${href})**`);
  
        // Save the new listing to database
        const newUrl = new Url({ url: href });
        await newUrl.save();
        console.log(`Saved ${href}`);
      } catch (e) {
        console.error(`Error saving url to mongo: ${e}`);
      }
    }
  };

// Scraper Logic
export const checkAndSendNewUrls = async () => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  try {
    const url = `${baseUrl}`;

    await page.goto(url, {});

    const lis = await page.$$eval("li, a", (liEl) => {
      return liEl
        .map((a) => a.href)
        .filter((href) => href && href.startsWith("https://cv.ee/et/vacancy"));
    });

    for (let href of lis) {
      addUrl(href);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await browser.close();
  }
};

checkAndSendNewUrls().catch(console.error);
setInterval(checkAndSendNewUrls, 10 * 60 * 1000);
