import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { DemoService } from './demo.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateEventDto } from './dto/create-event.dto';

@Controller({
  path: 'demo',
  version: '1',
})
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Post('user')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.demoService.createUser(createUserDto);
  }

  @Get('user/:id')
  findOneUser(@Param('id') id: string) {
    return this.demoService.findOneUser(id);
  }

  @Delete('user/:id')
  removeUser(@Param('id') id: string) {
    return this.demoService.removeUser(id);
  }

  @Post('event')
  createEvent(@Body() createEventDto: CreateEventDto) {
    return this.demoService.createEvent(createEventDto);
  }

  @Get('event/:id')
  findOneEvent(@Param('id') id: string) {
    return this.demoService.findOneEvent(id);
  }

  @Delete('event/:id')
  removeEvent(@Param('id') id: string) {
    return this.demoService.removeEvent(id);
  }

  @Put('merge-all/:id')
  mergeAll(@Param('id') id: string) {
    return this.demoService.mergeAll(id);
  }
}
