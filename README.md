# ChatGPT Telegram Bot

This bot uses simple auth via private Telegram group - bot will not work with users that are not members of some private group.

## Prepare

1. Register at https://platform.openai.com/
2. Create new API key: https://platform.openai.com/account/api-keys. Save it somewhere.
3. Create telegram bot via message to https://t.me/BotFather. Save bot token somewhere.
4. Create private group and add bot to it. Save somewhere ID of the group (ex. '-123456789')

## Usage
You can set `TELEGRAM_AUTH_GROUP_ID`, `TELEGRAM_BOT_TOKEN`, `OPENAI_API_KEY` in your env.

Or you can pass it to node directly.

### Shell
```shell
TELEGRAM_AUTH_GROUP_ID='...' TELEGRAM_BOT_TOKEN='...' OPENAI_API_KEY='...' node server.js
```

### Docker
```shell
docker run --rm -d \
 -e TELEGRAM_AUTH_GROUP_ID='...' \
 -e TELEGRAM_BOT_TOKEN='...' \
 -e OPENAI_API_KEY='...'\
 kemmor/chatgpt-telegram-bot:latest
```

## License 
The MIT License (MIT)