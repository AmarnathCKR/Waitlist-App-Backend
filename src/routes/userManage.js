const router = require("express").Router();
const User = require("../Database/userSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userValidate = require("../middlewares/userValidater");
const userAuth = require("../middlewares/userAuth");

const createToken = (_id) => {
    return jwt.sign({ _id }, "secretkey");
};

const updatePositionOnReferral = async (referringUserId, referral) => {
    try {
        const referringUser = await User.findById(referringUserId);

        if (!referringUser) {
            return false; // Return false to indicate an error.
        }

        const newPosition = referringUser.position;
        const newPositionAbove = newPosition - 1;

        const userAbove = await User.findOne({ position: newPositionAbove });

        await User.findByIdAndUpdate(referringUserId, { position: newPositionAbove });

        if (userAbove) {
            // Update the position of the user above to move them down.
            await User.findByIdAndUpdate(userAbove._id, { position: newPosition });

            // Log the position change for the user above.
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

        return true; // Return true to indicate success.
    } catch (error) {
        console.error("Error:", error);
        return false; // Return false to indicate an error.
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
        const newUser = new User({
            name,
            email,
            password: hashPassword,
            position: highestPosition  ? highestPosition + 1 : 100,
            logs: [],
        });

        await newUser.save();

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
    await User.findOne({ _id: id })
        .then((user) => {
            res.status(200).send(user)

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