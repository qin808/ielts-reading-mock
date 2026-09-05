// 统一的 localStorage 封装，使用 ielts_mock_ 前缀隔离

const PREFIX = 'ielts_mock_';

export const storage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(PREFIX + key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(PREFIX + key, value);
    } catch {
      // ignore quota exceeded
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // ignore
    }
  },
};

export const STORAGE_KEYS = {
  STATE: 'state_v1',
  OPENAI_KEY: 'openai_key',
  MODEL: 'openai_model',
  API_BASE_URL: 'openai_api_base_url',
} as const;
