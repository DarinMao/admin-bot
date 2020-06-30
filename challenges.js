const fs = require("fs");
const YAML = require("yaml");

const file = fs.readFileSync(process.env.CHALLENGE_CONFIG, "utf8")
const challenges = YAML.parse(file);
challenges.handlerModule = require(challenges.handlerModule);

module.exports = challenges;
