import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Team } from '../../teams/entities/team.entity';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { MatchStatus } from '../enums/match-status.enum';

@Entity('matches')
@Check('CHK_matches_scores', '"score_a" >= 0 AND "score_b" >= 0')
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tournament_id' })
  tournamentId: number;

  @ManyToOne(() => Tournament, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @Column({ type: 'int' })
  round: number;

  @Column({ name: 'match_no', type: 'int' })
  matchNo: number;

  @Column({ name: 'team_a_id', type: 'int', nullable: true })
  teamAId: number | null;

  @ManyToOne(() => Team, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'team_a_id' })
  teamA: Team | null;

  @Column({ name: 'team_b_id', type: 'int', nullable: true })
  teamBId: number | null;

  @ManyToOne(() => Team, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'team_b_id' })
  teamB: Team | null;

  @Column({ name: 'score_a', type: 'int', nullable: true })
  scoreA: number | null;

  @Column({ name: 'score_b', type: 'int', nullable: true })
  scoreB: number | null;

  @Column({ name: 'winner_id', type: 'int', nullable: true })
  winnerId: number | null;

  @ManyToOne(() => Team, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'winner_id' })
  winner: Team | null;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    enumName: 'match_status',
    default: MatchStatus.PENDING,
  })
  status: MatchStatus;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt: Date | null;

  @Column({ name: 'next_match_id', type: 'int', nullable: true })
  nextMatchId: number | null;

  @ManyToOne(() => Match, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'next_match_id' })
  nextMatch: Match | null;

  @Column({ name: 'next_slot', type: 'varchar', length: 1, nullable: true })
  nextSlot: 'A' | 'B' | null;
}
