const express = require('express')
const router =express.Router();
const {check,validationResult}=require('express-validator/check')
const gravatar= require('gravatar')
const User=require('../../Model/User')

router.post('/',[
    check('name','Please enter the Name').not().isEmpty(),
    check('email','Please Enter a valid Email').isEmail(),
    check('password','Enter a password of length 6 or greater').isLength({min:6})
],
async (req,res)=>{
   const errors = validationResult(req);
       if(!errors.isEmpty()){
          return res.status(400).json({errors: errors.array()})
       }
       const {name, email, password}= req.body;
       try{
        let user = await User.findOne(email);
        if(user){
            res.status(400).json({errors: [{msg:'User already Exist'}]})
        }

        const avatar=gravatar.url(email, {
            s:'200',
            r:'pg',
            d:'mm'
        })

        user=new user({
            name,
            email,
            password
        })

        res.send('User API');
       }catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
       }
       console.log(req.body);
       
})

module.exports=router;