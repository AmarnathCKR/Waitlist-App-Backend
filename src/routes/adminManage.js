const router = require("express").Router();
const User = require("../Database/userSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userValidate = require("../middlewares/userValidater");
const userAuth = require("../middlewares/userAuth");
const { emailSender } = require("../helper/emailSender");


router.get("/all", async (req, res) => {
    await User.find({}).sort({ position: 1 })
        .then((result) => {
            res.send(result);
        })
})

router.post("/update", async (req, res) => {
    const { newPosition, userId } = req.body;
    try {
        const userToMove = await User.findById(userId);

        if (!userToMove) {
            console.error("User not found");
            return res.status(500).send({ error: "invalid email or password" });
        }

        if (newPosition <= 0) {
            console.error("Invalid position");
            return res.status(500).send({ error: "invalid email or password" });
        }

        if (newPosition > userToMove.position) {
            await User.updateMany(
                { position: { $gt: userToMove.position, $lte: newPosition } },
                { $inc: { position: -1 } }
            );
        } else if (newPosition < userToMove.position) {
            await User.updateMany(
                { position: { $lt: userToMove.position, $gte: newPosition } },
                { $inc: { position: 1 } }
            );
        }

        userToMove.position = newPosition;
        await userToMove.save();
        console.log(`User with ID ${userId} moved to position ${newPosition}`);

        console.log(`Sending notification to user with ID ${userId}`);

        res.send(userId);


    } catch (error) {
        console.error("Error moving user position:", error);
        return res.status(500).send({ error: "invalid email or password" })
    }
})

router.get("/delete", async (req,res)=>{
    await User.findByIdAndDelete({_id:req.query.refId})
    .then((result)=>{
        res.send(result);
    }).catch((err)=>{
        return res.status(500).send({error : "Server error"});
    })
})






module.exports = router;