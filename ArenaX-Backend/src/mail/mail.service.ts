import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('MAIL_HOST');
    const user = this.configService.get<string>('MAIL_USER');
    this.from = this.configService.get<string>('MAIL_FROM');
    this.transporter =
      host && user
        ? nodemailer.createTransport({
            host,
            port: this.configService.get<number>('MAIL_PORT'),
            auth: { user, pass: this.configService.get<string>('MAIL_PASS') },
          })
        : null;
  }

  send(to: string | string[], subject: string, html: string) {
    if (!this.transporter) {
      this.logger.log(`Mail is not configured, skipped "${subject}" to ${[].concat(to).join(', ')}`);
      return;
    }
    this.transporter
      .sendMail({ from: this.from, to, subject, html })
      .then(() => this.logger.log(`Sent "${subject}" to ${[].concat(to).join(', ')}`))
      .catch((error) => this.logger.warn(`Could not send "${subject}": ${error.message}`));
  }

  sendRegistrationDecision(to: string, teamName: string, tournamentTitle: string, status: string) {
    const approved = status === 'APPROVED';
    this.send(
      to,
      `ArenaX: registration ${approved ? 'approved' : 'rejected'} for ${tournamentTitle}`,
      `<p>Hello captain,</p>
       <p>Your team <b>${teamName}</b> has been <b>${status.toLowerCase()}</b> for <b>${tournamentTitle}</b>.</p>
       <p>${approved ? 'Get ready for the bracket!' : 'You can contact the organizer for details.'}</p>
       <p>ArenaX Team</p>`,
    );
  }

  sendMatchScheduled(
    to: string[],
    tournamentTitle: string,
    teamA: string,
    teamB: string,
    scheduledAt: Date,
  ) {
    this.send(
      to,
      `ArenaX: match scheduled in ${tournamentTitle}`,
      `<p>Hello captain,</p>
       <p>The match <b>${teamA}</b> vs <b>${teamB}</b> in <b>${tournamentTitle}</b>
       is scheduled for <b>${scheduledAt.toUTCString()}</b>.</p>
       <p>ArenaX Team</p>`,
    );
  }
}
