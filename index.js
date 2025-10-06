/* Telegram User Information Bot (Node.js + Telegraf)

Features:

/start -> welcome message + button to share contact

/me -> replies with your Telegram user info in JSON (shown as a code block) and sends the JSON as a file

Handles receiving a Contact (if user shares phone) and returns an updated JSON including phone_number


Setup:

1. Install Node.js (>=14)


2. Create a project folder and inside run: npm init -y npm install telegraf


3. Save this file as telegram_user_info_bot.js


4. Set your bot token in environment variable BOT_TOKEN or replace process.env.BOT_TOKEN with a token string (not recommended)



Run: BOT_TOKEN="<YOUR_TOKEN>" node telegram_user_info_bot.js

Notes:

This bot only returns information Telegram makes available (ctx.from, ctx.chat, contact if shared).

Do NOT hardcode your token in public repositories. */


const { Telegraf, Markup } = require('telegraf') const fs = require('fs')

const botToken = process.env.BOT_TOKEN if (!botToken) { console.error('Error: BOT_TOKEN environment variable not set.') process.exit(1) }

const bot = new Telegraf(botToken)

// Helper to build the JSON for a user + chat function buildUserJson(ctx, extra = {}) { const from = ctx.from || {} const chat = ctx.chat || {} const message = ctx.message || {}

const data = { timestamp: new Date().toISOString(), user: { id: from.id || null, is_bot: from.is_bot || false, first_name: from.first_name || null, last_name: from.last_name || null, username: from.username || null, language_code: from.language_code || null }, chat: { id: chat.id || null, type: chat.type || null, title: chat.title || null }, message: { message_id: message.message_id || null, date: message.date ? new Date(message.date * 1000).toISOString() : null, text: message.text || null }, extras: extra } return data }

// /start command bot.start(async (ctx) => { const name = (ctx.from && (ctx.from.first_name || ctx.from.username)) || 'there' await ctx.reply(Hello ${name}! I can provide your Telegram user info in JSON.) await ctx.reply('Tap the button below to share your contact (phone number) or send /me to get your info now.', Markup.keyboard([ [Markup.button.contactRequest('Share contact')] ]).resize().oneTime()) })

// /help command bot.help((ctx) => ctx.reply('/me - get your user info as JSON\n/start - welcome message and contact button'))

// /me command - show JSON and send as file bot.command('me', async (ctx) => { try { const json = buildUserJson(ctx) const pretty = JSON.stringify(json, null, 2)

// Send as code block (JSON)
await ctx.replyWithMarkdownV2('Here is your info in JSON:\n```json\n' + escapeMarkdownV2(pretty) + '\n```')

// Also send as a .json file
const filename = `user_${json.user.id || 'unknown'}.json`
fs.writeFileSync(filename, pretty)
await ctx.replyWithDocument({ source: fs.createReadStream(filename), filename })

// cleanup local file
fs.unlinkSync(filename)

} catch (err) { console.error(err) await ctx.reply('Sorry, something went wrong while preparing your JSON.') } })

// Handle incoming contact (if user shared phone) bot.on('contact', async (ctx) => { try { const contact = ctx.message.contact || {} // Build JSON including the shared contact const json = buildUserJson(ctx, { shared_contact: contact }) const pretty = JSON.stringify(json, null, 2)

await ctx.reply('Thanks for sharing your contact. Here is your combined info:')
await ctx.replyWithMarkdownV2('```json\n' + escapeMarkdownV2(pretty) + '\n```')

const filename = `user_${json.user.id || 'unknown'}_with_contact.json`
fs.writeFileSync(filename, pretty)
await ctx.replyWithDocument({ source: fs.createReadStream(filename), filename })
fs.unlinkSync(filename)

} catch (err) { console.error(err) await ctx.reply('Error handling contact.') } })

// Fallback: if user sends any text, offer /me bot.on('text', (ctx) => ctx.reply('Send /me to receive your Telegram info in JSON, or press Share contact to include your phone.'))

// Utility: escape MarkdownV2 special characters for code blocks function escapeMarkdownV2(text) { // From Telegram docs: _ * [ ] ( ) ~  > # + - = | { } . ! return text.replace(/[\\_*\[\]()~>#+-=|{}.!]/g, (m) => '\' + m) }

// Start polling bot.launch().then(() => console.log('Bot started.')).catch(err => console.error('Bot launch failed:', err))

// Graceful stop process.once('SIGINT', () => bot.stop('SIGINT')) process.once('SIGTERM', () => bot.stop('SIGTERM'))

  
