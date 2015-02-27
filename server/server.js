  var express = require('express');
  var path = require('path');
  var rapgeniusClient = require("rapgenius-js");
  var google = require('googleapis');
  var youtube = google.youtube('v3');
  var bodyParser = require('body-parser');
  var properties = require("properties");
 

  var app = express();

  properties.parse("vars", { path: true, variables: true }, function (error, p){
    if (error) return console.error (error);
    PROPERTIES_VARIABLE = p;
  });  


  var rootDir = __dirname + '/../';
  var clientbuild = rootDir + 'client';

  app.use(bodyParser.urlencoded({
      extended: false
  }));

  app.use(bodyParser.json());

  app.use(express.static(clientbuild));

  app.engine('html', require('ejs').renderFile);
  app.set('views', path.join(rootDir, 'views_html'));

  app.get('/', function(req, res) {
      res.render('index.html');
  });

  /* 
   * @TODO: this controller is least robust one that I have built so far !!!
   *
   */
  app.post("/retrievelyricsFromYoutubeId", function(req, res) {
      youtube.videos.list({
          auth: PROPERTIES_VARIABLE.GOOGLE_API_KEY,
          id: req.body.youtubeVideoId,
          part: "id,snippet"
      }, function(err, data) {
          rapgeniusClient.searchSong(data.items[0].snippet.title, "rap", function(err, songs) {
              if (err) {
                  console.log("Error: " + err);
              } else {
                  rapgeniusClient.searchLyricsAndExplanations(songs[0].link, "rap", function(err, lyricsAndExplanations) {
                      if (err) {
                          console.log("Error: " + err);
                      } else {
                          var song = "Found lyrics for song [title=%s, main-artist=%s, featuring-artists=%s, producing-artists=%s]";
                          song += "\n";
                          song += "**** LYRICS ****";
                          song += lyricsAndExplanations.lyrics.getFullLyrics(true);

                          res.end(JSON.stringify({
                              lyricsAndExplanations: lyricsAndExplanations
                          }));
                      }
                  });
              }
          });
      });
  });

  app.listen(3000);