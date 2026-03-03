import assert from 'node:assert';
import {readFileSync} from 'node:fs';

import {parse} from 'toml';

export type ModelsConfig = {
  /** the default model is used for @ping responses. the rest are available in /ask */
  default: string;
  models: ModelConfig[];
  maxHistory: number;
};

export type ModelConfig = {
  name: string;
  desc: string;
  tags: string[];
  maxHistory?: number;
};

export type OpenAIConfig = {
  base_url: string;
  api_key: string;
  system_prompt: string;
};

export type DiscordConfig = {
  token: string;
};

export type ConversationConfig = {
  timeoutMinutes: number;
};

export type Config = {
  discord: DiscordConfig;
  openai: OpenAIConfig;
  models: ModelsConfig;
  conversation?: ConversationConfig;
};

export let config: Config;

export const loadConfig = (path = 'config.toml') => {
  const configFile = readFileSync(path, 'utf8');
  config = parse(configFile);

  assert(config.discord.token, 'missing discord.token');
  assert(config.openai?.base_url, 'missing openai.base_url');

  // ollama doesn't need an api key so any string works
  if (!config.openai.api_key) {
    config.openai.api_key = ':3';
  }

  if (!config.models.maxHistory) {
    config.models.maxHistory = 30;
  }

  for (const model of config.models.models) {
    if (!model.maxHistory) {
      model.maxHistory = config.models.maxHistory || 30;
    }
  }

  return config;
};
