const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./model/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


const app = express();
mongoose.connect('mongodb://localhost:27017/eventmanage');


app.use(express.json());

app.post('/login',async (req,res)=>{
  // console.log(req.body);
  const { email,password } = req.body;

  let user = await User.findOne({ email }).select('email password username');
  if( !user )
    return res.status(409).json({ msg : 'email not registered' });
  
  let matched = await bcrypt.compare(password,user.password);

  if( !matched )
    return res.status(409).json({ msg : 'password not matched' });

  try{
    
    const refreshToken = jwt.sign(
      { 'email' : user.email },
      process.env.REFRESH_TOKEN_SECRET,
      {expiresIn : '1d' });

    const accessToken = jwt.sign(
      { 'email' : user.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn : '30d' });
    
    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({
      refreshToken,
      accessToken,
      username : user.username
    })

  }
  catch(err){
    console.log(err);
    return res.status(500).json({ msg : err });
  }
});

app.post('/register',async (req,res)=>{

  const { username,email,password } = req.body; 

  try{
    const hashedpwd = await bcrypt.hash(password,10);
    User.validate({username,password,email});
    const user = await User.create({username,email,password:hashedpwd});
    return res.status(201).json(user);
  }
  catch(err){
    let error = err.message.split(',');
    return res.status(409).json({ msg : 'error has occured', error });
  }

})

app.post('/refresh',async (req,res)=>{
  const { refreshToken } = req.body;
  const user = await User.findOne({ refreshToken });

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    (err,decoded)=>{
      if( err )
        return res.status(403).json({ msg : 'refresh token invalid' });
      
      if( decoded.email!==user.email )
        return res.status(403).json({ msg : 'email not matched' });
      
      const accessToken = jwt.sign(
        { 'email' : user.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn : '1d' }
      );

      return res.status(200).json({
         accessToken,
         username : user.username,
         email : user.email,
      });
    }
  )
})

mongoose.connection.once('open',()=>{
  console.log('connected to db');
  app.listen(process.env.PORT,()=>{
    console.log('listening to port : 3500');
  })
})