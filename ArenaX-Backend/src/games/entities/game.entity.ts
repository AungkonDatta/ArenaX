import { Check, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('games')
@Check('CHK_games_team_size', '"team_size" > 0')
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 60, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  genre: string | null;

  @Column({ name: 'team_size', type: 'int' })
  teamSize: number;
}
