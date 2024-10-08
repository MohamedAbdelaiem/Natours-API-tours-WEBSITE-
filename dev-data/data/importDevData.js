const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const fs=require('fs');
const mongoose = require("mongoose");
const Tour=require('../../models/tourModel');
const User = require("../../models/userModel");
const Review = require("../../models/reviewModel");


mongoose
  .connect(process.env.DATABASE, {})
  .then(() => {
    console.log("DB connection successful!");
  })
  .catch((err) => {
    console.error("DB connection error:", err);
  });
// console.log(process.env);

//READ JSON FILE

const tours=JSON.parse(fs.readFileSync(`${__dirname}/tours.json`,'utf-8'));
const users=JSON.parse(fs.readFileSync(`${__dirname}/users.json`,'utf-8'));
const reviews=JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`,'utf-8'));


//IMPORT DATA INTO DB

const importData=async()=>{
    try{
        await Tour.create(tours);
        await User.create(users,{validateBeforeSave:false});
        await Review.create(reviews);
        // console.log('Data successfully loaded');

    }
    catch(err){
        console.log(err);
    }
    process.exit();
};

//DELETE ALL DATA FROM COLLECTION

const deleteData=async()=>{
    try{
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        // console.log('Data successfully deleted');
    }
    catch(err){
        console.log(err);
    }
    process.exit();
};

if(process.argv[2]=="--import"){
    importData();
}
else if(process.argv[2]=="--delete"){
    deleteData();
}

// console.log(process.argv);
