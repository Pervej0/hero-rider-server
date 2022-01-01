const express = require("express");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRET);

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sjbgh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const run = async () => {
  try {
    await client.connect();
    const database = client.db("HeroRider");
    const userCollection = database.collection("users");
    const serviceCollection = database.collection("services");

    app.post("/users", async (req, res) => {
      const userDetails = req.body;
      const user = await userCollection.insertOne(userDetails);
      res.json(user);
    });

    app.get("/users", async (req, res) => {
      const userList = await userCollection.find({}).toArray();
      res.send(userList);
    });
    app.get("/services", async (req, res) => {
      const serviceList = await serviceCollection.find({}).toArray();
      res.send(serviceList);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const data = await serviceCollection.findOne(query);
      res.send(data);
    });

    // update user role in admin
    app.put("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    // get admin
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      console.log(query);
      let isAdmin = false;
      const user = await userCollection.findOne(query);
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
      console.log(isAdmin);
    });

    // block an user
    app.put("/users", async (req, res) => {
      const details = req.body;
      const filter = { email: details.email };

      console.log(details);
      if (details.status === "block") {
        const updateDoc = { $set: { status: "blocked" } };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.json(result);
        console.log(result);
      }
      if (details.status === "unblock") {
        updateDoc = { $set: { status: "active" } };
        const result = await userCollection.updateOne(filter, updateDoc);
        console.log(result);
        res.json(result);
      }
    });

    // order payment
    /*app.post("/create-payment-intent", async (req, res) => {
      const paymentDetails = req.body;
      const amount = paymentDetails.totalCost * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    }); */
  } finally {
    // client.close();
  }
};
run().catch(console.dir());

app.get("/", (req, res) => {
  res.send("Hello world! Welcome to server!");
});

app.listen(port, () => {
  console.log(`Server is running on PORT: ${port}`);
});
