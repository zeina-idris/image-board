const express = require ('express');
const app = express();
const multer = require('multer')
const uidSafe = require ('uid-safe')
const spicedPg = require('spiced-pg')
const db = process.env.DATABASE_URL || spicedPg('postgres:postgres:postgres@localhost:5432/comments');
const path = require('path');
const knox = require('knox');
const sendToS3 = require('./toS3').toS3;
const bodyParser = require('body-parser')

app.use(bodyParser.json())


app.use(express.static(__dirname + '/public'))

var diskStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, __dirname + '/uploads');
    },
    filename: function (req, file, callback) {
      uidSafe(24).then(function(uid) {
          callback(null, uid + path.extname(file.originalname));
      });
    }
});

var uploader = multer({
    storage: diskStorage,
    limits: {
        filesize: 2097152
    }
});

app.post('/upload', uploader.single('file'), (req, res) => {
    if (req.file) {
        sendToS3(req.file)
        .then(() => {
            console.log(req.file.filename);
             const q = 'INSERT INTO images (image, username, title, description) VALUES ($1, $2, $3, $4);'
             const params = [req.file.filename, req.body.username , req.body.title, req.body.description]
             return db.query(q, params)
             .then(() => {
                 res.json({
                     success: true
                 });
             })
        }).catch((err) => {
            console.log(err);
        })
    } else {
        res.json({
            success: false
        });
    }
});

app.get('/home', (req, res) => {
    const q= `SELECT * FROM images ORDER BY created_at DESC;`
    db.query(q)
    .then((result)=>{
        res.json({
            images: result.rows
        });
    }).catch((err)=> {
        console.log(err);
    })
})

app.get('/image/:id', (req, res) => {
    const qImage = `SELECT image, username, title, description FROM images WHERE id = $1`
    const qComments = `SELECT username, comment FROM comments WHERE image_id = $1`
    const params = [req.params.id]
    Promise.all([
        db.query(qImage, params),
        db.query(qComments, params)
    ])
    .then((result) => {
        res.json({
            image: result[0].rows[0],
            comments: result[1].rows
        });
    }).catch((err) => {
        console.log(err);
    })
})

app.post('/postComment', (req, res) => {
    const q = `INSERT INTO comments (image_id, username, comment) VALUES ($1, $2, $3)`
    const params = [req.body.imageId, req.body.username, req.body.comment]
    db.query(q, params)
    .then((result) => {
        res.json({
            success: 'true'
        })
    })
    .catch((err) => {
        console.log(err);
    })
})


app.listen(process.env.PORT || 8080, () =>{
    console.log('Listening on port 8080');
})
