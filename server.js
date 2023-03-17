import { Configuration, OpenAIApi } from "openai";
import TelegramBot from "node-telegram-bot-api";
import * as dotenv from "dotenv";
dotenv.config();

const authorizedGroupId = process.env.TELEGRAM_AUTH_GROUP_ID;
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramBotAlias = process.env.TELEGRAM_BOT_ALIAS;
const telegramAdmin = process.env.TELEGRAM_ADMIN_NICKNAME;
const openAiApiKey = process.env.OPENAI_API_KEY;
const model = process.env.MODEL_ID;
const modelType = process.env.MODEL_TYPE;

const maxModelTokens = process.env.MAX_MODEL_TOKENS || 1000;
const maxResponseTokens = process.env.MAX_RESPONSE_TOKENS || 1000;
const throttleInterval = process.env.THROTTLE_INTERVAL || 20;
const conversationsTimeout =
  process.env.CONVERSATIONS_TIMEOUT || 7 * 24 * 60 * 60 * 1000;

const conversations = {};

// check conversations context every 5 mins
// and clean too old records according to conversationsTimeout
setInterval(() => {
  for (let chatId in conversations) {
    if (
      new Date().getTime() - conversationsTimeout >
      conversations[chatId]?.lastMessageTime
    ) {
      delete conversations[chatId];
    }
  }
}, 5 * 60 * 1000);

const configuration = new Configuration({
  apiKey: openAiApiKey,
});

const api = new OpenAIApi(configuration);

// Create a bot
const bot = new TelegramBot(telegramBotToken, { polling: true });

// Listen for all messages.
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  // decline all users that not members of auth group
  const user = await bot.getChatMember(authorizedGroupId, msg?.from?.id);
  if (user.status === "left") {
    await bot.sendMessage(
      msg.chat.id,
      `You are not authorized for using this bot. Contact to ${telegramAdmin} for it.`
    );
    return;
  }

  // start command
  if (msg?.text?.match(/^\/start\s*$/)) {
    await bot.sendMessage(
      msg.chat.id,
      "Welcome to ChatGPT bot! Send me any message in any language!",
      {
        reply_markup: {
          keyboard: [["Reset conversation"]],
        },
      }
    );
    return;
  }

  // Reset conversation command
  if (msg?.text?.match(/^Reset conversation$/)) {
    delete conversations[chatId];
    await bot.sendMessage(msg.chat.id, "Your conversation has been reset.");
    return;
  }

  // prevent handling all messages from group chats
  if (msg.chat.type === "group") {
    if (!msg?.text?.match(`^${telegramBotAlias} (.*)$`)) {
      return;
    }
  }

  try {
    let isTyping = true;

    // send typing status
    bot.sendChatAction(chatId, "typing");

    // repeat typing status until response from chatgpt
    setInterval(() => {
      if (isTyping) bot.sendChatAction(chatId, "typing");
    }, 4500);

    let response;

    // send request
    switch (modelType) {
      case 'chat': {
        response = await api.createChatCompletion({
          model: model,
          messages: [{role: 'user', content: msg.text}],
          max_tokens: maxModelTokens,
        });
        isTyping = false;
      } break;

      default:
      case 'competition': {
        response = await api.createCompletion({
          model: model,
          prompt: msg.text,
          max_tokens: maxModelTokens,
        });
        isTyping = false;
      } break;
    }

    // save conversations context
    conversations[chatId] = {
      lastMessageId: response.data.id,
      lastMessageTime: new Date().getTime(),
    };

    // extract response message text
    const text = response.data?.choices?.text || response.data?.choices[0]?.message?.content;

    // send response
    if (text) await bot.sendMessage(chatId, text);
  } catch (e) {
    console.log(e);
  }
});
