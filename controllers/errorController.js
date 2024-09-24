
const AppError=require('../utils/appError');
const sendErrorDev=(err,req,res)=>
  {
    //APi
  if(req.originalUrl.startsWith('/api')){
  res.status(err.statusCode).json({
    status:err.status,
    error:{
      statusCode:err.statusCode,
      status:err.status,
      name:err.name,
    },
    message:err.message,
    stack:err.stack,
  });
}
else{
  //Rendered WEBSITE
  res.status(err.statusCode).render('error',{
    title:'Something went wrong',
    msg:err.message,
  });
}
}

const sendErrorProd=(err,req,res)=>{
  //API
  if(req.originalUrl.startsWith('/api')){
    if(err.isOperational){
      return res.status(err.statusCode).json({
        status:err.status,
        message:err.message,
      });
    }
    else{
      console.error('Error',err);
      return res.status(500).json({
        status:'error',
        message:'Something went wrong',
      });
    }
  }
  else{
    //Rendered WEBSITE
    if(err.isOperational){
      return res.status(err.statusCode).render('error',{
        title:'Something went wrong',
        msg:err.message,
      });
    }
    else{
      console.error('Error',err);
      return res.status(err.statusCode).render('error',{
        title:'Something went wrong',
        msg:'Please try again later',
      });
    }
  }
};

const handleCastErrorDB=err=>{
  const message=`Invalid ${err.path}: ${err.value}`;
  return new AppError(message,400);
}

const handleDublicateFieldDB=err=>{
  const value=err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message=`Dublicate field value: ${value}. Please use another value`;
  return new AppError(message,400);
}

const handleValidationErrorDB=err=>{
  const errors=Object.values(err.errors).map(el=>el.message);
  const message=`Invalid input data. ${errors.join('. ')}`;
  return new AppError(message,400);
}

const handleJWTError=()=>new AppError('Invalid token. Please log in again',401);

const handleExpiredToken=()=>new AppError('Your token has expired. Please log in again',401);

const handleDublicateReview=()=>new AppError('You have already reviewed this tour',400);

module.exports=(err,req,res,next)=>{
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
    if(process.env.NODE_ENV==='development'){
    sendErrorDev(err,req,res);
  }


  else {
    let error={...err}
    error.message=err.message;
    if(err.name==='CastError') error=handleCastErrorDB(err);

    if(err.code===11000)error=handleDublicateFieldDB(err);

    if(err.name==='ValidationError')error=handleValidationErrorDB(err);

    if(err.name==='JsonWebTokenError') error=handleJWTError();

    if(err.name==='TokenExpiredError') error=handleExpiredToken();

    if(err.name==='MongoServerError') error=handleDublicateReview();

    sendErrorProd(error,req,res);
  }

    next();
};

