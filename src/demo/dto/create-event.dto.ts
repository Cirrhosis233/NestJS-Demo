import { IsString, IsOptional, IsDate, IsNotEmpty } from 'class-validator';
import { StatusType } from '../entities/event.entity';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly description?: string; // Optinal

  @IsString()
  readonly status: StatusType;

  @Type(() => Date) // Accept ISO 8601 String
  @IsDate()
  readonly startTime: Date;

  @Type(() => Date) // Accept ISO 8601 String
  @IsDate()
  readonly endTime: Date;

  @IsString({ each: true })
  readonly invitees: string[]; // Should be array of uuids of Users
}
