const express = require('express')
const router =express.Router();
const {check,validationResult}=require('express-validator/check')

router.post('/',[
    check('name','Please enter the Name').isEmpty().not(),
    check('email','Please Enter a valid Email').isEmail(),
    check('password',"Enter a password of length 6 or greater").isLength({min:6})
],
(req,res)=>{
   const errors = validationResult(req);
       if(!errors.isEmpty){
           res.status(400).json({errors: errors.array()})
       }
       console.log(req.body);
       res.send('User API');
})

module.exports=router;