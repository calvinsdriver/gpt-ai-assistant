import config from '../config/index.js';
import { MOCK_TEXT_OK } from '../constants/mock.js';
import { createChatCompletion, FINISH_REASON_STOP } from '../services/openai.js';
// import fetchDifference from './fetch-difference.js';
import fs from 'fs';
import path from 'path';

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
  console.log(`Prompt Message: ${prompt.messages}`);
  let usersPath = path.join(process.cwd(), 'test.json');
  const context = fs.readFileSync(usersPath, 'utf8');
  console.log(`context: ${context}`);
  const { data } = await createChatCompletion({ messages: [
    {role: "system", content: `${context}`},
    {role: "user", content: prompt.messages},
  ],
    });
  const [choice] = data.choices;
  let answer = choice.message.content.trim();
  // console.log(`Generated completion: ${answer}`);
  // if (answer === 'Please upload your renewal policy quote and your current policy quote.') {
  //   console.log('Fetching difference');
  //   answer = await fetchDifference();
  //   console.log(`Generated difference: ${answer}`);
  // }
  return new Completion({
    text: answer,
    finishReason: choice.finish_reason,
  });
};

export default generateCompletion;
