global.spotify = {};

var request = require('request'); // "Request" library

/*
Starts the 'add music to playlist' proccess 
*/
spotify.addMusic = function(song_id){
  spotify.getplaylists(function(playlist_id) {
    if(playlist_id===""){
      spotify.createPlaylist(function(playlist_id){
        spotify.addToPlaylist(song_id);
      });
    }else{
      spotify.addToPlaylist(song_id);
    }
  });
}

/*
Verifies if our playlist already exists. Delegates functions whether or not.
*/
spotify.getplaylists = function(callback){
    var authOptions = {
      url: 'https://api.spotify.com/v1/users/' + card.user_id + '/playlists',
      headers: { 'Authorization': 'Bearer ' + card.access },
      json: true
    }
  request.get(authOptions, function(error, response) {
    var id="";
    for(var i=0;i<response.body.items.length;i++){
        obj = response.body.items[i];
        if(card.hangplaylist.test(obj.name)===true){
          id = obj.id;
          card.playlist_id = id;
        }
    }
    if(callback) callback(id);
  });
}

/*
Adds song to our playlist
*/
spotify.addToPlaylist = function(song_id, callback){
  var authOptions = {
      url: 'https://api.spotify.com/v1/users/' + card.user_id + '/playlists/'+card.playlist_id+'/tracks?uris='+song_id,
      headers: { 'Authorization': 'Bearer ' + card.access },
      json: true
    }
    request.post(authOptions, function(error, response) {
      console.log('addToPlaylist',response.statusCode);
      spotify.getplaylistItems(function(tracks) {
        if(tracks.items.length===1) spotify.startPlaylist(song_id);
      })
      if(callback) callback(response.statusCode);
  });
}

/*
Creates our playlist
*/
spotify.createPlaylist = function(callback){
  var hangplayliststr= card.hangplaylist.toString();
  var name = hangplayliststr.substring(2).substring(0, hangplayliststr.length - 4);
  var authOptions = {
      url: 'https://api.spotify.com/v1/users/' + card.user_id + '/playlists',
      headers: { 'Authorization': 'Bearer ' + card.access },
      body: {'name':name,'public':false},
      json: true
    }
    request.post(authOptions, function(error, response) {
    console.log('createPlaylist:' ,response.statusCode);
    if(response.statusCode===200 || response.statusCode===201){
      spotify.getplaylists(function(playlist_id) {
        if(callback) callback(playlist_id);
      });
    }
  });
}

/*
Starts playing our playlist, keeps track to the player status
*/
spotify.startPlaylist = function(song_id){
  var authOptions = {
    url: card.spotilocal+'/remote/play.json?csrf='+card.csrftoken+'&oauth='+card.oauth+'&uri=spotify:track:'+song_id+'&context=spotify:user:'+card.user_id+':playlist:'+card.playlist_id+'&ref=&cors=',
    json:true
  }
  request.get(authOptions,function(error, response){
    console.log('startPlaylist',response.body.playing);
    var check=setInterval(function () {
      spotify.checkStatus(function(statusPlaying) {
        if(statusPlaying===false){
          spotify.deleteTracks();
          clearInterval(check);
        }
      });
    }, 2000);
  })
}

/*
checks the player status
*/
spotify.checkStatus = function(callback){
  var authOptions = { 
      url: card.spotilocal+'/remote/status.json?csrf='+card.csrftoken+'&oauth='+card.oauth+'&cors=&ref=',
      json: true
    }
      request.get(authOptions, function(error, response) {
      if(callback) callback(response.body.playing);
    })
}

spotify.checkPlaylist = function(){
    spotify.getplaylists(function(playlist_id){
      if(playlist_id===""){
        spotify.createPlaylist();
        card.playlist_id = playlist_id;
      }else{spotify.deleteTracks()}
    })
}

/*
Deletes all tracks from playlist
*/
spotify.deleteTracks = function(){
  var todelete = '{"tracks":[';
  spotify.getplaylistItems(function(tracks) {
    var o = tracks.items;
      if(o.length===1){
      for (var prop in o) {
        if(o.hasOwnProperty(prop)) {
          todelete+='{"uri":"'+o[prop].track.uri+'"},';
        }
      }
      todelete=todelete.substring(0, todelete.length-1);
      todelete+=']}';
      var authOptions = {
        method: 'DELETE',
        url: 'https://api.spotify.com/v1/users/' + card.user_id + '/playlists/'+card.playlist_id+'/tracks',
        headers: { 'Authorization': 'Bearer ' + card.access },
        body: todelete,
        json: true
      }
      request.get(authOptions, function(error, response) {
      console.log('deletePlaylist:' ,response.statusCode);
      });
    }
  })
}

spotify.getplaylistItems = function(callback){
  var authOptions = {
      url: 'https://api.spotify.com/v1/users/' + card.user_id + '/playlists/'+card.playlist_id,
      headers: { 'Authorization': 'Bearer ' + card.access },
      json: true
    }
  request.get(authOptions, function(error, response) {
    if(callback) callback(response.body.tracks);
  });
}