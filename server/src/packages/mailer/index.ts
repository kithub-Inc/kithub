import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export class Mailer {
    private transporter: nodemailer.Transporter;

    public constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.GOOGLE_APP_EMAIL,
                pass: process.env.GOOGLE_APP_KEY
            },
        });
    }

    public async send(options: nodemailer.SendMailOptions) {
        await this.transporter.sendMail(options);
    }
}
