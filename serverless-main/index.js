const formData = require('form-data');
const Mailgun = require('mailgun.js');
const User = require('./userSchema');
const dotenv=require('dotenv');

dotenv.config();


const mailgunFormData = new Mailgun(formData);
const mailgunClient = mailgunFormData.client({
  username: 'api',
  key:  process.env.MAILGUN_API_KEY,
});

exports.sendemail = async (event) => {
  console.log("trying");
  try {
    console.log("extracting message from pubsub");
    const pubSubmessage = event.data
      ? Buffer.from(event.data, 'base64').toString()
      : '{}';
    const payload = JSON.parse(pubSubmessage);

    const userEmailAddress = payload.username;
    const userId=payload.id;
    const verificationLink=`https://${process.env.DOMAIN_NAME}/v1/user/verify?id=${userId}`;
    console.log(verificationLink);

    const mailOptions = {
      from: '<mailgun@amreshdev.me>',
      to: [userEmailAddress],  
      subject: 'Email Verification',
      text: 'Please verify your email address.',
      html: `<p>Verify your email address: <a href="${verificationLink}">link</a></p>`,
    };


    const response = await mailgunClient.messages.create(process.env.DOMAIN_NAME, mailOptions);
    console.log('Email Succefully sent:', response);
    if (response.id) {
 
      const user = await User.findOne({ where: { username: userEmailAddress } });
      if (user) {
        await user.update({ token_sent_timestamp: new Date() });
        console.log('User updated with token_sent_timestamp:', user.toJSON());
      } else {
        console.log('User not found.');
      }
    } else {
      console.log('Email sending failed.');
    }
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};