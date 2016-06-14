var express =   require("express");
var multer  =   require('multer');
var app         =   express();
var shell = require('shelljs');
var config = require('./config.json');

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

var kaldi_decoder = config.kaldi_decoder;
var model_path = config.model_path;


app.post('/api/photo',function(req,res){
    upload(req,res,function(err) {
        if(req.fileValidationError) {
              return res.end(req.fileValidationError);
        }
        if(err) {
            return res.end("Error uploading file.");
        }
        var original_path = 'uploads/' + req.file.filename;
        var destination_path = 'uploads/16k/' + req.file.filename;
        shell.exec('ffmpeg -i ' + original_path + ' -ar 16000 ' + destination_path, {silent:true});
        var decode_command = kaldi_decoder + ' --do-endpointing=false \
          --online=false \
          --config=' + model_path + '/conf/online_nnet2_decoding.conf \
          --max-active=7000 --beam=15.0 --lattice-beam=6.0 \
          --acoustic-scale=0.1 --word-symbol-table=' + model_path + '/graph/words.txt \
          '+ model_path + '/final.mdl ' + model_path +  '/graph/HCLG.fst "ark:echo utterance-id1 utterance-id1|" "scp:echo utterance-id1 ' + destination_path + '|" \
         ark:/dev/null';
        var output = shell.exec(decode_command,{silent:true}).stderr;
        pattern = new RegExp('\nutterance-id1 (.*)\n');
        result = pattern.exec(output)[1]

        res.end(result);
    });
});

app.listen(3000,function(){
    console.log("Working on port 3000");
});