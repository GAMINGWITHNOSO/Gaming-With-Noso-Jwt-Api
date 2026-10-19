const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN environment variable সেট করা নেই');
}

const bot = new TelegramBot(BOT_TOKEN, {
  polling: true
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    'হ্যালো! একটি সাধারণ JSON ফাইল পাঠাও।'
  );
});

bot.on('document', async (msg) => {
  const chatId = msg.chat.id;
  const doc = msg.document;

  if (!doc.file_name?.toLowerCase().endsWith('.json')) {
    return bot.sendMessage(
      chatId,
      'দয়া করে .json ফাইল পাঠাও।'
    );
  }

  let inputPath;
  let outputPath;

  try {
    const fileLink = await bot.getFileLink(doc.file_id);
    const response = await fetch(fileLink);

    if (!response.ok) {
      throw new Error('ফাইল ডাউনলোড করা যায়নি');
    }

    const input = await response.json();

    if (!Array.isArray(input)) {
      throw new Error('JSON-এর মধ্যে একটি array থাকতে হবে');
    }

    // নিরাপদ সাধারণ JSON প্রসেসিং
    const results = input.map((item, index) => ({
      index: index + 1,
      data: item
    }));

    outputPath = path.join(
      __dirname,
      `result-${chatId}.json`
    );

    fs.writeFileSync(
      outputPath,
      JSON.stringify(results, null, 2),
      'utf8'
    );

    await bot.sendDocument(chatId, outputPath, {
      caption: 'তোমার JSON ফলাফল তৈরি হয়েছে।'
    });
  } catch (error) {
    await bot.sendMessage(
      chatId,
      `JSON প্রসেস করতে সমস্যা হয়েছে: ${error.message}`
    );
  } finally {
    if (outputPath && fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
  }
});

console.log('Bot started');
