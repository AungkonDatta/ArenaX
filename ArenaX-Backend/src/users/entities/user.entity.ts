import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 150, unique: true })
  email: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: Role, enumName: 'user_role', default: Role.PLAYER })
  role: Role;

  @Column({ name: 'student_id', type: 'varchar', length: 20, nullable: true })
  studentId: string | null;

  @Column({ name: 'in_game_name', type: 'varchar', length: 50, nullable: true })
  inGameName: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}