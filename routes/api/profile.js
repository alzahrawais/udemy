const express = require('express')
const router =express.Router();
const auth=require('../../middleware/auth')
const normalize = require('normalize-url');
const Profile=require('../../models/Profile')
const User=require('../../models/User')
const { check, validationResult } = require('express-validator');


router.get('/me', auth, async(req,res)=>{
try{
const profile=await Profile.findOne({user: req.user.id}).populate('user',['name','avatar']);
if(!profile){
    return res.status(400).json({msg:'Profile not exist'});
    res.json(profile);
}
}catch(err){
console.error(err.message);
res.status(500).send('Server Error')
}
});
router.post(
    '/',
    auth,
    check('status', 'Status is required').notEmpty(),
    check('skills', 'Skills is required').notEmpty(),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      // destructure the request
      const {
        website,
        skills,
        youtube,
        twitter,
        instagram,
        linkedin,
        facebook,
        // spread the rest of the fields we don't need to check
        ...rest
      } = req.body;
  
      // build a profile
      const profileFields = {
        user: req.user.id,
        website:
          website && website !== ''
            ? normalize(website, { forceHttps: true })
            : '',
        skills: Array.isArray(skills)
          ? skills
          : skills.split(',').map((skill) => ' ' + skill.trim()),
        ...rest
      };
  
      // Build socialFields object
      const socialFields = { youtube, twitter, instagram, linkedin, facebook };
  
      // normalize social fields to ensure valid url
      for (const [key, value] of Object.entries(socialFields)) {
        if (value && value.length > 0)
          socialFields[key] = normalize(value, { forceHttps: true });
      }
      // add to profileFields
      profileFields.social = socialFields;
  
      try {
        // Using upsert option (creates new doc if no match is found):
        let profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        return res.json(profile);
      } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
      }
    }
  );
  router.get('/', async(req,res)=>{
      try{
        const profile= await Profile.find().populate('user',['name','avatar']);
        res.json(profile);
      }catch(err){
        console.error(err.message);
        res.status(500).send('server error')
      }
  });
  router.get('/user/:user_id', async(req,res)=>{
    try{
      const profile= await Profile.findOne({user: req.params.user_id}).populate('user',['name','avatar']);
      if(!profile)
      return res.status(400).send('profile not found')
      res.json(profile);
    }catch(err){
      console.error(err.message);
     if(err.kind == 'ObjectId'){
      return res.status(400).send('profile not found')
      } 
    }
});
router.delete('/',auth, async(req,res)=>{
  try{
     await Profile.findOneAndRemove({user: req.user.id});

     await User.findOneAndRemove({_id: req.user.id});
     res.json({msg:'User deleted'})
  }catch(err){
    console.error(err.message);
    res.status(500).send('server error')
  }
});
//Experience
router.put('/experience',[auth,[
  check('title','title is required'),
  check('company','company name is require'),
  check('from','from date is required')
]
],async (req,res)=>{
const errors=validationResult(req);
if(!errors.isEmpty){
  return res.status(400).json({ errors: errors.array() });
};
const{
  title,
  company,
  location,
  from,
  to,
  description,
  current
}= req.body;
const newExp={
  title,
  company, 
  location,
  from,
  to,
  description,
  current
}
try{
const profile=await Profile.findOne({user: req.user.id});
profile.experience.unshift(newExp);
await profile.save();
res.json(profile);

}catch(err){
  console.error(err.message)
  res.status(500).send('Server Error')
}
});
//Del Exp
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const foundProfile = await Profile.findOne({ user: req.user.id });

    foundProfile.experience = foundProfile.experience.filter(
      (exp) => exp._id.toString() !== req.params.exp_id
    );

    await foundProfile.save();
    return res.status(200).json(foundProfile);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Server error' });
  }
});

//Education
router.put('/education',[auth,[
  check('school','title is required'),
  check('degree','company name is require'),
  check('fieldofstudy','field-of-study is required'),
  check('from','from date is required')
]
],async (req,res)=>{
const errors=validationResult(req);
if(!errors.isEmpty){
  return res.status(400).json({ errors: errors.array() });
};
const{
  school,
  degree,
  fieldofstudy,
  from,
  to,
  description,
  current
}= req.body;
const newEdu={
  school,
  degree,
  fieldofstudy,
  from,
  to,
  description,
  current
}
try{
const profile=await Profile.findOne({user: req.user.id});
profile.education.unshift(newEdu);
await profile.save();
res.json(profile);

}catch(err){
  console.error(err.message)
  res.status(500).send('Server Error')
}
});
//Del Exp
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const foundProfile = await Profile.findOne({ user: req.user.id });

    foundProfile.education = foundProfile.education.filter(
      (edu) => edu._id.toString() !== req.params.edu_id
    );

    await foundProfile.save();
    return res.status(200).json(foundProfile);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Server error' });
  }
});
//github api Repos
router.get('/github/:username', async (req, res) => {
  try {
    const uri = encodeURI(
      `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
    );
    const headers = {
      'user-agent': 'node.js',
      Authorization: `token ${config.get('githubToken')}`
    };

    const gitHubResponse = await axios.get(uri, { headers });
    return res.json(gitHubResponse.data);
  } catch (err) {
    console.error(err.message);
    return res.status(404).json({ msg: 'No Github profile found' });
  }
});

module.exports=router;