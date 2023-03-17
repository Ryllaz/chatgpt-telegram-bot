import { ChatGPTAPI } from "chatgpt";
import TelegramBot from "node-telegram-bot-api";
import * as dotenv from "dotenv";
dotenv.config();

const authorizedGroupId = process.env.TELEGRAM_AUTH_GROUP_ID;
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramBotAlias = process.env.TELEGRAM_BOT_ALIAS;
const telegramAdmin = process.env.TELEGRAM_ADMIN_NICKNAME;
const openAiApiKey = process.env.OPENAI_API_KEY;

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

const api = new ChatGPTAPI({
  apiKey: openAiApiKey,
  maxModelTokens,
  maxResponseTokens,
});

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
    // send init message and typing status
    let waitMsg = await bot.sendMessage(chatId, "......");
    bot.sendChatAction(chatId, "typing");

    let throttle = 0;

    // create request params
    const chatgptSendingParams = {
      timeoutMs: 5 * 60 * 1000,
      onProgress: async (partialResponse) => {
        throttle++;

        // throttle every ${throttleInterval} progress letters to prevent overflow telegram API
        if (throttle % throttleInterval === 0 && waitMsg.text !== partialResponse.text) {
          // send typing and edit init message with partial response
          bot.sendChatAction(chatId, "typing");
          waitMsg = await bot.editMessageText(partialResponse.text, {
            chat_id: chatId,
            message_id: waitMsg.message_id,
          });
          throttle = 0;
        }
      },
    };

    // add conversations context if exists to chatgpt request params
    if (conversations[chatId]) {
      chatgptSendingParams.parentMessageId =
        conversations[chatId].lastMessageId;
    }

    // send request
    const response = await api.sendMessage(msg.text, chatgptSendingParams);

    // save conversations context
    conversations[chatId] = {
      lastMessageId: response.conversationId,
      lastMessageTime: new Date().getTime(),
    };

    console.log(response);

    // final message update
    if (waitMsg.text !== response.text) {
      await bot.editMessageText(response.text, {
        chat_id: chatId,
        message_id: waitMsg.message_id,
      });
    }
  } catch (e) {
    console.log(e);
  }
});
