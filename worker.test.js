const start = require('./worker.js')
const Queue = require("bull");
const { v4: uuidv4 } = require("uuid");

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const submissionQueue = new Queue("submission", REDIS_URL);

// If worker tests finish, that means the worker is 100% unhackable
it('Submit invalid regex', async done => {
  let challenge = {regex: "^http:\/\/2020\.redpwnc\.tf..."}
  let submission =  "http://notredpwnc.tf"
  try {
    await start(challenge)
    await submissionQueue.add({
        challenge: challenge, 
        submission: submission
    }, {jobId: uuidv4()});

  } catch(e) {
    expect(e.message).toBe("Your submission does not match the filter!")
  }
  done()
})