const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/user');
const router = express.Router();
const multer = require('multer');
const sharp  = require('sharp');

const upload = multer({
    limits: {
        fileSize: 1000*1000
    },
    fileFilter(req, file, cb){
        if(file.originalname.match(/\.(jpg|jpeg|png)$/g)){
            return cb(undefined, true)
        }else{
            return cb(new Error('Only .png, .jpeg or .jpg formats are supported!'));
        }
    }
});

router.post('/users/logout', auth, async (req, res)=>{
    try {
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token;
        })
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

router.post('/users/logoutall', auth, async (req, res)=>{
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
});
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

router.post('/users/login', async (req, res)=>{
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();

        res.send({user, token});
    }catch(e){
        res.status(400).send();
    }
});

router.post('/users', async (req, res)=>{
    try {
        const user = new User(req.body);
        const token = await user.generateAuthToken();

        res.send({user, token});
    } catch (e) {
        res.status(400).send();
    }
});


router.patch('/users/me', auth, async (req, res) => {

    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'age', 'email', 'password'];

    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation)
        return res.status(400).send({ error: 'Invalid option' });

    try {
        const user = req.user;
        updates.forEach((update)=>{user[update]=req.body[update];});
        await user.save();
        return res.send(user);
    } catch (e) {
        return res.status(400).send();
    }

});

router.delete('/users/me', auth,async (req, res) => {
    try {
        // const user = await User.findByIdAndDelete(req.user._id);

        // if (!user)
        //     return res.status(404).send({ error: 'not found' });
        // else
        await req.user.remove();
        res.status(200).send(req.user);
    } catch (e) {
        return res.status(500).send();
    }
});

router.post('/users/me/avatar', auth, upload.single('upload'), async (req, res)=>{
    const buffer = await sharp(req.file.buffer).resize({width:250, height:250}).png().toBuffer();
    
    req.user.avatar = buffer;
    await req.user.save(); 
    
    res.send();
}, (error, req, res, next)=>{
    res.status(400).send({error:error.message});
});

router.delete('/users/me/avatar', auth, async (req, res)=>{
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
});

router.get('/users/:id/avatar', async (req, res)=>{
    try {
        const user = await User.findById(req.params.id);

        if(!user || !user.avatar){
            throw new Error();
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);

    } catch (e) {
        res.status(404).send();
    }
});

module.exports = router;