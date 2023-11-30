import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { StatusType } from './entities/event.entity';

@Injectable()
export class DemoService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly dataSource: DataSource,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findOneUser(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        events: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`User #${id} not found!`);
    }
    // user.events = user.events.map((e) => e.title); // If we just want the titles of the events
    return user;
  }

  async removeUser(id: string) {
    const user = await this.findOneUser(id);
    return this.userRepository.remove(user);
  }

  async createEvent(createEventDto: CreateEventDto) {
    // Retrive User[] from findOneUser API
    const invitees = await Promise.all(
      createEventDto.invitees.map((id) => this.findOneUser(id)),
    );
    const event = this.eventRepository.create({ ...createEventDto, invitees });
    return this.eventRepository.save(event);
  }

  async findOneEvent(id: string) {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: {
        invitees: true,
      },
    });
    if (!event) {
      throw new NotFoundException(`Event #${id} not found!`);
    }
    return event;
  }

  async removeEvent(id: string) {
    const event = await this.findOneEvent(id);
    return this.eventRepository.remove(event);
  }

  async mergeAll(id: string) {
    await this.mergeEvents(await this.getUserEventWithInvitees(id));
    return this.getUserEventWithInvitees(id);
  }

  // Will return events in asc order by startTime
  private async getUserEventWithInvitees(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: {
        events: {
          invitees: true,
        },
      },
      order: {
        events: {
          startTime: true,
        },
      },
    });
    if (!user) {
      throw new NotFoundException(`User #${userId} not found!`);
    }
    return user.events;
  }

  private async mergeEvents(events: Event[]) {
    if (events.length <= 1) {
      return; // There is no need to merge
    }
    // Establish Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let prev: Event = events[0];
    const toRemoveEvents: Event[] = [];
    const toCreateEvents = [];
    let isPrevRemove = false;
    for (let i = 1; i < events.length; i++) {
      const curr: Event = events[i];
      if (curr.startTime <= prev.endTime) {
        if (!isPrevRemove) {
          toRemoveEvents.push(prev);
          isPrevRemove = true;
        }
        toRemoveEvents.push(curr);
        prev.endTime = new Date(
          Math.max(curr.endTime.getTime(), prev.endTime.getTime()),
        );
        prev.invitees = [
          ...new Set([
            ...prev.invitees.map((e) =>
              JSON.stringify(e, Object.keys(e).sort()),
            ),
            ...curr.invitees.map((e) =>
              JSON.stringify(e, Object.keys(e).sort()),
            ),
          ]),
        ].map((e) => JSON.parse(e));
        prev.title += ' & ' + curr.title;
        if (curr.description) {
          prev.description += '\n\n' + curr.description;
          prev.description = prev.description.trim();
        }
        prev.status = this.getStatus(prev.startTime, prev.endTime);
      } else {
        if (isPrevRemove) {
          const createEvent = {
            title: prev.title,
            description: prev.description,
            status: prev.status,
            startTime: prev.startTime,
            endTime: prev.endTime,
            invitees: prev.invitees,
          };
          toCreateEvents.push(createEvent);
        }
        prev = curr;
        isPrevRemove = false;
      }
      if (isPrevRemove) {
        const createEvent = {
          title: prev.title,
          description: prev.description,
          status: prev.status,
          startTime: prev.startTime,
          endTime: prev.endTime,
          invitees: prev.invitees,
        };
        toCreateEvents.push(createEvent);
      }
    }
    // Add Remove merged Events to Transaction
    await Promise.all(
      toRemoveEvents.map(async (e) => await queryRunner.manager.remove(e)),
    );
    // Add Create new mergedEvent to Transaction
    await Promise.all(
      toCreateEvents.map(async (e) => {
        const event = this.eventRepository.create(e);
        await queryRunner.manager.save(event);
      }),
    );
    // Commit Transaction
    try {
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private getStatus(startTime: Date, endTime: Date): StatusType {
    const now = new Date();
    if (startTime > now) {
      return 'TODO';
    }
    if (endTime < now) {
      return 'COMPLETED';
    }
    return 'IN_PROGRESS';
  }
}
