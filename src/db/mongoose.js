const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.01:27017/task-manager-api', {
    useNewUrlParser: true,
    useCreateIndex: true
});

