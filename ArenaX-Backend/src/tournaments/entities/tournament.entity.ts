import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Game } from '../../games/entities/game.entity';
import { User } from '../../users/entities/user.entity';
import { TournamentFormat } from '../enums/tournament-format.enum';
import { TournamentStatus } from '../enums/tournament-status.enum';

@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'game_id' })
  gameId: number;

  @ManyToOne(() => Game, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @Column({ name: 'organizer_id' })
  organizerId: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;

  @Column({ length: 120 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: TournamentFormat, enumName: 'tournament_format' })
  format: TournamentFormat;

  @Column({ name: 'max_teams', type: 'int' })
  maxTeams: number;

  @Column({ name: 'registration_deadline', type: 'timestamptz' })
  registrationDeadline: Date;

  @Column({ name: 'start_date', type: 'timestamptz', nullable: true })
  startDate: Date | null;

  @Column({ name: 'prize_pool', type: 'int', nullable: true })
  prizePool: number | null;

  @Column({
    type: 'enum',
    enum: TournamentStatus,
    enumName: 'tournament_status',
    default: TournamentStatus.DRAFT,
  })
  status: TournamentStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
