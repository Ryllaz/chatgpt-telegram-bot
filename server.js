import { ChatGPTAPI } from "chatgpt";
import TelegramBot from "node-telegram-bot-api";

const authorizedGroupId = process.env.TELEGRAM_AUTH_GROUP_ID;
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const openAiApiKey = process.env.OPENAI_API_KEY;

const conversations = {};

const api = new ChatGPTAPI({
  apiKey: openAiApiKey,
});

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(telegramToken, { polling: true });

// Listen for any kind of message. There are different kinds of
// messages.
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  const user = await bot.getChatMember(authorizedGroupId, msg?.from?.id);
  if (user.status === 'left') {
    await bot.sendMessage(msg.chat.id, "You are not authorized for using this bot. Contact to @kemmor for it.");
    return;
  }

  if (msg?.text?.match(/^\/start\s*$/)) {
    await bot.sendMessage(
      msg.chat.id,
      "Welcome to ChatGPT bot! Send me any message in any language!",
      {
        reply_markup: {
          keyboard: [["/reset"]],
        },
      }
    );
    return;
  }

  if (msg?.text?.match(/^\/reset\s*$/)) {
    delete conversations[chatId];
    await bot.sendMessage(msg.chat.id, "Your conversation has been reset.");
    return;
  }

  try {
    let waitMsg = await bot.sendMessage(chatId, "......");

    let throttle = 0;

    const chatgptSendingParams = {
      timeoutMs: 5 * 60 * 1000,
      onProgress: async (partialResponse) => {
        throttle++;

        if (throttle % 100 === 0 && waitMsg.text !== partialResponse.text) {
          waitMsg = await bot.editMessageText(partialResponse.text, {
            chat_id: chatId,
            message_id: waitMsg.message_id,
          });
        }
      },
    };

    if (conversations[chatId]) {
      chatgptSendingParams.conversationId =
        conversations[chatId].conversationId;

      chatgptSendingParams.parentMessageId =
        conversations[chatId].parentMessageId;
    }

    const response = await api.sendMessage(msg.text, chatgptSendingParams);

    conversations[chatId] = {
      conversationId: response.conversationId,
      parentMessageId: response.id,
    };

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
