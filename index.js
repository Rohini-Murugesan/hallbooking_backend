const express = require("express");
const mongodb = require("mongodb");
const dotenv = require("dotenv").config();
const app = express();
const cors = require("cors");
app.use(express.json());
app.use(cors());
// const bcrypt = require("bcryptjs");
const mongoClient = mongodb.MongoClient;
const port = 3000 || process.env.PORT;
const dburl = process.env.DB_URL || "mongodb://127.0.0.1:27017/"; // local db url

app.post("/createroom", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("Hall_Booking");
        requiredKeys = [
            "Room_Name",
            "Amenities",
            "Number_Of_Persons_Allowed",
            "One_Hour_Price",
        ];
        Keys = Object.keys(request.body);
        if (
            requiredKeys.every((key) => Keys.includes(key)) &&
            Keys.length === requiredKeys.length
        ) {
            let isPresent = await db
                .collection("Room_Details")
                .findOne({ Room_Name: request.body.Room_Name });
            if (isPresent) {
                response
                    .status(406)
                    .json({ msg: "Room already created with that name" });
            } else {
                let result = await db
                    .collection("Room_Details")
                    .insertOne(request.body);
                if (result) {
                    response.status(202).json({ msg: "Room is created successfully" });
                } else {
                    response.status(406).json({ msg: "Room creation failed" });
                }
            }
        } else {
            response.status(406).json({ msg: "Required Details not found" });
        }
    } catch (err) {
        console.info("ERROR : ", err);
        response.sendStatus(500);
    }
});

app.post("/bookroom", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("Hall_Booking");
        requiredKeys = [
            "Customer_Name",
            "Date",
            "Start_Time",
            "End_Time",
            "Room_Name",
        ];
        Keys = Object.keys(request.body);
        if (
            requiredKeys.every((key) => Keys.includes(key)) &&
            Keys.length === requiredKeys.length
        ) {
            let startDate = new Date(
                request.body.Date + "T" + request.body.Start_Time
            ).toISOString();
            let endDate = new Date(
                request.body.Date + "T" + request.body.End_Time
            ).toISOString();
            let isRoomPresent = await db
                .collection("Room_Details")
                .findOne({ Room_Name: request.body.Room_Name });
            
            let isPresent = await db.collection("Booking_Details").findOne({
                $and: [
                    {
                        Room_Name: request.body.Room_Name,
                        StartDate: { $lte: startDate },
                        EndDate: { $gte: endDate },
                    },
                ],
            });
            console.log(isRoomPresent);
            if (!isRoomPresent) {
                response.status(406).json({ msg: "Invalid Room Name" });
            }else{
            if (isPresent) {
                response
                    .status(406)
                    .json({ msg: "Room already booked for the given date/time" });
            } else {
                request.body.StartDate = startDate;
                request.body.EndDate = endDate;
                request.body.Booked_Status = "Confirmed";
                let result = await db
                    .collection("Booking_Details")
                    .insertOne(request.body);
                if (result) {
                    response.status(202).json({ msg: "Room is booked successfully" });
                } else {
                    response.status(406).json({ msg: "Room booking failed" });
                }
            }}
        } else {
            response.status(406).json({ msg: "Required Details not found" });
        }
    } catch (err) {
        console.info("ERROR : ", err);
        response.sendStatus(500);
    }
});

app.get("/roomdetails", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("Hall_Booking");
        let result = await db.collection("Room_Details").find().toArray();
        response.status(202).json({ data: result });
    } catch (err) {
        console.info("ERROR : ", err);
        response.sendStatus(500);
    }
});

app.get("/booked-room-details", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("Hall_Booking");
        let result = await db
            .collection("Booking_Details")
            .find({})
            .project({ _id: 0, Date: 0, Start_Time: 0, End_Time: 0 })
            .toArray(); //
        response.status(202).json({ data: result });
    } catch (err) {
        console.info("ERROR : ", err);
        response.sendStatus(500);
    }
});

app.get("/booked-customer-details", async (request, response) => {
    try {
        let client = await mongoClient.connect(dburl);
        let db = client.db("Hall_Booking");
        let result = await db
            .collection("Booking_Details")
            .find({})
            .project({
                _id: 0,
                Date: 0,
                Start_Time: 0,
                End_Time: 0,
                Booked_Status: 0,
            })
            .toArray(); //
        response.status(202).json({ data: result });
    } catch (err) {
        console.info("ERROR : ", err);
        response.sendStatus(500);
    }
});

app.listen(port, () => {
    console.log(`Your app is running in port ${port}`);
});
