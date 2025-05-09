require("dotenv").config();
const express = require('express')
const app = express()
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.user_db}:${process.env.user_db_password}@cluster5.ere94.mongodb.net/?retryWrites=true&w=majority&appName=Cluster5`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const usersCollection = client.db("Journeyman_db").collection("users");

    // Creat a user 
    app.post('/users',async(req,res)=>{
      const user= req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })

    // Get all users
    app.get('/users',async(req,res)=>{
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })


    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Error in server setup:", error);
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('server is ok!')
})

app.listen(port, () => {
  console.log(`Journeyman is running on port : ${port}`)
})
