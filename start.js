const {http} = require('./server.js')
const {start} = require('./worker.js')

const challenges = require("./challenges.js");
const PORT = process.env.PORT || 8000;

// lets gooo - starting the server
http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

start(challenges);
