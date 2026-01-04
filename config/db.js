
const mysql = require('mysql2');


// database connection

const db=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'root',
    database:'leave_management'
});

db.connect((err)=>{
    if(err){
        console.log('Database connection failed ', err);
    }else{
        console.log('MySQL connected successfully ✅');
    }
});