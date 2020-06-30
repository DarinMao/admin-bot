// config
require("dotenv").config()

const TESTING = (process.env.NODE_ENV === "testing"); 
const PORT = process.env.PORT || 8000;
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const RECAPTCHA_PUBLIC_KEY = process.env.RECAPTCHA_PUBLIC_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
const RECAPTCHA_PRIVATE_KEY = process.env.RECAPTCHA_PRIVATE_KEY || "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";
const RECAPTCHA_ERROR_CODES = {
    "missing-input-secret": "The secret parameter is missing.",
    "invalid-input-secret": "The secret parameter is invalid or malformed.",
    "missing-input-response": "The response parameter is missing.",
    "invalid-input-response": "The response parameter is invalid or malformed."
};
const STATUS_MESSAGES = {
    "PENDING": "Processing of your submission has not started yet, or the submission does not exist.",
    "STARTED": "Your submission started processing.",
    "SUCCESS": "Your submission has been successfully processed.",
    "FAILURE": "Your submission failed to process.",
    "PROGRESS": "Your submission is being processed.",
};

const path = require("path");
const got = require("got");

// challenges
const challenges = require("./challenges.js");

// bull
const Queue = require("bull");
const submissionQueue = new Queue("submission", REDIS_URL);

// express
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const csurf = require("csurf");

const nunjucks = require("nunjucks");
const dateFilter = require("nunjucks-date-filter");

const app = express();
const csrfProtection = (TESTING) ? csurf({ ignoreMethods: ["GET", "POST"], cookie: true }) : csurf({ cookie: true });
const parseForm = bodyParser.urlencoded({ extended: false });

nunjucks.configure("templates", {
    autoescape: true,
    express: app
}).addFilter('date', dateFilter);
app.use(express.static("static"));
app.use(cookieParser())

app.get("/", (req, res) => {
    res.render("index.html");
});

app.use("/submit/:challenge", (req, res, next) => {
    if (!(req.params.challenge in challenges.challenges)) {
        res.sendStatus(404);
    } else {
        req.challenge = challenges.challenges[req.params.challenge];
        req.submission = req.query.submission;
        next();
    }
});

app.get("/submit/:challenge", csrfProtection, async (req, res) => {
    res.render("submit.html", {
        challenge: req.challenge, 
        submission: req.submission, 
        csrf: req.csrfToken(),
        recaptcha: {key: RECAPTCHA_PUBLIC_KEY}
    });
});

app.post("/submit/:challenge", parseForm, csrfProtection, async (req, res) => {
    const recaptchaResponse = (await got({
        url: "https://www.google.com/recaptcha/api/siteverify",
        method: "POST",
        responseType: "json",
        form: {
            secret: RECAPTCHA_PRIVATE_KEY,
            response: req.body["g-recaptcha-response"]
        }
    })).body;
    if (recaptchaResponse.success) {
        const job = await submissionQueue.add({
            challenge: req.challenge, 
            submission: req.submission
        });
        res.redirect(`/status/${job.id}`);
    } else {
        const errors = recaptchaResponse["error-codes"].map(error => RECAPTCHA_ERROR_CODES[error]);
        res.render("submit.html", {
            challenge: req.challenge, 
            submission: req.submission, 
            csrf: req.csrfToken(),
            recaptcha: {key: RECAPTCHA_PUBLIC_KEY, errors}
        });
    }
});

app.get("/status/:id", async (req, res) => {
    const id = req.params.id;
    const job = await submissionQueue.getJob(id);
    if (job === null) {
        res.sendStatus(404);
    } else {
        res.render("status.html", {job});
    }
});

// socket.io
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const getJobInfo = async (job) => {
    const state = await job.getState();
    const progress = job._progress;
    const output = JSON.stringify(job.returnvalue); // ???
    const error = job.failedReason;
    return {state, progress, output, error};
};

const sendProgress = async (jobId, progress) => {
    io.to(jobId).emit("progress", progress);
};

const sendCompleted = async (jobId, result) => {
    io.to(jobId).emit("completed", JSON.parse(result)); 
};

const sendFailed = async (jobId, err) => {
    io.to(jobId).emit("failed", err);
};

const sendState = async (jobId, state) => {
    io.to(jobId).emit("state", state);
};

io.on("connection", (socket) => {
    socket.on("identify", async (pathname) => {
        const id = path.basename(pathname);
        socket.join(id);
        const job = await submissionQueue.getJob(id);
        if (job === null) {
            socket.disconnect();
        }
        else {
            const info = await getJobInfo(job);
            if (info.state === "completed")
                sendCompleted(job.id, info.output);
            else if (info.state === "failed")
                sendFailed(job.id, info.error);
            else if (info.state === "active")
                sendProgress(job.id, info.progress);
            else
                sendState(job.id, info.state);
            
        }
    });
});

submissionQueue.on("global:progress", sendProgress);
submissionQueue.on("global:completed", sendCompleted);
submissionQueue.on("global:failed", sendFailed);

// lets gooo
http.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});
