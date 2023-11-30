import { Test, TestingModule } from '@nestjs/testing';
import { DemoService } from './demo.service';
import { Repository, DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Event } from './entities/event.entity';
import { NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateEventDto } from './dto/create-event.dto';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const createMockRepository = <T = any>(): MockRepository<T> => ({
  findOne: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
  save: jest.fn(),
});

type MockDataSource = Partial<Record<keyof DataSource, jest.Mock>>;
const createMockDataSource = (): MockDataSource => ({
  createQueryRunner: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    startTransaction: jest.fn(),
    release: jest.fn(),
    rollbackTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    manager: {
      save: jest.fn(),
      remove: jest.fn(),
    },
  })),
});

describe('DemoService', () => {
  let service: DemoService;
  let userRepository: MockRepository;
  let eventRepository: MockRepository;
  let dataSource: MockDataSource;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DemoService,
        { provide: DataSource, useValue: createMockDataSource() },
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Event),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<DemoService>(DemoService);
    userRepository = module.get<MockRepository>(getRepositoryToken(User));
    eventRepository = module.get<MockRepository>(getRepositoryToken(Event));
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Unit Test for createUser
  describe('createUser', () => {
    it('should return the created User object', async () => {
      const createUserDto = new CreateUserDto();
      const expectedUser = {};
      userRepository.create.mockReturnValue(expectedUser);
      userRepository.save.mockReturnValue(expectedUser);
      const user = await service.createUser(createUserDto);
      expect(user).toEqual(expectedUser);
    });
  });

  // Unit Test for findOneUser
  describe('findOneUser', () => {
    const userId = '1';
    describe('when User with id exists', () => {
      it('should return the User object', async () => {
        const expectedUser = {};
        userRepository.findOne.mockReturnValue(expectedUser);
        const user = await service.findOneUser(userId);
        expect(user).toEqual(expectedUser);
      });
    });
    describe('otherwise', () => {
      it('should throw the "NotFoundException"', async () => {
        userRepository.findOne.mockReturnValue(undefined);
        try {
          await service.findOneUser(userId);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.message).toEqual(`User #${userId} not found!`);
        }
      });
    });
  });

  // Unit Test for removeUser
  describe('removeUser', () => {
    const userId = '1';
    describe('when User with id exists', () => {
      it('should return the removed User object', async () => {
        const expectedUser = {};
        userRepository.findOne.mockReturnValue(expectedUser);
        userRepository.remove.mockReturnValue(expectedUser);
        const user = await service.removeUser(userId);
        expect(user).toEqual(expectedUser);
      });
    });
    describe('otherwise', () => {
      it('should throw the "NotFoundException"', async () => {
        userRepository.findOne.mockReturnValue(undefined);
        try {
          await service.removeUser(userId);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.message).toEqual(`User #${userId} not found!`);
        }
      });
    });
  });

  // Unit Test for createEvent
  describe('createEvent', () => {
    const userId = '1';
    const createEventDto = Object.create(CreateEventDto, {
      invitees: { value: [userId] },
    });
    describe('when all User uuids in invitees exists', () => {
      it('should return the created Event object', async () => {
        const expectedEvent = {};
        userRepository.findOne.mockReturnValue({});
        eventRepository.create.mockReturnValue(expectedEvent);
        eventRepository.save.mockReturnValue(expectedEvent);
        const event = await service.createEvent(createEventDto);
        expect(event).toEqual(expectedEvent);
      });
    });
    describe('otherwise', () => {
      it('should throw the "NotFoundException"', async () => {
        userRepository.findOne.mockReturnValue(undefined);
        try {
          await service.createEvent(createEventDto);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.message).toEqual(`User #${userId} not found!`);
        }
      });
    });
  });

  // Unit Test for findOneEvent
  describe('findOneEvent', () => {
    const eventId = '1';
    describe('when Event with id exists', () => {
      it('should return the Event object', async () => {
        const expectedEvent = {};
        eventRepository.findOne.mockReturnValue(expectedEvent);
        const event = await service.findOneEvent(eventId);
        expect(event).toEqual(expectedEvent);
      });
    });
    describe('otherwise', () => {
      it('should throw the "NotFoundException"', async () => {
        eventRepository.findOne.mockReturnValue(undefined);
        try {
          await service.findOneEvent(eventId);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.message).toEqual(`Event #${eventId} not found!`);
        }
      });
    });
  });

  // Unit Test for removeEvent
  describe('removeEvent', () => {
    const eventId = '1';
    describe('when Event with id exists', () => {
      it('should return the removed Event object', async () => {
        const expectedEvent = {};
        eventRepository.findOne.mockReturnValue(expectedEvent);
        eventRepository.remove.mockReturnValue(expectedEvent);
        const event = await service.removeEvent(eventId);
        expect(event).toEqual(expectedEvent);
      });
    });
    describe('otherwise', () => {
      it('should throw the "NotFoundException"', async () => {
        eventRepository.findOne.mockReturnValue(undefined);
        try {
          await service.removeEvent(eventId);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.message).toEqual(`Event #${eventId} not found!`);
        }
      });
    });
  });

  // Unit Test for mergeAll
  describe('mergeAll', () => {
    const userId = '1';
    describe('when User with id exists', () => {
      describe('when the user does not have any events', () => {
        it('should return an empty list', async () => {
          const expectedEvents: any[] = [];
          userRepository.findOne.mockReturnValue({ events: [] });
          const mergedEvents = await service.mergeAll(userId);
          expect(mergedEvents).toEqual(expectedEvents);
        });
      });
      describe('otherwise', () => {
        describe('when all events do not overlap', () => {
          it('should return the unchanged events list', async () => {
            const event1 = {
              startTime: new Date('2023-11-27'),
              endTime: new Date('2023-11-28'),
            };
            const event2 = {
              startTime: new Date('2023-11-29'),
              endTime: new Date('2023-11-30'),
            };
            const expectedEvents = [event1, event2];
            userRepository.findOne.mockReturnValue({
              events: [event1, event2],
            });
            const mergedEvents = await service.mergeAll(userId);
            expect(mergedEvents).toEqual(expectedEvents);
          });
        });
        describe('when all events overlap', () => {
          it('should return a list with an single merged Event', async () => {
            const event1 = {
              startTime: new Date('2023-11-27'),
              endTime: new Date('2023-11-28'),
              invitees: ['1'],
            };
            const event2 = {
              startTime: new Date('2023-11-28'),
              endTime: new Date('2023-11-30'),
              invitees: ['2'],
            };
            const expectedEvents = [
              {
                startTime: event1.startTime,
                endTime: event2.endTime,
                invitees: [...event1.invitees, ...event2.invitees],
              },
            ];
            userRepository.findOne.mockReturnValueOnce({
              events: [event1, event2],
            });
            userRepository.findOne.mockReturnValueOnce({
              events: expectedEvents,
            });
            const mergedEvents = await service.mergeAll(userId);
            expect(mergedEvents).toEqual(expectedEvents);
          });
        });
        describe('when mixed with overlap and non-overlap events', () => {
          it('should return a list with merged overlap Events and unchanged non-overlap Events', async () => {
            const event1 = {
              startTime: new Date('2023-11-27'),
              endTime: new Date('2023-11-28'),
              invitees: ['1'],
            };
            const event2 = {
              startTime: new Date('2023-11-28'),
              endTime: new Date('2023-11-30'),
              invitees: ['2'],
            };
            const event3 = {
              startTime: new Date('2023-12-01'),
              endTime: new Date('2023-12-01'),
              invitees: ['3'],
            };
            const expectedEvents = [
              {
                startTime: event1.startTime,
                endTime: event2.endTime,
                invitees: [...event1.invitees, ...event2.invitees],
              },
              event3,
            ];
            userRepository.findOne.mockReturnValueOnce({
              events: [event1, event2, event3],
            });
            userRepository.findOne.mockReturnValueOnce({
              events: expectedEvents,
            });
            const mergedEvents = await service.mergeAll(userId);
            expect(mergedEvents).toEqual(expectedEvents);
          });
        });
      });
    });
    describe('otherwise', () => {
      it('should throw the "NotFoundException"', async () => {
        userRepository.findOne.mockReturnValue(undefined);
        try {
          await service.mergeAll(userId);
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.message).toEqual(`User #${userId} not found!`);
        }
      });
    });
  });
});
