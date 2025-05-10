require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); 
app.use(express.json());

// MongoDB Connection
const uri = `mongodb+srv://${process.env.user_db}:${process.env.user_db_password}@cluster5.ere94.mongodb.net/?retryWrites=true&w=majority&appName=Cluster5`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully!");

    const usersCollection = client.db("Journeyman_db").collection("users");
    const tasksCollection = client.db("Journeyman_db").collection("tasks");

    // Create a user
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // Get all users
    app.get("/users", async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Get a user by email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.send(user);
    });

    // Update a user by email
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const newRole = req.body.role;
    
      const query = { email: email };
      const updateDoc = { $set: { role: newRole } };
    
      const result = await usersCollection.updateOne(query, updateDoc);
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "User not found" });
      }
    
      res.json({ message: "User role updated successfully", result });
    });
    

    // Delete a user by email
    app.delete("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.deleteOne(query);
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully", result });
    });



    // Create a task
    app.post("/tasks", async (req, res) => {
      const user = req.body;
      const result = await tasksCollection.insertOne(user);
      res.send(result);
    });
    
    //Get all tasks
    app.get("/tasks", async (req, res) => {
      const tasks = await tasksCollection.find().toArray();
      res.send(tasks);
    });

    //Get a single submitted tasks
    // app.get("/tasks/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const task = await tasksCollection.findOne({ _id: new ObjectId(id) });
    //   res.send(task);
    // });
 

    //Get all task submitted by a email
    app.get("/tasks/:email", async (req, res) => {
      const email = req.params.email;
      try {
          const tasks = await tasksCollection.find({ user_email: email }).toArray();
          res.json(tasks);
      } catch (error) {
          console.error("Error fetching tasks:", error);
          res.status(500).json({ error: "Internal Server Error" });
      }
  });
  

    // update a tasks
    app.put("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const updatedTask = req.body;
      const result = await tasksCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedTask },
        { upsert: true } 
      );
      res.send(result);
    });
    
    // Delete a task
    app.delete("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    
    
  } catch (error) {
    console.error("Error in server setup:", error);
  }
}
run().catch(console.dir);

// Default route
app.get("/", (req, res) => {
  res.send("Server is running successfully!");
});

// Start the server
app.listen(port, () => {
  console.log(`Journeyman is running on port ${port}`);
});
