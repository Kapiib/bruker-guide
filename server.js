const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const path = require("path");
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
app.use(cookieParser());

mongoose.connect("mongodb://127.0.0.1:27017/guide")
.then(() => console.log("connected!"))
.catch((error) => console.log("error", error));

const saltRounds = 10;

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const guideSchema = new Schema({
    tittel: String,
    tag: Array,
    overskrift: Array,
    beskrivelse: Array,
    bilde: Array,
    authorEmail: String,
})

const User = mongoose.model("user", userSchema);
const UserGuide = mongoose.model("UserGuide", guideSchema)

app.get("/", (req, res) => {
    res.render("index");
})

app.get("/guide", async (req, res) => {
    try {
        const guides = await UserGuide.find();
        res.render("guide", { guides });
    } catch (error) {
        console.error("Error fetching guides:", error);
        res.status(500).send("Internal Server Error");
    }
});

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
    const { email, password } = req.body;

    User.findOne({ email }).then((user) => {
        if (user) {
            bcrypt.compare(password, user.password).then((result) => {
                if (result) {
                    // Set a cookie with the user's email
                    res.cookie('userEmail', email, { maxAge: 900000, httpOnly: true });
                    return res.redirect("/dashboard");
                } else {
                    return res.status(401).send("Invalid password");
                }
            });
        } else {
            return res.status(404).send("User not found");
        }
    }).catch((error) => {
        console.log("error", error);
        res.status(500).send("Internal Server Error");
    });
});


app.post("/register", async (req, res) => {
    console.log("Registering a new account", req.body);

    const { email, password, Rpassword, username } = req.body;

    if (password !== Rpassword) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    try {
        // Check if the username already exists
        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        // Hash the password and save the new user
        const hash = await bcrypt.hash(password, saltRounds);
        const newUser = new User({
            email: email,
            password: hash,
            username: username
        });

        const result = await newUser.save();
        console.log("New user created:", result);
        res.redirect("/login");
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Error creating user" });
    }
});

app.post("/create", uploads.array("photo"), async (req, res) => {
    const { Tittel, Tag, Overskrift, Beskrivelse, username } = req.body;

    const newUserGuide = new UserGuide({
        tittel: req.body.Tittel,  
        tag: req.body.Tag,
        overskrift: req.body.Overskrift,
        beskrivelse: req.body.Beskrivelse,
        bilde: req.files.map(file => file.filename),
        author: username
    });

    try {
        const result = await newUserGuide.save();
        console.log("Guide saved:", result);
        res.redirect("/guide");
    } catch (error) {
        console.error("Error saving guide:", error);
        res.status(500).send("Error saving guide");
    }
});