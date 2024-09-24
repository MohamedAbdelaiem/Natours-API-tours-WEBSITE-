const Tour=require('../models/tourModel');
const User=require('../models/userModel');
const Review=require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview=catchAsync(async(req,res,next)=>{
    // 1)Get Tour data from collection
    const tours=await Tour.find();
    // 2) Build template with tour data
    res.status(200).render('overview',{
        title:"All tours",
        tours
    });
});

exports.getTour=catchAsync(async(req,res,next)=>{
    //1)Get Tour data with name
    const tour=await Tour.findOne({slug:req.params.tourName}).populate({
        path:'reviews',
        fields:'review rating user'
    });
    // 2) Build template with tour data
    res.status(200).render('tour',{
        title:`${tour.name} Tour`,
        tour
    });
    if(!tour){
        return next(new AppError('There is no tour with that name',404));
    }

});

exports.getLoginForm=(req,res)=>{
    res.status(200).set(
        'Content-Security-Policy',
        "connect-src 'self' https://cdnjs.cloudflare.com"
    )
    .render('login', {
        title: 'Log into your account',
    }); 
};

exports.getAccount=(req,res)=>{
    res.status(200).render('profile', {
        title: 'Your account',
    });
};

exports.updateUserData=catchAsync(async(req,res)=>{
    const user=await User.findByIdAndUpdate(req.user.id,{
        name:req.body.name,
        email:req.body.email
    },{
        new:true,
        runValidators:true
    });
    res.status(200).render('profile', {
        title: 'Your account',
        user
    });
});

exports.getSignup=(req,res)=>{
    res.status(200).render('signup', {
        title: 'Create your account',
    });
}
