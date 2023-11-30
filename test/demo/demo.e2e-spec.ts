import { Test } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
  HttpStatus,
} from '@nestjs/common';
import { DemoModule } from '../../src/demo/demo.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { CreateUserDto } from 'src/demo/dto/create-user.dto';

describe('[Feature] Demo - /v1/demo', () => {
  const user1 = {
    name: 'Zack',
  };
  const expectedUser1 = expect.objectContaining({
    ...user1,
  });
  let user1Id: string;

  const user2 = {
    name: 'Luke',
  };
  let user2Id: string;

  const event1 = {
    title: 'E1',
    description: 'Just a Test Event1',
    status: 'IN_PROGRESS',
    startTime: '2023-11-28',
    endTime: '2023/11/29',
    invitees: ['Zack', 'Luke'],
  };
  const expectedEvent1 = expect.objectContaining({
    ...event1,
    startTime: new Date(event1.startTime).toISOString(),
    endTime: new Date(event1.endTime).toISOString(),
    invitees: event1.invitees.map((name) => expect.objectContaining({ name })),
  });
  let event1Id: string;

  const event2 = {
    title: 'E2',
    description: 'Just a Test Event2',
    status: 'IN_PROGRESS',
    startTime: '2023-11-29',
    endTime: '2023/11/30',
    invitees: ['Zack'],
  };
  let event2Id: string;

  const event3 = {
    title: 'E3',
    status: 'TODO',
    startTime: '2023-12-01',
    endTime: '2023/12/01',
    invitees: ['Zack'],
  };
  const expectedEvent3 = expect.objectContaining({
    ...event3,
    startTime: new Date(event3.startTime).toISOString(),
    endTime: new Date(event3.endTime).toISOString(),
    invitees: event3.invitees.map((name) => expect.objectContaining({ name })),
  });

  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        DemoModule,
        ConfigModule.forRoot(),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DATABASE_HOST,
          port: +process.env.DATABASE_TESTPORT,
          username: process.env.DATABASE_USER,
          password: process.env.DATABASE_PASSWORD,
          database: process.env.DATABASE_NAME,
          autoLoadEntities: true,
          synchronize: true, // Disable this in Production!
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({
      type: VersioningType.URI, // Add version to out API
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // filter out all unwanted payloads fields
        transform: true, // auto transform the datatypes
      }),
    );
    await app.init();
  });

  describe('Create one User [POST /user/]', () => {
    describe('when a valid "name" field is provided in the body', () => {
      it('should return the created User object', async () => {
        const { body } = await request(app.getHttpServer())
          .post('/v1/demo/user')
          .send(user1 as CreateUserDto)
          .expect(HttpStatus.CREATED);
        expect(body).toEqual(expectedUser1);
        user1Id = body.id;
      });
    });
    describe('otherwise should throw the "BAD_REQUEST" [400]', () => {
      it('if "name" field undefined or null', () => {
        request(app.getHttpServer())
          .post('/v1/demo/user')
          .expect(HttpStatus.BAD_REQUEST);
        request(app.getHttpServer())
          .post('/v1/demo/user')
          .send({ name: null } as CreateUserDto)
          .expect(HttpStatus.BAD_REQUEST);
      });
      it('if "name" field is empty string', () => {
        request(app.getHttpServer())
          .post('/v1/demo/user')
          .send({ name: '' } as CreateUserDto)
          .expect(HttpStatus.BAD_REQUEST);
      });
    });
  });

  describe('Get one User [GET /user/:id]', () => {
    describe('when a valid "uuid" is provided', () => {
      describe('when the User exists', () => {
        it('should return the User object', async () => {
          const { body } = await request(app.getHttpServer())
            .get(`/v1/demo/user/${user1Id}`)
            .expect(HttpStatus.OK);
          expect(body).toEqual(expectedUser1);
        });
      });
      describe('otherwise', () => {
        it('should throw the "NOT_FOUND" [404]', () => {
          request(app.getHttpServer())
            .get(`/v1/demo/user/`)
            .expect(HttpStatus.NOT_FOUND);
        });
      });
    });
    describe('otherwise', () => {
      it('should throw the "INTERNAL_SERVER_ERROR" [500]', () => {
        request(app.getHttpServer())
          .get(`/v1/demo/user/1`)
          .expect(HttpStatus.INTERNAL_SERVER_ERROR);
      });
    });
  });

  describe('Delete one User [DELETE /user/:id]', () => {
    describe('when a valid "uuid" is provided', () => {
      describe('when the User exists', () => {
        it('should return the User object', async () => {
          const { body } = await request(app.getHttpServer())
            .delete(`/v1/demo/user/${user1Id}`)
            .expect(HttpStatus.OK);
          expect(body).toEqual(expectedUser1);
        });
        it('then finding the User should throw "NOT_FOUND" [404] ', () => {
          request(app.getHttpServer())
            .get(`/v1/demo/user/${user1Id}`)
            .expect(HttpStatus.NOT_FOUND);
        });
        user1Id = null;
      });
      describe('otherwise', () => {
        it('should throw the "NOT_FOUND" [404]', () => {
          request(app.getHttpServer())
            .delete(`/v1/demo/user/`)
            .expect(HttpStatus.NOT_FOUND);
        });
      });
    });
    describe('otherwise', () => {
      it('should throw the "INTERNAL_SERVER_ERROR" [500]', () => {
        request(app.getHttpServer())
          .delete(`/v1/demo/user/1`)
          .expect(HttpStatus.INTERNAL_SERVER_ERROR);
      });
    });
  });

  describe('Create one Event [POST /event/]', () => {
    describe('when all valid field is provided in the body', () => {
      it('should return the created Event object', async () => {
        await request(app.getHttpServer())
          .post('/v1/demo/user')
          .send(user1 as CreateUserDto)
          .then(({ body }) => {
            user1Id = body.id;
          });
        await request(app.getHttpServer())
          .post('/v1/demo/user')
          .send(user2 as CreateUserDto)
          .then(({ body }) => {
            user2Id = body.id;
          });
        const { body } = await request(app.getHttpServer())
          .post('/v1/demo/event')
          .send({ ...event1, invitees: [user1Id, user2Id] })
          .expect(HttpStatus.CREATED);
        expect(body).toEqual(expectedEvent1);
        event1Id = body.id;
      });
    });
    describe('when all valid field is provided except "description" in the body', () => {
      it('should return the created Event object', async () => {
        const { body } = await request(app.getHttpServer())
          .post('/v1/demo/event')
          .send({ ...event3, invitees: [user1Id] })
          .expect(HttpStatus.CREATED);
        expect(body).toEqual(expectedEvent3);
      });
    });
    describe('otherwise', () => {
      it('should throw the "BAD_REQUEST" [400]', () => {
        request(app.getHttpServer())
          .post('/v1/demo/event')
          .send({})
          .expect(HttpStatus.BAD_REQUEST);
      });
    });
  });

  describe('Get one Event [GET /event/:id]', () => {
    describe('when a valid "uuid" is provided', () => {
      describe('when the Event exists', () => {
        it('should return the Event object', async () => {
          const { body } = await request(app.getHttpServer())
            .get(`/v1/demo/event/${event1Id}`)
            .expect(HttpStatus.OK);
          expect(body).toEqual(expectedEvent1);
        });
      });
      describe('otherwise', () => {
        it('should throw the "NOT_FOUND" [404]', () => {
          request(app.getHttpServer())
            .get(`/v1/demo/event/`)
            .expect(HttpStatus.NOT_FOUND);
        });
      });
    });
    describe('otherwise', () => {
      it('should throw the "INTERNAL_SERVER_ERROR" [500]', () => {
        request(app.getHttpServer())
          .get(`/v1/demo/event/1`)
          .expect(HttpStatus.INTERNAL_SERVER_ERROR);
      });
    });
  });

  describe('Delete one Event [DELETE /event/:id]', () => {
    describe('when a valid "uuid" is provided', () => {
      describe('when the Event exists', () => {
        it('should return the Event object', async () => {
          const { body } = await request(app.getHttpServer())
            .delete(`/v1/demo/event/${event1Id}`)
            .expect(HttpStatus.OK);
          expect(body).toEqual(expectedEvent1);
        });
        it('then finding the Event should throw "NOT_FOUND" [404] ', () => {
          request(app.getHttpServer())
            .get(`/v1/demo/event/${event1Id}`)
            .expect(HttpStatus.NOT_FOUND);
        });
        event1Id = null;
      });
      describe('otherwise', () => {
        it('should throw the "NOT_FOUND" [404]', () => {
          request(app.getHttpServer())
            .delete(`/v1/demo/event/`)
            .expect(HttpStatus.NOT_FOUND);
        });
      });
    });
    describe('otherwise', () => {
      it('should throw the "INTERNAL_SERVER_ERROR" [500]', () => {
        request(app.getHttpServer())
          .delete(`/v1/demo/event/1`)
          .expect(HttpStatus.INTERNAL_SERVER_ERROR);
      });
    });
  });

  describe('Merge overlapping Events of a User [PUT /merge-all/:id]', () => {
    describe('when the user exists', () => {
      let newEventId: string;
      const expectedMergedEvent = expect.objectContaining({
        title: `${event1.title} & ${event2.title}`,
        description: `${event1.description}\n\n${event2.description}`,
        startTime: new Date(event1.startTime).toISOString(),
        endTime: new Date(event2.endTime).toISOString(),
        invitees: event1.invitees.map((name) =>
          expect.objectContaining({ name }),
        ),
      });
      const expectedEventList = expect.arrayContaining([
        expectedMergedEvent,
        expectedEvent3,
      ]);

      it('should return the list of Merged Events', async () => {
        await request(app.getHttpServer())
          .post('/v1/demo/event')
          .send({ ...event1, invitees: [user1Id, user2Id] })
          .then(({ body }) => {
            event1Id = body.id;
          });
        await request(app.getHttpServer())
          .post('/v1/demo/event')
          .send({ ...event2, invitees: [user1Id] })
          .then(({ body }) => {
            event2Id = body.id;
          });
        const { body } = await request(app.getHttpServer())
          .put(`/v1/demo/merge-all/${user1Id}`)
          .expect(HttpStatus.OK);
        expect(body).toEqual(expectedEventList);
        newEventId = body[0].id;
      });
      it('should insert the new Merged Event', async () => {
        const { body } = await request(app.getHttpServer())
          .get(`/v1/demo/event/${newEventId}`)
          .expect(HttpStatus.OK);
        expect(body).toEqual(expectedMergedEvent);
      });
      it('should remove the Events that merged', async () => {
        await request(app.getHttpServer())
          .get(`/v1/demo/event/${event1Id}`)
          .expect(HttpStatus.NOT_FOUND);
        await request(app.getHttpServer())
          .get(`/v1/demo/event/${event2Id}`)
          .expect(HttpStatus.NOT_FOUND);
      });
    });
    describe('otherwise', () => {
      it('should throw the "NOT_FOUND" [404]', () => {
        request(app.getHttpServer())
          .put(`/v1/demo/merge-all/`)
          .expect(HttpStatus.NOT_FOUND);
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
