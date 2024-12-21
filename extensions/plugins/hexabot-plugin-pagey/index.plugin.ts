/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Block } from '@/chat/schemas/block.schema';
import { Context } from '@/chat/schemas/types/context';
import {
  OutgoingMessageFormat,
  StdOutgoingTextEnvelope,
} from '@/chat/schemas/types/message';
import { BaseBlockPlugin } from '@/plugins/base-block-plugin';
import { PluginService } from '@/plugins/plugins.service';
import { PluginBlockTemplate } from '@/plugins/types';
import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';

import SETTINGS from './settings';

@Injectable()
export class BookPlugin extends BaseBlockPlugin<typeof SETTINGS> {
  template: PluginBlockTemplate = { name: 'Book Plugin' };
  private readonly DEFAULT_MODEL = 'google/flan-t5-large';

  constructor(pluginService: PluginService) {
    super('book-plugin', pluginService);
  }

  getPath(): string {
    return __dirname;
  }

  async process(block: Block, _context: Context, _convId: string) {
    const args = this.getArguments(block);

    // Retrieve the user input and API key
    const userInput = _context.text || args.default_response;
    const llmApiKey = args.llm_api_key;

    if (!llmApiKey) {
      return this.createErrorMessage(
        'API key is missing. Please provide the LLM API key in the plugin settings.',
      );
    }

    if (!userInput || userInput.trim().length === 0) {
      return this.createErrorMessage(
        'Invalid input. Please provide a book name or description.',
      );
    }

    try {
      const response = await this.fetchFromLLM(llmApiKey, userInput);

      return {
        format: OutgoingMessageFormat.text,
        message: {
          text: response,
        },
      } as StdOutgoingTextEnvelope;
    } catch (error) {
      console.error('Error while fetching data from LLM API:', error);
      return this.createErrorMessage(
        'An error occurred while processing your request. Please try again later.',
      );
    }
  }

  private async fetchFromLLM(
    apiKey: string,
    userQuery: string,
  ): Promise<string> {
    const bookContext = `You are a knowledgeable assistant specialized in books. 
    If the query is about book recommendations, suggest relevant books with brief descriptions.
    If the query is about a specific book, provide a concise summary and key insights.`;

    const input = `Answer based on this context: ${bookContext}\n---\nQuery: ${userQuery}\nAnswer:`;

    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${this.DEFAULT_MODEL}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: input,
            parameters: {
              max_new_tokens: 200,
              temperature: 0.7,
              top_p: 0.3,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to get LLM response: ${await response.text()}`);
      }

      const result = await response.json();
      return result[0].generated_text;
    } catch (e) {
      throw new Error(`Error processing LLM request: ${e.message}`);
    }
  }

  private createErrorMessage(errorMessage: string): StdOutgoingTextEnvelope {
    return {
      format: OutgoingMessageFormat.text,
      message: {
        text: errorMessage,
      },
    } as StdOutgoingTextEnvelope;
  }
}
