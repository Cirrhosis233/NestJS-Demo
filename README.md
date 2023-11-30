<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Description

A backend demo following REST API created from [Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

### Install Database (Postgres)

Need to have [Docker](https://www.docker.com/) and docker-compose installed on your device.

```bash
$ docker-compose up -d db
```

You may want to check the content of `docker-compose.yml` in the root directory.

```yaml
version: "3"

services:
  db:
    image: postgres
    restart: always
    ports:
      - "5432:5432" # Check the port!
    environment:
      POSTGRES_PASSWORD: pass123 
  test-db: # Test Database, will be automatically created and deleted when running e2e tests
    image: postgres
    restart: always
    ports:
      - "5433:5432" # Check the port!
    environment:
      POSTGRES_PASSWORD: pass123
```

### Create `.ENV` file for Database Connection

Put at the root directory.

```
DATABASE_USER=postgres
DATABASE_PASSWORD=pass123
DATABASE_NAME=postgres
DATABASE_PORT=5432
DATABASE_HOST=localhost
DATABASE_TESTPORT=5433
```

#### Database synchronize

Inside `./src/app.module.ts`

```ts
TypeOrmModule.forRoot({
  ...
  synchronize: true, // Disable this in Production!
}),
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# unit test coverage
$ npm run test:cov

# e2e tests
$ npm run test:e2e

# e2e tests coverage
$ npm run test:e2e:cov
```

## Entities

### User

```ts
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToMany(() => Event, (event) => event.invitees)
  events: any[]; // can be Events[] or string[] depends on usecase
}
```

### Event

```ts
@Entity()
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true }) // Optinal
  description: string;

  @Column({
    type: 'enum',
    enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
  })
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @JoinTable()
  @ManyToMany(() => User, (user) => user.events)
  invitees: User[];
}
```

## API [v1]

### [POST] createUser `/v1/demo/user/`

- create a new user
- create-user-DTO: 

  ```ts
  export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    name: string;
  }
  ```

### [GET] findOneUser `/v1/demo/user/:id`

- return the user with certain uuid if exists

### [DELETE] removeUser `/v1/demo/user/:id`

- delete the user with certain uuid if exists
- return the deleted user

### [POST] createEvent `/v1/demo/event/`

- create a new event
- create-event-DTO:

  ```ts
  export class CreateEventDto {
    @IsString()
    @IsNotEmpty()
    title: string;
  
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    description?: string; // Optinal
  
    @IsString()
    status: StatusType;
  
    @Type(() => Date) // Accept ISO 8601 String
    @IsDate()
    startTime: Date;
  
    @Type(() => Date) // Accept ISO 8601 String
    @IsDate()
    endTime: Date;
  
    @IsString({ each: true })
    invitees: string[]; // Should be array of uuids of Users
  }
  ```

### [GET] findOneEvent `/v1/demo/event/:id`

- return the event with certain uuid if exists

### [DELETE] removeEvent `/v1/demo/event/:id`

- delete the event with certain uuid if exists
- return the deleted event

### [PUT] mergeAll `/v1/demo/mergeAll/:id`

- merge all overlapping events below to a user
- return the updated events list of the user
- Overlapping example: E1: 2pm-3pm, E2: 2:45pm-4pm => E_merged: 2pm-4pm
  - For those event, will invite all members in each event
  - title will be concatenated with "`&`" 
  - description will be concatenated with "`\n\n`"
  - status will be automatically updated based on the current time
- Will `create` new merged Events
- Will `delete` those events merged
- All create and delete operations are within a single Transaction, and will roll back if an error occurs.