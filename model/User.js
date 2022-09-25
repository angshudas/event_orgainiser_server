const { model,Schema } = require('mongoose');

const userSchema = new Schema({
  username : {
    type : 'String',
    required : true,
    unique : true,
  },
  email : {
    type : 'String',
    required : true,
    unique : true,
    validate : {
      validator : (email)=>{
        if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
          return true;
        
        return false;
        
      },
      message : (props)=>{
        return 'invalid email format';
      }
    },
  },
  password : {
    type : 'String',
    required : true,
  },
  refreshToken : {
    type : 'String',
    default : '',
  }
});

userSchema.statics.validate = function({username,email,password}){
  const err = [];
  if( username==='' )
    err.push(`username can't be empty`);
  if( email==='' )
    err.push(`email can't be empty`);
  if( password==='' )
    err.push(`password can't be empty`);

  if( err.length==0 )
    return;
  else throw Error(err);
  
}

module.exports = model('User',userSchema);