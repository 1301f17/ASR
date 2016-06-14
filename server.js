var express =   require("express");
var multer  =   require('multer');
var app         =   express();

var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './uploads');
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '-' + Date.now() + '.wav');
  }
});


var upload = multer(
  { storage : storage, 
    fileFilter: function(req, file, cb) {
       if (file.mimetype !== 'audio/wav') {
        req.fileValidationError = 'goes wrong on the mimetype';
        return cb(null, false, new Error('goes wrong on the mimetype'));
       }
        cb(null, true);
    }
  }).single('audio');

app.get('/',function(req,res){
      res.sendFile(__dirname + "/index.html");
});

app.post('/api/photo',function(req,res){
    upload(req,res,function(err) {
        if(req.fileValidationError) {
              return res.end(req.fileValidationError);
        }
        if(err) {
            return res.end("Error uploading file.");
        }
        res.end("File is uploaded");
    });
});

app.listen(3000,function(){
    console.log("Working on port 3000");
});