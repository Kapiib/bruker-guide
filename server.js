const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrpyt = require("bcrypt")
require("dotenv").config();


app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

mongoose.connect("mongodb://127.0.0.1:27017/guide")
.then(() => console.log("connected!"))
.catch((error) => console.log("error", error));

const saltRounds = 10;

app.get("/", (req, res) => {
    res.render("index");
})

app.get("/guide", (req, res) => {
    res.render("guide");
})

app.get("/login", (req, res) => {
    res.render("login");
})

app.get("/register", (req, res) => {
    res.render("register");
})

app.get("/dashboard", (req, res) => {
    res.render("dashboard");
})

app.listen(process.env.PORT);

app.post("/login", (req, res) => {
    console.log("Logging in", req.body);
    const {email, password} = req.body;

    User.findOne({email: email}).then((user) => {
        console.log("results", user)

        bcrpyt.compare(password, user.password).then((result) => {
            console.log(result);
            if(result) {
                res.status(200).redirect("/dashboard");
            } else {
                res.status(500).json({message: "lalala"})
            }
        })

    }).catch((error) => {
        console.log("error", error)
    })
})

app.post("/register", async (req, res) => {
    console.log("Making an account", req.body);

    const { email, password, Rpassword } = req.body;

    if (password == Rpassword) {

        bcrpyt.hash(password, saltRounds, async function(error, hash) {

            const {mail, password, Rpassword} = req.body;
            const newUser = new User({email: email, password: hash})
            const result = await newUser.save();
            console.log(result);
    
                if(result._id) {
                res.redirect("/login");
                }
        })
    } else {
        res.status(500).json({message:"Passwords do not match"})
    }
})


const userSchema = new Schema({
    email: String,
    password: String
})

const User = mongoose.model("user", userSchema);