# admin-bot
Puppeteer service for client-side CTF challenges

## Setup
First install dependencies with
```
$ npm install
```

You will also need access to a Redis server, either locally or on a different server. 

Configure admin-bot with environment variables or a `.env` file. There's not a ton to configure, and anything left unconfigured will have the below default values:
```
RECAPTCHA_PUBLIC_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
RECAPTCHA_PRIVATE_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
WORKER_CONCURRENCY=30
REDIS_URL=redis://127.0.0.1:6379
```

The only setting you *must* provide a value for is `CHALLENGE_CONFIG`, which points to a YAML file containing challenge configuration. If you're running workers on multiple servers, make sure the Redis server is accessible from all of them. 

## Challenge Configuration
Much like the previous attempt at writing admin-bot, challenge configuration is a combination of a YAML file and a module with handlers. 

### Handlers
Challenge handlers are specified in a module. Make sure they are callable with `require(<module>).<handler>`. They should have the following signature:
```js
async (job, ctx, submission)
```

`job` is the bull job, `ctx` is a fresh incognito browsing context, and `submission` is what the user submitted. If you would like to set progress during the handler, you can call `job.progress()` with a number between 0 and 100. Check out bull's [reference](https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md#job) for more options, though many of these methods are unhandled in this service. 

### YAML
```yml
handlerModule: ./handlers.js                # points to the handler module
challenges:
  test-title:                               # challenge ID as well as its submission URL
    displayName: "Test Challenge - Title"   # challenge name
    message: "Message to display"           # (optional) challenge message
    handler: getTitle                       # challenge handler
    showOutput: true                        # (optional, default false) show output on status page
    showError: true                         # (optional, default false) show errors on status page
    filter: ^http:\/\/2020\.redpwnc\.tf...  # (optional) submission regex filter
```

## Running
```
node server.js
node worker.js
```

You can have as many workers as you like, but running multiple workers on one machine will likely not improve performance (untested). 
