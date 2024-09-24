const dotenv = require("dotenv");
const mongoose = require("mongoose");
//syncronous promises unhandled rejection
process.on('unhandledRejection',err=>{
  console.log(err.name,err.message);
  console.log('UNHANDLED REJECTION! Shutting down...');
  process.exit(1);
});

//syncronous promises uncaught exception

process.on('uncaughtException',err=>{
  console.log(err.name,err.message);
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  process.exit(1);
});
dotenv.config({ path: "./config.env" });
const port = process.env.PORT || 3000;
const app = require("./app");



mongoose
  .connect(process.env.DATABASE, {})
  .then(() => {
    console.log("DB connection successful!");
  })
  
// console.log(process.env);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});



