const mongoose=require('mongoose');
const Tour=require('./tourModel');

const review_Schema=new mongoose.Schema({
    review:{
        type:String,
        required:[true,'Review cannot be empty']
    },
    rating:{
        type:Number,
        min:1,
        max:5
    },
    createdAt:{
        type:Date,
        default:Date.now()
    },
    tour:{
        type:mongoose.Schema.ObjectId,
        ref:'Tour',
        required:[true,'Review must belong to a tour']
    },
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:[true,'Review must belong to a user']
    }
},{
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
});

review_Schema.index({tour:1,user:1},{unique:true});

review_Schema.pre(/^find/,function(next)
{
    this.populate({
        path:'user',
        select:'-__v',
    });
    next();
});


review_Schema.statics.calcAverageRatings=async function(tourId)
{
    const stats=await this.aggregate([
        {
            $match:{tour:tourId}
        },
        {
            $group:{
                _id:'$tour',
                nRating:{$sum:1},
                avgRating:{$avg:'$rating'}
            }
        }
    ]);
    if(stats.length>0)
    {
        await Tour.findByIdAndUpdate(tourId,{
            ratingsQuantity:stats[0].nRating,
            ratingsAverage:stats[0].avgRating
        });
    }
    else{
        await Tour.findByIdAndUpdate(tourId,{
            ratingsQuantity:0,
            ratingsAverage:4.5
        });
    }
}

review_Schema.post('save',function(){
    this.constructor.calcAverageRatings(this.tour);
});

review_Schema.pre(/^findOneAnd/,async function(next){
    this.r=await this.findOne();//get the doc befor the update done or the delete from the query
    next();
});

review_Schema.post(/^findOneAnd/,async function(){
    await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review=mongoose.model('Review',review_Schema);



module.exports=Review;

// POST /tour/tour_id/reviews
// GET /tour/tour_id/reviews
// GET /tour/tour_id/reviews/review_id
