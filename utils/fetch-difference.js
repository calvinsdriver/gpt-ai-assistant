import config from "../config/index.js";
import OpenAI from "openai";
import * as fs from "fs";

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

const fetchDifference = async() => {
  // Step 2: Create an Assistant
  const myAssistant = await openai.beta.assistants.create({
    model: "gpt-4o-mini",
    instructions:
      "You are a customer support chatbot. Use your knowledge base to best respond to customer queries.",
    name: "Customer Support Chatbot",
    tools: [{ type: "file_search" }],
  });
  console.log("This is the assistant object: ", myAssistant, "\n");

  // Step 1: Upload a File with an "assistants" purpose
  fs.readdirSync('./utils').forEach(file => {
    console.log(file);
  });
  const myFile = await openai.files.create({
    file: fs.createReadStream("./utils/request_0000014524.json"),
    purpose: "assistants",
  });
  console.log("This is the file object: ", myFile, "\n");

  const myFile2 = await openai.files.create({
    file: fs.createReadStream("./utils/request_0000014524 copy.json"),
    purpose: "assistants",
  });
  console.log("This is the file object: ", myFile2, "\n");

  // Step 3: Create a Thread
  const myThread = await openai.beta.threads.create();
  console.log("This is the thread object: ", myThread, "\n");

  // Step 4: Add a Message to a Thread
  const myThreadMessage = await openai.beta.threads.messages.create(
    (thread_id = myThread.id),
    {
      role: "user",
      content: "Compare Driver's Name, Voilation Number, Accident Number, Number of Claims between submission quote and renewal quotes.",
      attachments: [
        {"file_id": myFile.id, "tools": [{"type": "file_search"}]},
       {"file_id": myFile2.id, "tools": [{"type": "file_search"}]}
      ],
    }
  );
  console.log("This is the message object: ", myThreadMessage, "\n");

//   const myThreadMessage2 = await openai.beta.threads.messages.create(
//     (thread_id = myThread.id),
//     {
//       role: "user",
//       content: "What is the account number?",
//       attachments: [
//  //       {"file_id": myFile.id, "tools": [{"type": "file_search"}]},
//         {"file_id": myFile2.id, "tools": [{"type": "file_search"}]}
//       ],
//     }
//   );
//   console.log("This is the message object: ", myThreadMessage2, "\n");

  // Step 5: Run the Assistant
  const myRun = await openai.beta.threads.runs.create(
    (thread_id = myThread.id),
    {
      assistant_id: myAssistant.id,
      instructions: "Please address the user as Future Insurance.",
    }
  );
  console.log("This is the run object: ", myRun, "\n");

  // Step 6: Periodically retrieve the Run to check on its status to see if it has moved to completed
  const retrieveRun = async () => {
    let keepRetrievingRun;
    let result;

    while (myRun.status === "queued" || myRun.status === "in_progress") {
      keepRetrievingRun = await openai.beta.threads.runs.retrieve(
        (thread_id = myThread.id),
        (run_id = myRun.id)
      );
      console.log(`Run status: ${keepRetrievingRun.status}`);

      if (keepRetrievingRun.status === "completed") {
        console.log("\n");

        // Step 7: Retrieve the Messages added by the Assistant to the Thread
        const allMessages = await openai.beta.threads.messages.list(
          (thread_id = myThread.id)
        );

        console.log(
          "------------------------------------------------------------ \n"
        );

        console.log("User: ", myThreadMessage.content[0].text.value);
        // console.log("User: ", myThreadMessage2.content[0].text.value);
        console.log("Assistant: ", allMessages.data[0].content[0].text.value);
        result = allMessages.data[0].content[0].text.value;
        break;
      } else if (
        keepRetrievingRun.status === "queued" ||
        keepRetrievingRun.status === "in_progress"
      ) {
        // pass
      } else {
        console.log(`Run status: ${keepRetrievingRun.status}`);
        console.log(`Error: ${keepRetrievingRun.last_error.message}`);
        break;
      }
    }
    return result;
  };
  return await retrieveRun();
};

export default fetchDifference;