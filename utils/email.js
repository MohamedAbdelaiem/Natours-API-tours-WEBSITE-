const nodemailer=require('nodemailer');
const pug=require('pug');
const {convert}=require('html-to-text');
const Transport = require("nodemailer-brevo-transport");

module.exports=class Email{
    constructor(user,url){
        this.to=user.email;
        this.firstName=user.name.split(' ')[0];
        this.url=url;
        this.from=`Mohamed Abdelaziem <${process.env.EMAIL_FROM}>`;
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            // Use Brevo (Sendinblue) for production
            return nodemailer.createTransport(
                new Transport({
                    apiKey: process.env.BREVO_API_KEY,  // Your Brevo API key
                })
            );
        }
    
        // For development, use Brevo or a different transport like SMTP
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    async send(template,subject){
        //1)render HTML based on a pug template
        let html;
        try {
                html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
                firstName: this.firstName,
                url: this.url,
                subject,
            });
        } catch (err) {
            console.log('Error rendering the Pug template:', err);
        }
        //2)define the email options
        const mailOptions={
            from:this.from,
            to:this.to,
            subject,
            text:convert(html),
            html,
        }

        //3)create a transport and send email
        try {
            await this.newTransport().sendMail(mailOptions);
            console.log('Email sent successfully');
        } catch (error) {
            console.error('Error sending email:', error);
        }
        
    }

    async sendWelcome(){
        await this.send('welcome','Welcome to the natours family!');
    }

    async sendPasswordReset(){
        await this.send('passwordReset','Your password reset token (valid for only 10 minutes)');
    }
}

