require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb"); // ← Add ObjectId here

const app = express();
const port = process.env.PORT || 3000;
app.use((req, res, next) => {
  //console.log(`→ ${req.method} ${req.url}`);
  next();
});

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
    // await client.connect();
    // //console.log("Connected to MongoDB successfully!");

    const usersCollection = client.db("Journeyman_db").collection("users");
    const tasksCollection = client.db("Journeyman_db").collection("tasks");
    const withdrawalsCollection = client.db("Journeyman_db").collection("withdrawals");
    const submissionCollection = client.db("Journeyman_db").collection("submissions");
    const paymentsCollection = client.db("Journeyman_db").collection('payments')

    // Create a user
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // Get all users
    app.get("/users", async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    });

    // Get a user by email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });
      res.send(user);
    });

      // Update a user by email (now updates any fields you pass, including coins)
      app.put("/users/:email", async (req, res) => {
        const email = req.params.email;
        const updateFields = { ...req.body };
        if (Object.keys(updateFields).length === 0) {
          return res.status(400).json({ message: "No update fields provided." });
        }
        try {
          const result = await usersCollection.updateOne(
            { email },
            { $set: updateFields }
          );
          if (result.matchedCount === 0) {
            return res.status(404).json({ message: "User not found" });
          }
          const updatedUser = await usersCollection.findOne({ email });
          res.json({ message: "User updated successfully", user: updatedUser });
        } catch (err) {
          //console.error("Error updating user:", err);
          res.status(500).json({ message: "Internal server error." });
        }
      });

    // Delete a user by email
    app.delete("/users/:email", async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.deleteOne({ email });
      if (result.deletedCount === 0)
        return res.status(404).json({ message: "User not found" });
      res.json({ message: "User deleted successfully", result });
    });

    // Create a task
    app.post("/tasks", async (req, res) => {
      const task = req.body;
      const result = await tasksCollection.insertOne(task);
      res.send(result);
    });

    // Get all tasks
    app.get("/tasks", async (req, res) => {
      const tasks = await tasksCollection.find().toArray();
      res.send(tasks);
    });

    // Get a single task by ID
    app.get("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const task = await tasksCollection.findOne({ _id: new ObjectId(id) });
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.send(task);
    });

    // (Optional) If you need to fetch by user_email, use a distinct route:
    app.get("/tasks/user/:email", async (req, res) => {
      const email = req.params.email;
      try {
        const tasks = await tasksCollection
          .find({ user_email: email })
          .toArray();
        res.json(tasks);
      } catch (error) {
        //console.error("Error fetching tasks:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // Update a task
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

    // ─── Create a submission & decrement required_workers ───
    app.post("/submissions", async (req, res) => {
      try {
        const submission = req.body;
        submission.status = "pending";
        submission.current_date = new Date();
        const insertResult = await submissionCollection.insertOne(submission);
        await tasksCollection.updateOne(
          { _id: new ObjectId(submission.task_id) },
          { $inc: { required_workers: -1 } }
        );
        return res
          .status(201)
          .json({ submissionId: insertResult.insertedId, success: true });
      } catch (err) {
        //console.error("Error creating submission:", err);
        return res.status(500).json({ message: "Failed to create submission" });
      }
    });

    // Get all submissions
    app.get("/submissions", async (req, res) => {
      const submissions = await submissionCollection.find().toArray();
      res.send(submissions);
    });

    // Get a submission by ID
    app.get("/submissions/:id", async (req, res) => {
      const id = req.params.id;
      const submission = await submissionCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!submission)
        return res.status(404).json({ message: "Submission not found" });
      res.send(submission);
    });

    // (Optional) If you need to fetch submissions by worker email:
    app.get("/submissions/user/:email", async (req, res) => {
      const email = req.params.email;
      try {
        const submissions = await submissionCollection
          .find({ worker_email: email })
          .toArray();
        res.json(submissions);
      } catch (error) {
        //console.error("Error fetching submissions:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // Get all submissions by client email
    app.get("/submissions/client/:email", async (req, res) => {
      const email = req.params.email;
      try {
        const submissions = await submissionCollection
          .find({ client_email: email })
          .toArray();
        res.json(submissions);
      } catch (error) {
        //console.error("Error fetching submissions:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // ─── Approve / Reject a submission (robust, two‐step approach) ───
    app.put("/submissions/:id", async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;
      //console.log("→ PUT /submissions/:id", { id, status });
      // 1) Validate the ID
      if (!ObjectId.isValid(id)) {
        //console.warn(`Invalid ObjectId format: ${id}`);
        return res.status(400).json({ error: "Invalid submission ID" });
      }
      // 2) Fetch the current submission to inspect previous status
      let prevSub;
      try {
        prevSub = await submissionCollection.findOne({ _id: new ObjectId(id) });
      } catch (err) {
        //console.error("Error fetching existing submission:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      if (!prevSub) {
        //console.warn(`No submission found for ID ${id}`);
        return res.status(404).json({ error: "Submission not found" });
      }
      // 3) Update the status field
      let updateResult;
      try {
        updateResult = await submissionCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );
      } catch (err) {
        //console.error("Error updating submission status:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      // 4) Post‐update logic: credit coins or refund worker slot
      try {
        // Only credit if moving into 'approved' from anything else
        if (status === "approved" && prevSub.status !== "approved") {
          const pay = Number(prevSub.payable_amount) || 0;
          //console.log(`Crediting ${pay} coins to ${prevSub.worker_email}`);
          const uw = await usersCollection.updateOne(
            { email: prevSub.worker_email },
            { $inc: { coins: pay } }
          );
          if (uw.matchedCount === 0) {
            //console.warn(`⚠️ No user found with email ${prevSub.worker_email}`);
          }
        }
        // Only increment required_workers if moving from 'pending' → 'rejected'
        else if (status === "rejected" && prevSub.status === "pending") {
          const tu = await tasksCollection.updateOne(
            { _id: new ObjectId(prevSub.task_id) },
            { $inc: { required_workers: 1 } }
          );
          if (tu.matchedCount === 0) {
            //console.warn(`⚠️ No task found with ID ${prevSub.task_id}`);
          }
        }
      } catch (err) {
        //console.error("Error in post‐update logic:", err);
        // We still respond success on status change
      }
      // 5) Re‐fetch and return the updated submission
      let updatedSub;
      try {
        updatedSub = await submissionCollection.findOne({
          _id: new ObjectId(id),
        });
      } catch (err) {
        //console.error("Error fetching updated submission:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      return res.json({ success: true, submission: updatedSub });
    });

    // Delete a submission
    app.delete("/submissions/:id", async (req, res) => {
      const id = req.params.id;
      const result = await submissionCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });


// ─── Withdrawals Endpoints ──────────────────────────────────

// Create a withdrawal request
app.post("/withdrawals", async (req, res) => {
  try {
    const {
      worker_email,
      worker_name,
      withdrawal_coin,
      withdrawal_amount,
      payment_system,
      withdraw_date,
      status,
    } = req.body;

    // Basic validation
    if (!worker_email || !withdrawal_coin || !withdrawal_amount || !payment_system) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const withdrawal = {
      worker_email,
      worker_name,
      withdrawal_coin,
      withdrawal_amount,
      payment_system,
      withdraw_date: withdraw_date || new Date().toISOString(),
      status: status || "pending",
    };

    const result = await withdrawalsCollection.insertOne(withdrawal);
    res.status(201).json({
      success: true,
      withdrawalId: result.insertedId,
      withdrawal,
    });
  } catch (err) {
    //console.error("Error creating withdrawal:", err);
    res.status(500).json({ message: "Failed to create withdrawal." });
  }
});

// Get all withdrawals (admin)
app.get("/withdrawals", async (req, res) => {
  try {
    const all = await withdrawalsCollection.find().toArray();
    res.json(all);
  } catch (err) {
    //console.error("Error fetching withdrawals:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Get a user's withdrawals
app.get("/withdrawals/user/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const list = await withdrawalsCollection
      .find({ worker_email: email })
      .toArray();
    res.json(list);
  } catch (err) {
    //console.error("Error fetching user withdrawals:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Get one withdrawal by ID
app.get("/withdrawals/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid withdrawal ID." });
  }
  try {
    const wd = await withdrawalsCollection.findOne({ _id: new ObjectId(id) });
    if (!wd) return res.status(404).json({ message: "Not found." });
    res.json(wd);
  } catch (err) {
    //console.error("Error fetching withdrawal:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Update withdrawal status (e.g. approve/reject)
app.put("/withdrawals/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!ObjectId.isValid(id) || !status) {
    return res.status(400).json({ message: "Invalid request." });
  }
  try {
    const result = await withdrawalsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );
    if (result.matchedCount === 0)
      return res.status(404).json({ message: "Not found." });
    const updated = await withdrawalsCollection.findOne({ _id: new ObjectId(id) });
    res.json({ success: true, withdrawal: updated });
  } catch (err) {
    //console.error("Error updating withdrawal:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Delete a withdrawal
app.delete("/withdrawals/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid withdrawal ID." });
  }
  try {
    const result = await withdrawalsCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0)
      return res.status(404).json({ message: "Not found." });
    res.json({ success: true });
  } catch (err) {
    //console.error("Error deleting withdrawal:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});



  // POST /payments → save payment record & credit coins to user
  app.post('/payments', async (req, res) => {
    try {
      const { user_email, coins, amount } = req.body
      if (!user_email || !coins || !amount) {
        return res.status(400).json({ message: 'Missing required fields.' })
      }
      const payment = {
        user_email,
        coins,
        amount,
        method: 'demo',
        date: new Date()
      }
      await paymentsCollection.insertOne(payment)
      await usersCollection.updateOne(
        { email: user_email },
        { $inc: { coins: coins } }
      )
      res.status(201).json({ success: true, payment })
    } catch (err) {
      //console.error('❌ /payments error:', err)
      res.status(500).json({ message: 'Server error.' })
    }
  })

 // GET /payments/user/:email → list payments for a user
 app.get('/payments/user/:email', async (req, res) => {
  try {
    const payments = await paymentsCollection
      .find({ user_email: req.params.email })
      .sort({ date: -1 })
      .toArray()
    res.json(payments)
  } catch (err) {
    //console.error('❌ /payments/user error:', err)
    res.status(500).json({ message: 'Server error.' })
  }
})


  } catch (error) {
    // //console.error("Error in server setup:", error);
  }
}

run().catch(console.dir);

// Default route
app.get("/", (req, res) => {
  res.send("Server is running successfully!");
});

// Start the server
app.listen(port, () => {
  // //console.log(`Journeyman is running on port ${port}`);
});
