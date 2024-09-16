const express = require("express");
const app = express();
require("dotenv").config();


app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get("/", (req, res) => {
    res.render("index")
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

app.listen(process.env.PORT);

app.post("/login", (req, res) => {
    console.log("Logging in", req.body);
    const {email, password} = req.body;

    console.log(email)
})

app.post("/register", (req, res) => {
    console.log("Making an account", req.body);

})