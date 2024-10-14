const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const Schema = mongoose.Schema;

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    console.log("EXT", ext);

    // if (ext !== ".png") {
    //     return cb(new Error("Only Png file accepted"))
    // }

    const fileName = file.originalname + ".png";

    cb(null, fileName);
  },
});

const uploads = multer({
  storage: diskStorage,
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose
  .connect("mongodb://127.0.0.1:27017/guide")
  .then(() => console.log("connected!"))
  .catch((error) => console.log("error", error));

const saltRounds = 10;

const userSchema = new Schema({
  email: String,
  password: String,
  username: { type: String, required: true, unique: true },
});

const guideSchema = new Schema({
  tittel: String,
  tag: Array,
  overskrift: Array,
  beskrivelse: Array,
  bilde: Array,
  author: { type: String, required: true },
});

const User = mongoose.model("user", userSchema);
const UserGuide = mongoose.model("UserGuide", guideSchema);

app.get("/", async (req, res) => {
    const username = req.cookies.username;
    try {
        const guides = await UserGuide.find();
        res.render("index", { guides, username });
    } catch (error) {
        console.error("Error fetching guides:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/guides", async (req, res) => {
  try {
    const guides = await UserGuide.find();
    const username = req.cookies.username;
    res.render("guides", { guides, username });
  } catch (error) {
    console.error("Error fetching guides:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/guide", async (req, res) => {
    const username = req.cookies.username;
    res.render("guide", { username });
})

app.get("/login", (req, res) => {
  const username = req.cookies.username;
  res.render("login", { username });
});

app.get("/logout", (req, res) => {
    res.clearCookie("username");
    res.redirect("/");
  });

app.get("/register", (req, res) => {
  const username = req.cookies.username;
  res.render("register", { username });
});

app.get("/dashboard", async (req, res) => {
    const username = req.cookies.username;
  
    if (username === undefined) {
      res.status(401).send("Unauthorized");
      return;
    }
  
    try {
      const userGuides = await UserGuide.find({ author: username });
      res.render("dashboard", { guides: userGuides, username });
    } catch (error) {
      console.error("Error fetching user guides:", error);
      res.status(500).send("Internal Server Error");
    }
  });

app.get("/create", (req, res) => {
    const username = req.cookies.username;
    res.render("create", { username });});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  User.findOne({ email })
    .then((user) => {
      if (user) {
        bcrypt.compare(password, user.password).then((result) => {
          if (result) {
            res.cookie("username", user.username, { maxAge: 9000000, httpOnly: true });
            return res.redirect("/dashboard");
          } else {
            return res.status(401).send("Invalid password");
          }
        });
      } else {
        return res.status(404).send("User not found");
      }
    })
    .catch((error) => {
      console.log("error", error);
    });
});

app.post("/register", async (req, res) => {
  console.log("Registering a new account", req.body);

  const { email, password, Rpassword, username } = req.body;

  if (password === Rpassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hash = await bcrypt.hash(password, saltRounds);
    const newUser = new User({
      email: email,
      password: hash,
      username: username,
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
  const author = req.cookies.username

  const newUserGuide = new UserGuide({
    tittel: req.body.Tittel,
    tag: req.body.Tag,
    overskrift: req.body.Overskrift,
    beskrivelse: req.body.Beskrivelse,
    bilde: req.files.map((file) => file.filename),
    author: author,
  });

  try {
    const result = await newUserGuide.save();
    console.log("Guide saved:", result);
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error saving guide:", error);
    res.status(500).send("Error saving guide");
  }
});

app.get("/guide/:id", async (req, res) => {
    const { id } = req.params;
    const username = req.cookies.username;
    try {
        const guide = await UserGuide.findById(id);
        if (guide === undefined) {
            return res.status(404).send("Guide not found");
        }
        res.render("guide", { guide, username });
    } catch (error) {
        console.error("Error fetching guide details:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/edit-guide/:id", async (req, res) => {
    try {
        const guide = await UserGuide.findById(req.params.id);
        if (guide.author === req.cookies.username) {
            return res.status(403).send("Forbidden");
        }
        const username = req.cookies.username;
        res.render("edit-guide", { guide, username });
    } catch (error) {
        console.error("Error fetching guide for editing:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Handle edit form submission
app.post("/edit-guide/:id", uploads.array("photo"), async (req, res) => {
    const { Tittel, Tag, Overskrift, Beskrivelse } = req.body;
    const updateData = {
        tittel: Tittel,
        tag: Tag,
        overskrift: Overskrift,
        beskrivelse: Beskrivelse,
        bilde: req.files ? req.files.map(file => file.filename) : []
    };

    try {
        const guide = await UserGuide.findById(req.params.id);
        if (guide.author === req.cookies.username) {
            return res.status(403).send("Forbidden");
        }
        
        await UserGuide.findByIdAndUpdate(req.params.id, updateData);
        res.redirect("/guides");
    } catch (error) {
        console.error("Error updating guide:", error);
        res.status(500).send("Error updating guide");
    }
});

app.post("/delete-guide/:id", async (req, res) => {
    try {
        const guide = await UserGuide.findById(req.params.id);
        if (guide.author === req.cookies.username) {
            return res.status(403).send("Forbidden");
        }

        await UserGuide.findByIdAndDelete(req.params.id);
        res.redirect("/");
    } catch (error) {
        console.error("Error deleting guide:", error);
        res.status(500).send("Error deleting guide");
    }
});

app.listen(process.env.PORT);