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

  db.query(sql, [email, password], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "server error" })
    }

    if (results.length > 0) {
      // Login successful
      res.json({
        success: true,
        message: "Login successful",
        role: results[0].role
      });
    } else {
      // Invalid Credential
      res.status(401).json({
        success: false,
        message: "Invalid Credential"
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
app.get("/apply_leaves", (req, res) => {
  const sql = `
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

  db.query(sql, (error, results) => {
    if (error) {
      console.error(error)
      return res.status(500).json({ message: "Database error" })
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


// =====================================ADMIN DASHBOARD API ====================================================
//1) app/Addemployee.js
app.post("/addemployee", (req, res) => {
  const { name, email, department, position, phone, joinDate, status } = req.body;
  const query = `
  INSERT INTO addemployees
  (name,email,department,position,phone,joinDate,status)
  values(?,?,?,?,?,?,?)
  `;
  db.query(query,
    [name, email, department, position, phone, joinDate, status],
    (err, result) => {
      if (err) {
        console.error("DB error", err)
        // Duplicate email error
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "This email is already registered" })
        }

        return res.status(500).json({ error: err.message })
      }
      res.status(201).json({ message: "Employee added.." })
    }
  )
})
// =========================================================================================
// 2) Display Employee
app.get("/displayemployee", (req, res) => {
  const sql = `
   SELECT 
      id,
      name,
      email,
      department,
      position,
      phone,
      DATE_FORMAT(joinDate, '%Y-%m-%d') AS joinDate,
      status
    FROM addemployees
  `;
  db.query(sql, (err, result) => {
    if (err) {
      console.error('SQL error', err)
      return res.status(500).json({ message: "server error", error: err })
    }
    // Add "available" field
    //  const dataWithLeaves=result.map(emp=>({
    //   ...emp,
    //   leaves:{
    //     total:emp.totalLeaves,
    //     used:emp.usedLeaves,
    //     available:emp.totalLeaves-emp.usedLeaves
    //   }
    //  })) ;
    res.json(result)
  });
});
// -------------------------------------------------------------------------------------------------
//3) Delete Employee
app.delete("/deleteemployee/:id", (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM addemployees WHERE id=?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("DB error", err)
      return res.status(500).json({ error: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Employee not found" })
    }
    res.json({ message: "Employee deleted Successfully" })
  })
})
// =======================================================================================
// Edit Employees.
app.put("/editemployee/:id", (req, res) => {
  const { id } = req.params;
  const { name, email, department, position, phone, joinDate, status } = req.body;

  const query = `
    UPDATE addemployees
    SET
      name = ?,
      email = ?,
      department = ?,
      position = ?,
      phone = ?,
      joinDate = ?,
      status = ?
    WHERE id = ?
  `;

  db.query(
    query,
    [name, email, department, position, phone, joinDate, status, id],
    (err, result) => {
      if (err) {
        console.error("DB ERROR:", err);
        return res.status(500).json({ error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Employee not found" });
      }

      res.json({ message: "Employee updated successfully" });
    }
  );
});



// =======================================================================================
// get admin leave_request.

app.get("/admin/leave-requests", (req, res) => {
  const sql = `
    SELECT *
    
    FROM apply_leave
    ORDER BY id DESC 
   
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error", error: err });
    }
    res.json(results);
  });
});

// =======================================================================================
app.put("/admin/leave/:id/status", (req, res) => {
  const leaveId = req.params.id;
  const { status } = req.body; // "Approved" or "Rejected"

  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  // Get leave request
  const selectSql = "SELECT * FROM apply_leave WHERE id = ?";
  db.query(selectSql, [leaveId], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "Leave not found" });

    const leave = results[0];

    // Update status
    const updateSql = "UPDATE apply_leave SET status = ? WHERE id = ?";
    db.query(updateSql, [status, leaveId], (err) => {
      if (err) return res.status(500).json({ message: "Database error" });

      res.json({ message: `Leave ${status}` });
    });
  });
});
// ======================================================================================
// Admin report 
app.get("/admin/leave-report", (req, res) => {
  const sql = `
    SELECT
        al.id,
        al.employee_name AS name,
        ae.department,
        al.leave_type AS leaveType,
        DATEDIFF(al.to_date, al.from_date) + 1 AS days,
        al.status
        FROM apply_leave al
        LEFT JOIN addemployees ae ON al.employee_name = ae.name
        ORDER BY al.id DESC;

  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Leave report error:", err);
      return res.status(500).json([]); // return 500 on error
    }

    res.status(200).json(results);
  });
});





// =======================================================================================
// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});