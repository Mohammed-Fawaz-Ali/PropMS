const nodemailer = require('nodemailer');

const sendWelcomeEmail = async (to, name, propertyName, loginEmail, password) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const info = await transporter.sendMail({
            from: `"PropMS System" <${process.env.SMTP_USER}>`,
            to: to,
            subject: `Welcome to your new home at ${propertyName || 'PropMS'}!`,
            text: `Hello ${name},\n\nYour landlord has successfully onboarded you to the official PropMS Tenant Portal.\nYou can safely log in at: https://app.propms.io/login\n\nYour Credentials:\nUsername: ${loginEmail}\nPassword: ${password}\n\nPlease log in immediately. Your landlord has required that you review and digitally E-Sign the master lease before getting access to your dashboard.\n\nWelcome home,\nThe PropMS System`,
            html: `
              <div style="font-family: sans-serif; color: #333; max-w-lg mx-auto p-4">
                  <h2 style="color: #4f46e5;">Welcome Home!</h2>
                  <p>Hello <b>${name}</b>,</p>
                  <p>Your landlord has successfully onboarded you to the official PropMS Tenant Portal for <b>${propertyName || 'your new unit'}</b>.</p>
                  <br/>
                  <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px;">
                      <h4 style="margin-top:0;">Your Login Credentials:</h4>
                      <p><b>Username:</b> ${loginEmail}</p>
                      <p><b>Password:</b> ${password}</p>
                  </div>
                  <br/>
                  <p>Please log in at <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login">your tenant portal</a> immediately to review and securely E-Sign your master lease.</p>
                  <p>Welcome home,<br/><b>The PropMS System</b></p>
              </div>
            `
        });

        console.log("Email sent successfully: ", info.messageId);
        return true;
    } catch(err) {
        console.error("Failed to route dispatch: ", err);
        return false;
    }
}

const sendPaymentAlertEmail = async (to, name, amount, forMonthStr, dueDateStr) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });

        const info = await transporter.sendMail({
            from: `"PropMS System" <${process.env.SMTP_USER}>`,
            to: to,
            subject: `Action Required: New Rent Bill Pending - PropMS`,
            html: `
              <div style="font-family: sans-serif; color: #333; max-width: 500px; margin: 0 auto; p-4 border: 1px solid #e2e8f0; border-radius: 8px;">
                  <h2 style="color: #4f46e5;">Pending Payment Alert</h2>
                  <p>Hello <b>${name}</b>,</p>
                  <p>Your property owner has successfully generated a new rent invoice via the PropMS System.</p>
                  <br/>
                  <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px;">
                      <p><b>Amount Due:</b> ₹${amount}</p>
                      <p><b>Billing Cycle:</b> ${forMonthStr}</p>
                      <p><b>Due Date:</b> ${dueDateStr}</p>
                  </div>
                  <br/>
                  <p>Please log in to your portal immediately to view the detailed ledger or initiate payment.</p>
                  <p>Thank you,<br/><b>The PropMS System</b></p>
              </div>
            `
        });
        return true;
    } catch(err) {
        console.error("Failed to push dispatch: ", err);
        return false;
    }
}

const sendLeaseNoticeEmail = async (to, name, endDateStr, ownerName) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });

        await transporter.sendMail({
            from: `"PropMS System" <${process.env.SMTP_USER}>`,
            to: to,
            subject: `Action Required: Lease Ending - PropMS`,
            html: `
              <div style="font-family: sans-serif; color: #333; max-width: 500px; margin: 0 auto; p-4 border: 1px solid #e2e8f0; border-radius: 8px;">
                  <h2 style="color: #4f46e5;">Lease Termination Alert</h2>
                  <p>Hello <b>${name}</b>,</p>
                  <p>This is an official notice that your current lease agreement is scheduled to end on <b>${endDateStr}</b>.</p>
                  <br/>
                  <div style="background-color: #fff7ed; padding: 15px; border-radius: 8px; border: 1px solid #ffedd5;">
                      <p style="color: #9a3412; font-weight: bold; margin-top:0;">Lease End Date: ${endDateStr}</p>
                      <p style="color: #9a3412; margin-bottom:0;">Please reach out to <b>${ownerName}</b> to discuss renewal options or move-out procedures.</p>
                  </div>
                  <br/>
                  <p>Thank you,<br/><b>The PropMS System</b></p>
              </div>
            `
        });
        return true;
    } catch(err) {
        console.error("Lease notice dispatch failed: ", err);
        return false;
    }
}

const sendOwnerContactEmail = async (to, ownerName, tenantName, tenantEmail, tenantPhone, unitNumber, propertyName, message) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });

        await transporter.sendMail({
            from: `"PropMS System" <${process.env.SMTP_USER}>`,
            to,
            subject: `Tenant Help Request from ${tenantName || 'a tenant'}`,
            html: `
              <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                  <h2 style="color: #4f46e5;">Tenant Support Request</h2>
                  <p>Hello <b>${ownerName}</b>,</p>
                  <p>Your tenant has asked for help and needs you to respond as soon as possible.</p>
                  <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <p><b>Tenant Name:</b> ${tenantName}</p>
                      <p><b>Tenant Email:</b> ${tenantEmail}</p>
                      <p><b>Tenant Phone:</b> ${tenantPhone}</p>
                      <p><b>Property unit:</b> ${propertyName} / ${unitNumber}</p>
                  </div>
                  <h4 style="margin-bottom: 8px;">Message from tenant:</h4>
                  <p style="background-color: #fff; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">${message}</p>
                  <p style="margin-top: 20px;">Please respond directly to the tenant using the email address above.</p>
                  <p>Regards,<br/><b>The PropMS System</b></p>
              </div>
            `
        });

        return true;
    } catch(err) {
        console.error("Support email dispatch failed: ", err);
        return false;
    }
}

module.exports = {
    sendWelcomeEmail,
    sendPaymentAlertEmail,
    sendLeaseNoticeEmail,
    sendOwnerContactEmail
};
