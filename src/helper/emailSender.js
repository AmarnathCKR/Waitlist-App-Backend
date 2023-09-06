const nodemailer = require("nodemailer");


module.exports.emailSender = (email,html,subject)=>{
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.NODEMAIL,
          pass: process.env.NODEMAIL_PASSWORD,
        },
      });

      let mailOptions = {
        from: "amarnathchakkiyar@gmail.com",
        to: email,
        subject: subject,

        html: html,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          
          return res.status(409).send({ data: "mail send failed" });
        } else {
          return info;
        }
      });

}