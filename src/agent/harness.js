import Anthropic from '@anthropic-ai/sdk';
import { getSystemPrompt, getUserPrompt } from './prompts.js';
import { tools, processToolCall } from './tools.js';

/**
 * Agent Harness - Orchestrates the PPT to HTML conversion agent
 */
export class AgentHarness {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    this.model = config.model || process.env.MODEL || 'claude-sonnet-4-5-20250929';
    this.maxTokens = config.maxTokens || parseInt(process.env.MAX_TOKENS) || 4096;
    this.temperature = config.temperature || parseFloat(process.env.TEMPERATURE) || 1.0;
    this.verbose = config.verbose !== undefined ? config.verbose : true;

    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }

    this.client = new Anthropic({ apiKey: this.apiKey });

    // Agent state
    this.conversationHistory = [];
    this.currentRules = null;
    this.currentPPTData = null;
  }

  /**
   * Initialize agent with rules
   */
  async initialize(ruleEngine) {
    this.currentRules = ruleEngine;

    if (this.verbose) {
      console.log('✓ Agent initialized with rules');
    }
  }

  /**
   * Set PPT data for conversion
   */
  setPPTData(pptData) {
    this.currentPPTData = pptData;

    if (this.verbose) {
      console.log('✓ PPT data loaded into agent');
    }
  }

  /**
   * Run the agent in agentic loop mode
   */
  async run(userMessage, options = {}) {
    const systemPrompt = getSystemPrompt(this.currentRules);

    // Build message with PPT data context
    const message = this.buildMessage(userMessage);

    this.conversationHistory.push({
      role: 'user',
      content: message
    });

    let continueLoop = true;
    let iterations = 0;
    const maxIterations = options.maxIterations || 10;

    while (continueLoop && iterations < maxIterations) {
      iterations++;

      if (this.verbose) {
        console.log(`\n--- Iteration ${iterations} ---`);
      }

      try {
        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          system: systemPrompt,
          messages: this.conversationHistory,
          tools: tools
        });

        // Process response
        const stopReason = response.stop_reason;

        if (this.verbose) {
          console.log(`Stop reason: ${stopReason}`);
        }

        // Handle text blocks
        const textBlocks = response.content.filter(block => block.type === 'text');
        if (textBlocks.length > 0 && this.verbose) {
          textBlocks.forEach(block => {
            console.log(`\nAgent: ${block.text}`);
          });
        }

        // Add assistant response to history
        this.conversationHistory.push({
          role: 'assistant',
          content: response.content
        });

        // Handle tool use
        if (stopReason === 'tool_use') {
          const toolResults = await this.handleToolUse(response.content);

          // Add tool results to conversation
          this.conversationHistory.push({
            role: 'user',
            content: toolResults
          });

          // Continue loop for next iteration
          continueLoop = true;

        } else if (stopReason === 'end_turn') {
          // Agent finished
          continueLoop = false;

          // Extract final result
          const finalText = textBlocks.map(b => b.text).join('\n');

          return {
            success: true,
            result: finalText,
            iterations: iterations,
            usage: response.usage
          };

        } else if (stopReason === 'max_tokens') {
          console.warn('Warning: Hit max tokens limit');
          continueLoop = false;

          return {
            success: false,
            error: 'Hit max tokens limit',
            iterations: iterations
          };
        }

      } catch (error) {
        console.error('Agent error:', error);
        return {
          success: false,
          error: error.message,
          iterations: iterations
        };
      }
    }

    // Max iterations reached
    return {
      success: false,
      error: 'Max iterations reached',
      iterations: iterations
    };
  }

  /**
   * Handle tool use blocks
   */
  async handleToolUse(contentBlocks) {
    const toolUseBlocks = contentBlocks.filter(block => block.type === 'tool_use');
    const results = [];

    for (const toolUse of toolUseBlocks) {
      if (this.verbose) {
        console.log(`\nTool called: ${toolUse.name}`);
        console.log(`Input:`, JSON.stringify(toolUse.input, null, 2));
      }

      try {
        const result = await processToolCall(
          toolUse.name,
          toolUse.input,
          {
            rules: this.currentRules,
            pptData: this.currentPPTData
          }
        );

        if (this.verbose) {
          console.log(`Result:`, JSON.stringify(result, null, 2));
        }

        results.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result)
        });

      } catch (error) {
        console.error(`Tool error in ${toolUse.name}:`, error);

        results.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify({
            error: error.message
          }),
          is_error: true
        });
      }
    }

    return results;
  }

  /**
   * Build message with context
   */
  buildMessage(userMessage) {
    let message = userMessage;

    // Add PPT data context if available
    if (this.currentPPTData) {
      message = `${userMessage}\n\n<ppt_data>\n${JSON.stringify(this.currentPPTData, null, 2)}\n</ppt_data>`;
    }

    return message;
  }

  /**
   * Reset conversation
   */
  reset() {
    this.conversationHistory = [];
    this.currentPPTData = null;

    if (this.verbose) {
      console.log('✓ Agent conversation reset');
    }
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return this.conversationHistory;
  }

  /**
   * Simple single-turn request (no agentic loop)
   */
  async ask(userMessage) {
    const systemPrompt = getSystemPrompt(this.currentRules);
    const message = this.buildMessage(userMessage);

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      });

      const textBlocks = response.content.filter(block => block.type === 'text');
      const text = textBlocks.map(b => b.text).join('\n');

      return {
        success: true,
        result: text,
        usage: response.usage
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default AgentHarness;
