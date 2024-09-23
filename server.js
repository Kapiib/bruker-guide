const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bcrpyt = require("bcrypt")
const multer = require("multer")
const path = require("path")
require("dotenv").config();

const Schema = mongoose.Schema;

const diskStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./uploads")
    },

    filename: function(req, file, cb) {
        const ext = path.extname(file.originalname);
        console.log("EXT", ext)

        // if (ext !== ".png") {
        //     return cb(new Error("Only Png file accepted"))
        // }

        const fileName = file.originalname + ".png"

        cb(null, fileName)
    }
})

const uploads = multer({
    storage: diskStorage,
})


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

app.get("/create", (req, res) => {
    res.render("create");
})

app.listen(process.env.PORT);

app.post("/login", (req, res) => {
    console.log("Logging in", req.body);
    const {email, password} = req.body;

    User.findOne({email: email}).then((user) => {
        console.log("results", user)

        bcrypt.compare(password, user.password).then((result) => {
            console.log(result);
            if(result) {
                res.status(200).redirect("/dashboard");
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
const BrukerGuide = mongoose.model("")

app.post("/create", uploads.array("photo"), (req, res) => {
 
    console.log(req.body, "BODY")
    console.log(req.body, "FILES")


})