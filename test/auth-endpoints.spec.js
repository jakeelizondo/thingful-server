const helpers = require('./test-helpers');
const knex = require('knex');
const app = require('../src/app');
const supertest = require('supertest');
const jwt = require('jsonwebtoken');

describe.only('Auth Endpoints', function () {
  let db;

  const { testUsers } = helpers.makeThingsFixtures();
  const testUser = testUsers[0];

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());
  before('cleanup tables', () => helpers.cleanTables(db));
  afterEach('cleanup tables', () => helpers.cleanTables(db));

  describe('POST /api/auth/login', () => {
    beforeEach('insert users', () => {
      helpers.seedUsers(db, testUsers);
    });

    const requiredFields = ['user_name', 'password'];
    requiredFields.forEach((field) => {
      const loginBody = {
        user_name: testUser.user_name,
        password: testUser.password,
      };

      it(`responds with 400 error when ${field} is missing`, () => {
        delete loginBody[field];

        return supertest(app)
          .post('/api/auth/login')
          .send(loginBody)
          .expect(400, {
            error: { message: `Missing ${field} in request body` },
          });
      });
    });

    it('responds with 400 and "invalid user_name or password" when bad user_name', () => {
      const invalidUser = {
        user_name: 'bad username',
        password: 'bad password',
      };
      return supertest(app)
        .post('/api/auth/login')
        .send(invalidUser)
        .expect(400, {
          error: { message: 'Incorrect username or password' },
        });
    });

    it('responds with 400 and "invalid user_name or password" when real user_name but wrong password', () => {
      const invalidUserPass = {
        user_name: testUser.user_name,
        password: 'bad password',
      };

      return supertest(app)
        .post('/api/auth/login')
        .send(invalidUserPass)
        .expect(400, {
          error: { message: 'Incorrect username or password' },
        });
    });

    it('responds with 200 and a JWT auth token when proper credentials provided', () => {
      const validUserCreds = {
        user_name: testUser.user_name,
        password: testUser.password,
      };

      const expectedToken = jwt.sign(
        { user_id: testUser.id },
        process.env.JWT_SECRET,
        { subject: testUser.user_name, algorithm: 'HS256' }
      );

      return supertest(app)
        .post('/api/auth/login')
        .send(validUserCreds)
        .expect((res) => {
          console.log(res.body);
        })
        .expect(200, { token: expectedToken });
    });
  });
});
