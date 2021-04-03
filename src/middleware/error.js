const error = (error, req, res)=>{
    res.status(error.status).send(error);
}

module.exports = error;