const express = require('express');
const app = express();
const cors = require('cors');
const mysql = require('mysql2');

// --------------------------------------------------------------------------------------
// Middleware
app.use(cors());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const port = 8000;
// ---------------------------------------------------------------------------------------

// mysql database connection
const db= mysql.createConnection({
  host:'localhost',
  user:'root',
  password:'root',
  database:'leave_management'
})

db.connect((err)=>{
  if(err){
      console.log('Database connection failed ', err);
  }else{
      console.log('MySQL connected successfully ✅');
  }
});

// ------------------------------------------------------------------------------------------------
// 3️⃣ Create GET API to fetch all leave records


// -------------------------------------------------------------------------------------------------
// 4️⃣ Create POST API to store leave data

app.post('/leave',(req,res)=>{

    const {name,type,fromDate,toDate,reason}=req.body;
    const sql='INSERT INTO leaves (name,type,fromDate,toDate,reason) VALUES (?,?,?,?,?)';
    db.query(sql,[name,type,fromDate,toDate,reason],(err,result)=>{
        if(err){
            console.log('Error inserting data into database:', err);
            return res.status(500).json({ error: 'Failed to apply leave' });
        }
        console.log('Leave applied successfully');
        res.status(201).json({ message: 'Leave applied successfully' });
    });
});
// ---------------------------------------------------------------------------------------






// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});