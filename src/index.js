require("./Database/db");
const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");


const userManage = require("./routes/userManage");
const adminManage = require("./routes/adminManage");


app.use(express.static(__dirname + "/public"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        origin: ["http://localhost:5173", "http://192.168.123.222:5173", "https://main--radiant-nasturtium-e14351.netlify.app"],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true,
    })
);


const server = app.listen(5000, function () {
    console.log("Server is running on port 5000 ");
});

app.use("/api/v1/user",userManage)
app.use("/api/v1/admin",adminManage)
