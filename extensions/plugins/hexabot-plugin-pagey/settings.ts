import { PluginSetting } from '@/plugins/types';
import { SettingType } from '@/setting/schemas/types';

export default [
  {
    label: 'llm_api_key',
    group: 'API Settings',
    type: SettingType.text,
    value: '', // Add your LLM API key here
  },
  {
    label: 'default_response',
    group: 'General Settings',
    type: SettingType.text,
    value:
      "I couldn't process your request. Please try again or provide a valid command.",
  },
] as const satisfies PluginSetting[];
