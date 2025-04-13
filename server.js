const morgan = require("morgan");
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;

app.use(morgan("dev"));
app.use(express.json())
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); 


app.get("/", (req, res) => {
    res.render("home");
});


app.get("/users", (req, res) => {
    fs.readFile("user.json", "utf8", (err, data) => {
        if (err) {
            return res.status(500).send("Error reading user data");
        }
        const users = JSON.parse(data); 
        res.render("users", { users }); 
    });
});


app.get("/contact", (req, res) => {
    res.render("contact");
});
app.get("/about", (req, res) => {
    res.render("about");
});


app.post("/contact", (req, res) => {
    console.log("Inside /contact POST request");
    
    let users = [];
    try {
        let data = fs.readFileSync("User.json", "utf8");
        if (data) {
            users = JSON.parse(data);
        }
    } catch (err) {
        console.error("Error reading file:", err);
    }
    
    users.push(req.body);
    
    fs.writeFile("User.json", JSON.stringify(users, null, 2), (err) => {
        if (err) {
            console.error("Error writing file:", err);
            return res.status(500).send("Server Error");
        }
        console.log("User data inserted successfully");
        res.render("success", { message: "Registration successful!", redirect: true });
    });
});


const EVENTS_FILE = "events.json";

function readEvents() {
    try {
        const data = fs.readFileSync(EVENTS_FILE, "utf8");
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}


function writeEvents(events) {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
}




app.get("/events", (req, res) => {
    fs.readFile("events.json","utf-8",(err,data)=>{
        const events = JSON.parse(data) || []; 
        res.render("./events/index", { "events":events });
    })
});


app.get("/events/new", (req, res) => {
    res.render("events/new");
});

app.post("/events", (req, res) => {
    const events = readEvents();
    const newEvent = {
        id: Date.now().toString(), 
        title: req.body.title,
        description: req.body.description,
        date: req.body.date,
        host: req.body.host,
        attendees: req.body.attendees,
    };
    events.push(newEvent);
    writeEvents(events);
    res.redirect("/events");
});

// PUT - Replace an existing event
app.put("/events/:id", (req, res) => {
    const events = readEvents();
    const index = events.findIndex(e => e.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: "Event not found" });
    }

    const updatedEvent = {
        id: req.params.id,
        title: req.body.title,
        description: req.body.description,
        date: req.body.date,
        host: req.body.host,
        attendees: req.body.attendees
    };

    events[index] = updatedEvent;
    writeEvents(events);
    res.json({ message: "Event replaced successfully", event: updatedEvent });
});


app.patch("/events/:id", (req, res) => {
    const events = readEvents();
    const index = events.findIndex(e => e.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: "Event not found" });
    }

    events[index] = { ...events[index], ...req.body };
    writeEvents(events);
    res.json({ message: "Event updated successfully", event: events[index] });
});


app.delete("/events/:id", (req, res) => {
    let events = readEvents();
    const exists = events.some(e => e.id === req.params.id);
    if (!exists) {
        return res.status(404).json({ error: "Event not found" });
    }

    events = events.filter(e => e.id !== req.params.id);
    writeEvents(events);
    res.json({ message: "Event deleted successfully" });
});


app.get("/events/:id/edit", (req, res) => {
    const events = readEvents();
    const event = events.find((e) => e.id === req.params.id);
    if (!event) {
        return res.status(404).send("Event not found");
    }
    res.render("events/edit", { event });
});


app.post("/events/:id", (req, res) => {
    const events = readEvents();
    const eventIndex = events.findIndex((e) => e.id === req.params.id);
    if (eventIndex === -1) {
        return res.status(404).send("Event not found");
    }
    events[eventIndex] = {
        ...events[eventIndex],
        title: req.body.title,
        description: req.body.description,
        date: req.body.date,
        host: req.body.host,
        attendees: req.body.attendees,
    };
    writeEvents(events);
    res.redirect("/events");
});

app.post("/events/:id/delete", (req, res) => {
    let events = readEvents();
    events = events.filter((e) => e.id !== req.params.id);
    writeEvents(events);
    res.redirect("/events");
});

app.use((req, res) => {
    res.status(404).render("error", {
        message: "404 - Page Not Found",
        error: "The page you're looking for doesn't exist."
    });
});

app.use((err, req, res, next) => {
    console.error(" Error middleware caught:", err.stack);
    res.status(500).render("error", {
        message: "Something went wrong! Please try again later.",
        error: err.message
    });
});



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
