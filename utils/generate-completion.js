import config from '../config/index.js';
import { MOCK_TEXT_OK } from '../constants/mock.js';
import { createChatCompletion, FINISH_REASON_STOP } from '../services/openai.js';
import { fetchDifference } from './fetch-difference.cjs';

class Completion {
  text;

  finishReason;

  constructor({
    text,
    finishReason,
  }) {
    this.text = text;
    this.finishReason = finishReason;
  }

  get isFinishReasonStop() {
    return this.finishReason === FINISH_REASON_STOP;
  }
}

/**
 * @param {Object} param
 * @param {Prompt} param.prompt
 * @returns {Promise<Completion>}
 */
const generateCompletion = async ({
  prompt,
}) => {
  if (config.APP_ENV !== 'production') return new Completion({ text: MOCK_TEXT_OK });
  const { data } = await createChatCompletion({ messages: prompt.messages });
  const [choice] = data.choices;
  let answer = choice.message.content.trim();
  if (answer === 'Please upload your renewal policy quote and your current policy quote.') {
    answer = await fetchDifference();
  }
  return new Completion({
    text: answer,
    finishReason: choice.finish_reason,
  });
};

export default generateCompletion;
