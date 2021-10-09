const express = require('express')
const router =express.Router();
const Post=require('../../models/Posts')
const auth=require('../../middleware/auth')
const normalize = require('normalize-url');
const User=require('../../models/User')
const { check, validationResult } = require('express-validator');
const checkObjectId = require('../../middleware/checkObjectId');


router.post('/', [auth,[
    check('text','Text for post is required')
]], async (req,res)=>{
const errors=validationResult(req);
if(!errors.isEmpty()){
    res.status(400).json({erros:errors.array()})
}
const user= await User.findById(req.user.id).select('-password');
 try{
const newPost=new Post({
    text:req.body.text,
    name:user.name,
    avatar:user.avatar,
    user:req.user.id
});
    const post=await newPost.save();
    res.json(post);
 }catch(err){
    console.error(err.message);
    res.status(500),send('server error')
    }
});

// GET all posts
router.get('/',auth, async (req,res)=>{
try{
    const posts=await Posts.find().sort({Date: -1});
    res.json(posts);

}catch(err){
    console.error(err.message);
    rest.status(500).send('server error');
}
});

// GET only posts passed by post:id
router.get('/:id',auth, async (req,res)=>{
    try{
        const post=await Posts.findById(req.params.id);
        if(!post){
            res.status(404).send('not found')
        }
        res.json(post);
    }catch(err){
        console.error(err.message);
        rest.status(500).send('server error');
    }
    });
// Delete Post by post:id
    router.delete('/:id',auth, async (req,res)=>{
        try{
            const post=await Posts.findById(req.params.id);
            if(!post){
                res.status(404).send('not found')
            }
            if(post.user.toString() !== req.user.id){
                res.send(401).json({msg:'Authorization failed!'})
            }
            post.remove();
            res.json('Post Removed');
        }catch(err){
            console.error(err.message);
            res.status(500).send('server error');
        }
});
// like a Post by post:id
router.put('/like/:id', auth, async (req,res)=>{
    try {
        const post= await Post.findById(req.params.id);
        //check if already liked by the user 
        if(post.likes.some((like) => like.user.toString() === req.user.id)){
            res.status(400).json({msg: 'Post already liked'})
        }
        post.likes.unshift({user: req.user.id})
        await post.save();
        res.json(post.likes); 
    } catch (err) {
        console.error(err.message)
        res.status(500).send('server error')
    }
});

// unlike a Post by post:id
router.put('/unlike/:id', auth, async (req,res)=>{
    try {
        const post= await Post.findById(req.params.id);
        //check if already liked by the user 
        if(!post.likes.some((like) => like.user.toString()=== req.user.id)){
            res.status(400).json({msg: 'Post not liked yet'})
        }
        post.likes = post.likes.filter(
            ({ user }) => user.toString() !== req.user.id
          );
        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message)
        res.status(500).send('server error')
    }
});
//post a comment on post:id
router.post('/comment/:id', [auth,[
    check('text','Text for post is required')
]], async (req,res)=>{
const errors=validationResult(req);
if(!errors.isEmpty()){
    res.status(400).json({erros:errors.array()})
}
const user= await User.findById(req.user.id).select('-password');
const post=await Post.findById(req.params.id);
 try{
const newComment={
    text:req.body.text,
    name:user.name,
    avatar:user.avatar,
    user:req.user.id
};
    post.comments.unshift(newComment)
    await post.save();
    res.json(post.comments);
 }catch(err){
    console.error(err.message);
    res.status(500).send('server error')
    }
});
// Delete a comment by post:id
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
  
      // Pull out comment
      const comment = post.comments.find(
        (comment) => comment.id === req.params.comment_id
      );
      // Make sure comment exists
      if (!comment) {
        return res.status(404).json({ msg: 'Comment does not exist' });
      }
      // Check user
      if (comment.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'User not authorized' });
      }
  
      post.comments = post.comments.filter(
        ({ id }) => id !== req.params.comment_id
      );
  
      await post.save();
  
      return res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server Error');
    }
  });

module.exports=router;