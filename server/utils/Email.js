const nodemailer = require('nodemailer');
const { createEvent } = require('ics');
const { formatToHHMM, formatDateToString } = require('./utils');

module.exports = class Email {
    constructor(user, host = null) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.from = `Calandar ${host?.email || '' }`;
        this.host = host
    }

    newTransporter() {
        if (process.env.NODE_ENV === 'production') {
            return nodemailer.createTransport({
                host: process.env.SENDINBLUE_HOST,
                port: process.env.SENDINBLUE_PORT,
                auth: {
                    user: process.env.SENDINBLUE_LOGIN,
                    pass: process.env.SENDINBLUE_PASSWORD,
                },
            });
        }

        return nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: process.env.MAILTRAP_PORT,
            auth: {
                user: process.env.MAILTRAP_USERNAME,
                pass: process.env.MAILTRAP_PASSWORD,
            }
        });
    }

    #buildDateArray(dateStr, timeStr) {
        const inputDate = new Date(dateStr)
        const sqlDate = inputDate.toISOString().split('T')[0];
        const [year, month, day] = sqlDate.split('-').map(Number);
        const [hour, minute] = timeStr.split(':').map(Number);
        return [year, month, day, hour, minute];
    }

    
async send(subject, message, html, icsContent = null, icsFilename = 'invite.ics') {
    const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        text: message,
    };

    if (html) {
        mailOptions.html = html;
    }

    if (icsContent) {
        const icsBuffer = Buffer.from(icsContent);

        mailOptions.attachments = [{
            filename: icsFilename,
            content: icsBuffer,
            contentType: 'text/calendar'
        }];

        mailOptions.alternatives = [{
            contentType: 'text/calendar; method=REQUEST; charset=UTF-8',
            contentDisposition: 'inline',
            content: icsBuffer.toString('base64'),
            contentEncoding: 'base64'
        }];
    }

    await this.newTransporter().sendMail(mailOptions);
}




    /** the params are: meeting: {mid, title, start_time, end_time, date, location, message, attendees} */
    async sendScheduledMeeting(meeting) {
        let { mid, title, start_time, end_time, date, location, message, attendees } = meeting;

        
    start_time = formatToHHMM(start_time)
    end_time = formatToHHMM(end_time)

    if(!this.host){
        throw new Error("You must provide a host")
    }
        const event = {
            start: this.#buildDateArray(date, start_time),
            end: this.#buildDateArray(date, end_time),
            title: title,
            description: message || '',
            location: location === 'phone' ? 'Phone Call' : 'In-person',
            status: 'CONFIRMED',
            uid: `${mid}-${this.to}`,
            organizer: this.host,
            attendees: attendees || [{ name: this.firstName, email: this.to }]
        };

        createEvent(event, async (err, value) => {
            if (err) {
                console.error('ICS error:', err);
                return;
            }


            const html = `
                <p style="direction: ltr; text-align:left; font-size: 15px">
                    You scheduled a meeting: <strong>${title}</strong><br/>
                    Host: ${this.host.name}<br/>
                    Date: ${formatDateToString(date)}<br/>
                    Time: ${start_time} - ${end_time}<br/>
                    Location: ${location}<br/>
                    Please cancel at least 24 hours in advance if you can't attend.
                </p>`;

           await this.send(
            `Meeting Scheduled: ${title}`,
            '',
            html,
            value,
            `${title}.ics`
        );
        });
    }

    /** the params are: meeting: {mid, title, start_time, end_time, date, location, message, toEmails}. it emails all the invitees */
   async sendCanceledMeeting(meeting) {
    let { mid, title, start_time, end_time, date, location, message, toEmails } = meeting;

    start_time = formatToHHMM(start_time)
    end_time = formatToHHMM(end_time)

      if(!this.host){
        throw new Error("You must provide a host")
    }

    for (let user of toEmails) {
        const email = user.email;
        const firstName = user.name.split(' ')[0];

        const event = {
            start: this.#buildDateArray(date, start_time),
            end: this.#buildDateArray(date, end_time),
            title: title,
            description: message || '',
            location: location === 'phone' ? 'Phone Call' : 'In-person',
            status: 'CANCELLED',
            uid: `${mid}-${email}`,
            organizer: this.host,
            attendees: [{ name: firstName, email }]
        };

        createEvent(event, async (err, value) => {
            if (err) {
                console.error('ICS error:', err);
                return;
            }

            const html = `
                <p style="direction: ltr; text-align:left; font-size: 15px">
                    Hello ${firstName},<br/>
                    The meeting <strong>${title}</strong> with ${this.host.name} scheduled for ${formatDateToString(date)} (${start_time} - ${end_time}) has been 
                    <strong>cancelled</strong>.
                </p>`;

            const emailInstance = new Email(user);
            await emailInstance.send(
                `Meeting Canceled: ${title}`,
                '',
                html,
                value,
                `${title}_canceled.ics`
            );
        });
    }
}

    async sendWelcomeMeetingUser() {
        const html = `
            <p style="direction: ltr; text-align:left; font-size: 15px">
                Hello ${this.firstName},<br/><br/>
                Welcome to <strong>Calandar</strong>!<br/>
                You can now schedule meetings, manage your availability, and stay on top of your time.<br/>
            </p>`;

        await this.send("Welcome to FitMe - Your scheduling assistant", "", html);
}

};
