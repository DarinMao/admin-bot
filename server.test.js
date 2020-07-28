const {app} = require('./server.js');
// Supertest unit test stuffs
const supertest = require('supertest')
const request = supertest(app)

// If server tests finish, that means the server is 100% unhackable
it('Get the test endpoint', async done => {
  const res = await request.get('/')

  expect(res.status).toBe(200)
  done()
})

it('Visit an invalid challenge', async done => {
  const res = await request.post('/submit/isweartogodthischallengedoesntexist')

  expect(res.status).toBe(404)
  expect(res.text).toBe('Not Found')
  done()
})

it('Visit an invalid status id', async done => {
  const res = await request.get('/status/thisbetternotexistinbull')

  expect(res.status).toBe(404)
  expect(res.text).toBe('Not Found')
  done()
})