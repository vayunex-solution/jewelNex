export interface MailOptions {
    to: string;
    subject: string;
    html: string;
}
export declare const sendMail: (options: MailOptions) => Promise<void>;
//# sourceMappingURL=mailer.d.ts.map