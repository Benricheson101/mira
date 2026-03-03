import {ChannelType, type TextChannel} from 'discord.js';

import {AIService} from './ai';
import {DiscordClient} from './client';
import {loadConfig} from './config';
import {ConversationManager} from './convo';

const config = loadConfig('./config.toml');
const discord = new DiscordClient();
const cm = new ConversationManager();
const ai = new AIService();

discord.on('clientReady', () => {
  console.log(`Logged in as ${discord.user?.tag}`);
});

// discord.on('interactionCreate', i => {});

discord.on('messageCreate', async msg => {
  if (!msg.guild || msg.channel.type === ChannelType.DM || msg.author.bot) {
    return;
  }

  if (msg.guildId !== '579466138992508928') {
    return;
  }

  const isPing =
    msg.content.startsWith(`<@!${discord.user!.id}>`) ||
    msg.content.startsWith(`<@${discord.user!.id}>`);
  const isInConvo =
    !!msg.reference?.messageId && cm.messages.has(msg.reference.messageId);
  if (!isPing && !isInConvo) {
    return;
  }

  const content = isPing
    ? msg.content.replace(/^<@!?\d{18,20}>\s*/, '')
    : msg.content;
  if (!content) {
    return;
  }

  if (msg.author.id !== discord.user!.id) {
    cm.addMessage({
      content: `[Username: "${msg.author.username}", Nickname: "${msg.member?.nickname || msg.author.displayName || msg.author.username}"]: ${content}`,
      messageID: msg.id,
      parent: msg.reference?.messageId,
      author: msg.author.username,
      authorID: msg.author.id,
      role: 'user',
      threadID: msg.channel.isThread() ? msg.channel.id : undefined,
      startOfThread: isPing && !msg.reference,
    });
  }
  const convo = cm.getConversation(msg.id);
  console.log(convo);

  const response = await ai.generateText({
    messages: convo,
    context: {
      botUsername: discord.user!.username,
      serverName: msg.guild!.name,
      channelName: msg.channel.name,
      channelDescription: (msg.channel as TextChannel).topic || '',
    },
  });

  const sent = await msg.reply({
    content: response.text,
    allowedMentions: {},
  });

  cm.addMessage({
    content: response.text,
    author: sent.author.username,
    authorID: sent.author.id,
    messageID: sent.id,
    role: 'assistant',
    startOfThread: false,
    parent: msg.id,
    threadID: msg.channel.isThread() ? msg.channel.id : undefined,
  });
});

discord.on('messageDelete', msg => {
  cm.deleteMessage(msg.id);
});

discord.login(config.discord.token);
