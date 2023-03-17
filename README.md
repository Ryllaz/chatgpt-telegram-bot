# ChatGPT Telegram Bot

This bot uses simple auth via private Telegram group - bot will not work with users that are not members of some private group.

## Prepare

1. Register at https://platform.openai.com/
2. Create new API key: https://platform.openai.com/account/api-keys. Save it somewhere.
3. Create telegram bot via message to https://t.me/BotFather. Save bot token somewhere.
4. Create private group and add bot to it. Save somewhere ID of the group (ex. '-123456789'). You can find group ID in Telegram Web by opening the group and get ID from URL - like https://web.telegram.org/k/#-123456789, where ID is `-123456789`
5. Add trusted users to private group you created.
6. (optional) Create .env file with variables you need.

## Usage
You can set `TELEGRAM_AUTH_GROUP_ID`, `TELEGRAM_BOT_TOKEN`, `OPENAI_API_KEY` in your env.

Or you can pass it to node directly.

### Shell
```shell
TELEGRAM_AUTH_GROUP_ID='...' TELEGRAM_BOT_TOKEN='...' OPENAI_API_KEY='...' node server.js
```

## Full env list

|env name|default|description|
|--------|-----------|-------|
|TELEGRAM_AUTH_GROUP_ID <br> (required)|undefined|id of private telegram group. Ex. '-123456789'|
|TELEGRAM_BOT_TOKEN <br> (required)|undefined|telegram bot token|
|OPENAI_API_KEY <br> (required)|undefined||
|TELEGRAM_BOT_ALIAS|undefined|telegram bot username. Ex. '@your_bot_username'|
|TELEGRAM_ADMIN_NICKNAME|undefined|Ex. '@your_user'|
|MAX_MODEL_TOKENS|100||
|MAX_RESPONSE_TOKENS|500||
|THROTTLE_INTERVAL|20||
|CONVERSATIONS_TIMEOUT|604800000|timeout before conversation will be cleaned, in ms|

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