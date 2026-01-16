const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
// const bcrypt = require('bcrypt');


const app = express();
app.use(cors());
app.use(bodyParser.json());

// --------------------------------------------------------------------------------------
// Middleware

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const port = 8000;
// -----------------------------------------------------------------------------------------
// mysql database connection.
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',        // your DB username
    password: 'root',        // your DB password
    database: 'leave_management'
});

db.connect((err) => {
    if (err) {
        console.log('DB Connection Error:', err);
        return;
    }
    console.log('Connected to MySQL Database');
});
// ==========================================================================================
// POST API for user login. 
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = `SELECT * FROM userlogin WHERE email=? AND password=?`
    
    db.query(sql, [email,password],(err,results)=>{
        if(err){
            return res.status(500).json({message :"server error"})
        }

        if(results.length>0){
            // Login successful
            res.json({
                success:true,
                message:"Login successful",
                role:results[0].role
            });
        }else{
            // Invalid Credential
            res.status(401).json({
                success:false,
                message:"Invalid Credential"
            });
        };
    });


});

// ==========================================================================================
//   Post Api for Employee Apply_leave

app.post("/apply_leave", (req, res) => {

  const {
    employee_name,
    leave_type,
    from_date,
    to_date,
    leave_reason,
    contact_number
  } = req.body;

  // 🔹 Basic validation
  if (
    !employee_name ||
    !leave_type ||
    !from_date ||
    !to_date ||
    !leave_reason ||
    !contact_number
  ) {
    return res.status(400).json({
      message: "All fields are required"
    });
  }

  // 🔹 Insert query
  const sql = `
    INSERT INTO apply_leave
    (employee_name, leave_type, from_date, to_date, leave_reason, contact_number)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      employee_name,
      leave_type,
      from_date,
      to_date,
      leave_reason,
      contact_number
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          message: "Database error"
        });
      }

      res.status(201).json({
        message: "Leave applied successfully",
        leave_id: result.insertId
      });
    }
  );
});


// ===================================================================================
// get API for apply_leave display.
app.get("/apply_leaves",(req,res)=>{
const sql= `
  SELECT
      id,
      leave_type AS type,
      from_date AS \`from\`,
      to_date AS \`to\`,
      number_of_days AS days,
      'Pending' AS status,
      leave_reason AS reason,
      DATE(applied_on) AS appliedOn,
      '-' AS approvedBy
    FROM apply_leave
    ORDER BY applied_on DESC
    `;

    db.query(sql,(error,results)=>{
      if(error){
        console.error(error)
        return res.status(500).json({message:"Database error"})
      }
      res.json(results);
    })
})

// =========================================================================================
    // Recent leaves display on the dashboard

    app.get("/recent_leave", (req, res) => {
  const sql = `
    SELECT 
        id,
        employee_name,
        leave_type,
        from_date,
        to_date,
        DATEDIFF(to_date, from_date) + 1 AS number_of_days,
        status ,
        applied_on
    FROM apply_leave
    ORDER BY applied_on DESC
    LIMIT 2
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json([]);
    }
    res.json(results); // ✅ returns array directly
  });
});
// =========================================================================================
  // Leave Balance AP

// =========================================================================================
// =========================================================================================

// -------------------------------------------------------------------------------------------------

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});