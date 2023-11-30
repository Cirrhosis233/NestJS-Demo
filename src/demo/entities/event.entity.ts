import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';

export type StatusType = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

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
  status: StatusType; // Customized status type, exported

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
