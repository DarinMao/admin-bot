require("dotenv").config()
const TESTING = (process.env.NODE_ENV === "testing"); 

const Queue = require("bull");
const puppeteer = require("puppeteer");

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY) || 30;

const challenges = require("./challenges.js");

const start = async () => {
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });
    browser.on("targetcreated", async (target) => {
        try {
            const page = await target.page();
            if (page === null) {
                return;
            }
            const ctx = await target.browserContext();
            if (!ctx.isIncognito()) {
                await page.close()
            }
        } catch {}
    });

    const submissionQueue = new Queue("submission", REDIS_URL);
    submissionQueue.process(CONCURRENCY, async (job) => {
        if (job.data.challenge.filter) {
            const regex = new RegExp(job.data.challenge.filter);
            if (!regex.test(job.data.submission))
                throw new Error("Your submission does not match the filter!");
        }
        let ctx;
        try {
            ctx = await browser.createIncognitoBrowserContext();
            const handler = challenges.handlerModule[job.data.challenge.handler];
            const result = await handler(job, ctx, job.data.submission);
            return (job.data.challenge.showOutput) ? result : "";
        } catch (e) {
            if (job.data.challenge.showError)
                throw e;
            throw new Error("");
        } finally {
            await ctx.close();
        }
    });

    console.log("Worker ready");
};

start();
