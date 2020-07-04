// Express
const express = require('express');
const app = express();

// Bull
const Queue = require("bull");
const { UI, setQueues } = require('bull-board');

// Some consts for server and redis
const port = process.env.BULL_BOARD_PORT || 8001;
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// Submission queue from admin-bot
const submissionQueue = new Queue("submission", REDIS_URL);
setQueues([submissionQueue])

// That's it to setting up bull-board, ez
app.use('/', UI)

app.listen(port, () => console.log(`Bull-dashboard at http://localhost:${port}`))