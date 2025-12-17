import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SYSTEM_CONFIG_PATH = path.join(__dirname, 'systemConfig.json');
const CHAT_CONFIG_PATH = path.join(__dirname, 'chatConfig.json');

export const getSystemConfig = () => {
  try {
    const data = fs.readFileSync(SYSTEM_CONFIG_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading system config:', error);
    return {};
  }
};

export const updateSystemConfig = (newConfig) => {
  try {
    const current = getSystemConfig();
    const updated = { ...current, ...newConfig };
    fs.writeFileSync(SYSTEM_CONFIG_PATH, JSON.stringify(updated, null, 2));
    return updated;
  } catch (error) {
    console.error('Error writing system config:', error);
    throw error;
  }
};

export const getChatConfig = () => {
  try {
    const data = fs.readFileSync(CHAT_CONFIG_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading chat config:', error);
    return [];
  }
};

export const updateChatConfig = (newConfig) => {
  try {
    fs.writeFileSync(CHAT_CONFIG_PATH, JSON.stringify(newConfig, null, 2));
    return newConfig;
  } catch (error) {
    console.error('Error writing chat config:', error);
    throw error;
  }
};
