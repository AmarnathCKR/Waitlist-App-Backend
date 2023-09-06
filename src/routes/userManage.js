const router = require("express").Router();
const User = require("../Database/userSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userValidate = require("../middlewares/userValidater");
const userAuth = require("../middlewares/userAuth");
const { emailSender } = require("../helper/emailSender");

const createToken = (_id) => {
    return jwt.sign({ _id }, "secretkey");
};

const updatePositionOnReferral = async (referringUserId, referral) => {
    try {
        console.log("refered");
        const referringUser = await User.findById(referringUserId);

        if (!referringUser) {
            return false;
        }

        const newPosition = referringUser.position;
        const newPositionAbove = newPosition - 1;
        if (newPositionAbove === 1) {
             const html = `<html>
             <head>
               <style>
                 body {
                   font-family: Arial, sans-serif;
                   background-color: #f0f0f0;
                   padding: 20px;
                 }
           
                 h1 {
                   color: #ff6600;
                   text-align: center;
                 }
           
                 p {
                   font-size: 18px;
                   color: #333;
                   text-align: center;
                 }
           
                 .coupon {
                   background-color: #ff6600;
                   color: #fff;
                   font-size: 24px;
                   text-align: center;
                   padding: 10px;
                   border-radius: 5px;
                 }
               </style>
             </head>
             <body>
               <h1>Congrats you won the waitlist</h1>
               <p>Here's your coupon code to purchase the iPhone 18:</p>
               <div class="coupon">
                 <strong>Coupon Code: MSDSI22HHD</strong> 
               </div>
             </body>
           </html>
           `
           const succes = await emailSender(referringUser.email,html,"Your purchase coupon");
           console.log(succes);

        }

        const userAbove = await User.findOne({ position: newPositionAbove });

        await User.findByIdAndUpdate(referringUserId, { position: newPositionAbove });

        if (userAbove) {
            await User.findByIdAndUpdate(userAbove._id, { position: newPosition });

            await User.findByIdAndUpdate(userAbove._id, {
                $push: {
                    logs: {
                        event: "fallback",
                        refId: referringUserId,
                    },
                },
            });
        }

        await User.findByIdAndUpdate(referringUserId, {
            $push: {
                logs: {
                    event: "referral",
                    refId: referral,
                },
            },
        });

        return true;
    } catch (error) {
        console.error("Error:", error);
        return false;
    }
};

router.post("/signup", userValidate, async (req, res) => {
    const { name, email, password, refId } = req.body;


    try {
        const user = await User.findOne({ email: email });

        if (user) {
            console.log("User already exists");
            return res.status(400).json({ error: "User already exists" });
        }

        const highestPositionUser = await User.findOne({}, {}, { sort: { 'position': -1 } });
        const highestPosition = highestPositionUser ? highestPositionUser.position : 0;

        const hashPassword = await bcrypt.hash(password, 10);
        let newUser;
        if (refId) {
            newUser = new User({
                name,
                email,
                password: hashPassword,
                position: highestPosition ? highestPosition + 1 : 99,
                logs: [],
                refered: true,
            })
        } else {
            newUser = new User({
                name,
                email,
                password: hashPassword,
                position: highestPosition ? highestPosition + 1 : 99,
                logs: [],
                refered: false,
            })
        }

        await newUser.save();
        let html = `<html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f0f0f0;
              padding: 20px;
            }
      
            h1 {
              color: #ff6600;
              text-align: center;
            }
      
            p {
              font-size: 18px;
              color: #333;
              text-align: center;
            }
      
            .coupon {
              background-color: #ff6600;
              color: #fff;
              font-size: 24px;
              text-align: center;
              padding: 10px;
              border-radius: 5px;
            }
      
            .share-link {
              display: block;
              background-color: #007bff;
              color: #fff;
              font-size: 18px;
              text-align: center;
              padding: 10px;
              border-radius: 5px;
              text-decoration: none;
              text-align: center;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <h1>Welcome to the iPhone 18 Pro Waitlist!</h1>
          <p>Hello <span class="username">${newUser.name}</span>,</p>
          <p>Your email (<span class="useremail">${newUser.email}</span>) has been added to the waitlist at position <span class="position">${newUser.position}</span>.</p>
          <p>Stay tuned for updates on the iPhone 18 Pro release!</p>
          <p>Please copy and Share your referral link with friends:</p>
          <a class="share-link" href='http://localhost:5173/referral/${newUser._id}'>http://localhost:5173/referral/${newUser._id}</a>
        </body>
      </html>`
        await emailSender(newUser.email,html,"Welcome to the waitlist");

        if (refId) {
            await updatePositionOnReferral(refId, newUser._id);
            const userId = newUser._id;
            const token = await createToken(userId);

            return res.status(200).json({ token });
        }

        const userId = newUser._id;
        const token = await createToken(userId);

        return res.status(200).json({ token });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Server error" });
    }
});

router.get("/verifytoken", userAuth, async (req, res) => {
    const { id } = req.params;
   
    await User.findOne({ _id: id }).populate('logs.refId', 'name')
        .then((user) => {
            res.status(200).send(user)

        }).catch((err) => {
            res.status(404).send({ error: err });
        })
})
router.get("/check-ref", async (req, res) => {
    const { id } = req.query;
   
    await User.findOne({ _id: id })
        .then((user) => {
            res.status(200).send(user.name)

        }).catch((err) => {
            res.status(404).send({ error: err });
        })
})

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    await User.findOne({ email }).then(async (user) => {
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            const token = await createToken(user._id);
            console.log(token)
            res.status(200).json({ token });
        } else {
            res.status(400).send({ error: "invalid email or password" });
        }
    }).catch((err) => {
        res.status(400).send({ error: "invalid email or password" });
    })
})


module.exports = router;