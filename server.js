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
// POST login API
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


// ===================================================================================
// app.post("/login", (req, res) => {
//   console.log("BODY =>", req.body);
//   res.json({ success: true });
// });


// -------------------------------------------------------------------------------------------------

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});