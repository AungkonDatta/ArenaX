import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { HashingService } from '../common/services/hashing.service';
import { Game } from '../games/entities/game.entity';
import { TeamMember } from '../teams/entities/team-member.entity';
import { Team } from '../teams/entities/team.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { TournamentFormat } from '../tournaments/enums/tournament-format.enum';
import { TournamentStatus } from '../tournaments/enums/tournament-status.enum';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const dataSource = app.get(DataSource);
  const config = app.get(ConfigService);
  const hashing = app.get(HashingService);

  const users = dataSource.getRepository(User);
  const games = dataSource.getRepository(Game);
  const teams = dataSource.getRepository(Team);
  const members = dataSource.getRepository(TeamMember);
  const tournaments = dataSource.getRepository(Tournament);

  const ensureUser = async (data: Partial<User>, password: string) => {
    const existing = await users.findOne({ where: { email: data.email } });
    if (existing) {
      return existing;
    }
    return users.save(users.create({ ...data, passwordHash: await hashing.hash(password) }));
  };

  const ensureGame = async (name: string, genre: string, teamSize: number) => {
    const existing = await games.findOne({ where: { name } });
    return existing ?? games.save(games.create({ name, genre, teamSize }));
  };

  await ensureUser(
    {
      name: config.get<string>('ADMIN_NAME'),
      email: config.get<string>('ADMIN_EMAIL').toLowerCase(),
      role: Role.ADMIN,
    },
    config.get<string>('ADMIN_PASSWORD'),
  );

  const organizer = await ensureUser(
    { name: 'Club Organizer', email: 'organizer@arenax.local', role: Role.ORGANIZER },
    'Organizer@123',
  );

  const players: User[] = [];
  for (let i = 1; i <= 8; i++) {
    players.push(
      await ensureUser(
        {
          name: `Player ${i}`,
          email: `player${i}@arenax.local`,
          role: Role.PLAYER,
          studentId: `23-5${String(1000 + i).padStart(4, '0')}-${i % 10}`,
          inGameName: `Gamer${i}`,
        },
        'Player@123',
      ),
    );
  }

  await ensureGame('Valorant', 'Tactical Shooter', 5);
  await ensureGame('PUBG Mobile', 'Battle Royale', 4);
  const eFootball = await ensureGame('eFootball', 'Sports', 1);

  const teamNames = [
    ['Team Alpha', 'ALPHA'],
    ['Team Bravo', 'BRAVO'],
    ['Team Charlie', 'CHARLIE'],
    ['Team Delta', 'DELTA'],
  ];
  for (let i = 0; i < teamNames.length; i++) {
    const [name, tag] = teamNames[i];
    if (await teams.exists({ where: { name } })) {
      continue;
    }
    const team = await teams.save(teams.create({ name, tag, captainId: players[i].id }));
    await members.save(members.create({ teamId: team.id, userId: players[i].id, inGameRole: 'Captain' }));
  }

  const title = 'AIUB eFootball Cup';
  if (!(await tournaments.exists({ where: { title } }))) {
    await tournaments.save(
      tournaments.create({
        title,
        description: 'Sample single elimination tournament created by the seed script',
        gameId: eFootball.id,
        organizerId: organizer.id,
        format: TournamentFormat.SINGLE_ELIMINATION,
        maxTeams: 8,
        registrationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: TournamentStatus.OPEN,
      }),
    );
  }

  console.log('Seed completed.');
  console.log(`Admin:     ${config.get<string>('ADMIN_EMAIL')} / ${config.get<string>('ADMIN_PASSWORD')}`);
  console.log('Organizer: organizer@arenax.local / Organizer@123');
  console.log('Players:   player1@arenax.local ... player8@arenax.local / Player@123');
  await app.close();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
