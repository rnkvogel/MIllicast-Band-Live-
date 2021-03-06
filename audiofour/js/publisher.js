 //URL to millicast API
  const apiPath = 'https://director.millicast.com/api/director/publish';
  const turnUrl = 'https://turn.millicast.com/webrtc/_turn';
  const audio = document.querySelector('audio');

  //Millicast required info.
  let url;// path to Millicast Server - Returned from API
  let jwt;//authorization token - Returned from API

  // hard code it here, or enter it at runtime on the field.
   let params = new URLSearchParams(document.location.search.substring(1));
   let accountId = 'ACCTID'; //let accountId ADD YOUR ACCOUNT ID HERE
   let streamName = params.get('id');
   let token ="YOUR TOKEN GOES HERE";
   console.log('Millicast Viewer Stream: ', streamName);

   let stream1 = "https://YOUR_SITE.com/audiofour/pub/?id=live1";
   let stream2 = "https://YOUR_SITE.com/audiofour/pub/?id=live2";
   let stream3 = "https://YOUR_SITE.com/audiofour/pub/?id=live3";
   let stream4 = "https://YOUR_SITE.com/audiofour/pub/?id=live4";

   let player1 = "player/?id=live1";
   let player2 = "player/?id=live2";
   let player3 = "player/?id=live3";
   let player4 = "player/?id=live4";
  
function switchSrc1() {
    var sites = [stream1]
    document.getElementById('user1').src = sites[Math.floor(Math.random() * sites.length)];
    if (sites==stream1){
    document.getElementById('user2').src =player2 
    document.getElementById('user3').src =player3  
    document.getElementById('user4').src =player4 
    document.getElementById("buttonGo2").style.visibility="hidden";
    document.getElementById("buttonGo3").style.visibility="hidden";
    document.getElementById("buttonGo4").style.visibility="hidden";
    }
  }
   function switchSrc2() {
    var sites = [stream2]
  document.getElementById('user2').src = sites[Math.floor(Math.random() * sites.length)];
   if (sites==stream2){
    document.getElementById('user1').src =player1 
    document.getElementById('user3').src =player3  
    document.getElementById('user4').src =player4 
    document.getElementById("buttonGo1").style.visibility="hidden";
    document.getElementById("buttonGo3").style.visibility="hidden";
    document.getElementById("buttonGo4").style.visibility="hidden";  
    }
  }
  function switchSrc3() {
    var sites = [stream3]
  document.getElementById('user3').src = sites[Math.floor(Math.random() * sites.length)];
    if (sites==stream3){
    document.getElementById('user1').src =player1 
    document.getElementById('user2').src =player2 
    document.getElementById('user4').src =player4 
    document.getElementById("buttonGo1").style.visibility="hidden";
    document.getElementById("buttonGo2").style.visibility="hidden";
    document.getElementById("buttonGo4").style.visibility="hidden";    
    }
  
  }
   function switchSrc4() {
    var sites = [stream4]
  document.getElementById('user4').src = sites[Math.floor(Math.random() * sites.length)];
      if (sites==stream4){
    document.getElementById('user1').src =player1
    document.getElementById('user2').src =player2 
    document.getElementById('user3').src =player3
    document.getElementById("buttonGo1").style.visibility="hidden";
    document.getElementById("buttonGo2").style.visibility="hidden";
    document.getElementById("buttonGo3").style.visibility="hidden";    
    }
  }
  //media stream object from local user mic and camera.
  let stream;
  //peer connection - globalized.
  let pc;
  //web socket for handshake
  let ws;
  //Ice Servers:
  let iceServers = [];
  //form items and variables they are tied to.
  let views      = [
    {form: 'tokenTxt', param: 'token'},
    {form: 'streamTxt', param: 'streamName'},
    {form: 'viewTxt', param: 'accountId'}
  ];


  let isBroadcasting = false;

  function stopBroadcast() {
    console.log('stopBroadcast');
    if(!!pc){
      pc.close();
      //pc = null;
      console.log('close pc');
    }
    if (!!ws){
      ws.close();
      //ws = null;
      console.log('close ws');
    }
    setIsBroadcasting(false);
  }

  function startBroadcast() {
    if(isBroadcasting) {
      stopBroadcast();
      return;
    }
    //if missing params, assume the form has them.
    if (!token || !streamName || !accountId) {
      getFormParams();
    }
    // get a list of Xirsys ice servers.
    getICEServers()
      .then(list => {
        iceServers = list;
        //ready to connect.
        connect();
      })
      .catch(e => {
        //alert('getICEServers Error: ', e);
        connect();//proceed with no (TURN)
      });
    
  }

  function connect() {

    let btn       = document.getElementById('publishBtn');
    btn.value = 'CONNECTING...';
    btn.disabled  = true;

    if (token && !url || token && !jwt) {
      console.log('connect to API - url:', url)
      updateMillicastAuth()
        .then(d => {
          console.log('auth info:', d);
          connect();
        })
        .catch(e => {
          console.log('API error: ', e);
          //alert("Error: The API encountered an problem!", e);
        });
      return;
    }

    console.log('connecting to: ', url + '?token=' + jwt);//token
    //create Peer connection object, add TURN servers for fallback.
    console.log('iceservers: ', iceServers);
    pc = new RTCPeerConnection({iceServers: iceServers, bundlePolicy: "max-bundle"});
    //add media to connection
    stream.getTracks()
      .forEach(track => {
        console.log('audio track: ', track);
        pc.addTrack(track, stream)
      });

    //connect with Websockets for handshake to media server.
    ws    = new WebSocket(url + '?token=' + jwt);//token
    ws.onopen = function () {
      //Connect to our media server via WebRTC
      console.log('ws::onopen ', jwt);//token
      //create a WebRTC offer to send to the media server
      let offer = pc.createOffer({
                                   offerToReceiveAudio: true,
                                   offerToReceiveVideo: true
                                 }).then(desc => {
        console.log('createOffer Success!');
        //set local description and send offer to media server via ws.
        pc.setLocalDescription(desc)
          .then(() => {
            console.log('setLocalDescription Success !:', streamName);
            //set required information for media server.
            let data    = {
              name:  streamName,
              sdp:   desc.sdp,
              codec: 'vp8'
            }
            //create payload
            let payload = {
              type:    "cmd",
              transId: Math.random() * 10000,
              name:    'publish',
              data:    data
            }
            ws.send(JSON.stringify(payload));
          })
          .catch(e => {
            console.log('setLocalDescription failed: ', e);
          })
      }).catch(e => {
        console.log('createOffer Failed: ', e)
      });
    }

    ws.addEventListener('message', evt => {
      console.log('ws::message', evt);
      let msg = JSON.parse(evt.data);
      switch (msg.type) {
        //Handle counter response coming from the Media Server.
        case "response":
          let data   = msg.data;
          let answer = new RTCSessionDescription({
                                                   type: 'answer',
                          sdp:  data.sdp + "a=x-google-flag:conference\r\n",
                          //sdp: data.sdp + "a=MID:video\r\nb=AS:" + 1500 +"\r\n"
                                                 });

          pc.setRemoteDescription(answer)
            .then(d => {
              console.log('setRemoteDescription Success! ');
              isBroadcasting = true;
              showViewURL();
              setIsBroadcasting(true);
            })
            .catch(e => {
              console.log('setRemoteDescription failed: ', e);
              setIsBroadcasting(false);
            });
          break;
      }
    })
  }
  /* Update visual elelments */
  function setIsBroadcasting(b){
    isBroadcasting = b;
    let btn       = document.getElementById('publishBtn');
    btn.value = isBroadcasting ? 'STOP LIVE' : 'START PUBLISH';
    btn.disabled  = false;
      }

  // Gets ice servers.
  function getICEServers() {
    return new Promise((resolve, reject) => {
      let xhr                = new XMLHttpRequest();
      xhr.onreadystatechange = function (evt) {

        
        if (xhr.readyState !== 4) {
            return;
        }

        if (xhr.status < 200 || xhr.status >= 300) {
            let error = new Error(`IceServers call failed. StatusCode: ${xhr.status} Response: ${xhr.responseText}`);
            error.responseStatus = xhr.status;
            error.responseText = xhr.responseText;
            error.responseJson = null;
            reject(error);
            return;
        }

        let jsonResponse = JSON.parse(xhr.responseText);
        if (!jsonResponse || jsonResponse['s'] !== 'ok') {
            let error = new Error(`IceServers invalid response. Response: ${xhr.responseText}`);
            error.responseStatus = xhr.status;
            error.responseText = xhr.responseText;
            error.responseJson = jsonResponse;
            reject(error);
            return;
        }

        // final resolve array
        let finalServers = [];

        let credentials = [];
        let valIceServers = jsonResponse['v']['iceServers'] ? jsonResponse['v']['iceServers'] : jsonResponse['v'] ? jsonResponse['v'] : [];
        console.log('valIceServers', valIceServers, jsonResponse);
        for (const server of valIceServers) {
            // normalize server.urls
            if (server.url) {
                // convert to new url's format if detected
                server.urls = [server.url];
                delete server.url;
            } else if (server.urls && !Array.isArray(server.urls)) {
                // assuming this is using legacy notation where urls is a single string
                server.urls = [server.urls];
            } else {
                // assure we have an array of something
                server.urls = [];
            }

            // skip empty urls
            if (!server.urls.length) {
                continue;
            }
            // now to identify servers with identical credentials

            // not everything has credentials
            if (!server.username || !server.credential) {
                finalServers.push(server);
                continue;
            }

            let credIndex = credentials.findIndex((s) => s.username === server.username && s.credential === server.credential);
            if (credIndex === -1) {
                // new credential pair
                credentials.push(server);
                continue;
            }

            // else we want to merge with credIndex
            let mergeServer = credentials[credIndex];
            for (const urlStr of server.urls) {
                mergeServer.urls.push(urlStr);
            }
        }

        // lets separate udp from tcp and unspecified
        for (const server of credentials) {
            let udpUrls = [];
            let tcpUrls = [];
            let unspecifiedUrls = [];

            for (const urlStr of server.urls) {
                let queryIndex = urlStr.indexOf('?');
                if (queryIndex === -1) {
                    unspecifiedUrls.push(urlStr);
                    continue;
                }

                let queryString = new URLSearchParams(urlStr.substr(queryIndex + 1));
                let transport = queryString.get('transport');
                switch (transport) {
                    case 'udp':
                        udpUrls.push(urlStr);
                        break;
                    case 'tcp':
                        tcpUrls.push(urlStr);
                        break;
                    default:
                        unspecifiedUrls.push(urlStr);
                        break;
                }
            }

            if (udpUrls.length) {
                let newServer = Object.assign({}, server);
                newServer.urls = udpUrls;
                finalServers.push(newServer);
            }
            if (tcpUrls.length) {
                let newServer = Object.assign({}, server);
                newServer.urls = tcpUrls;
                finalServers.push(newServer);
            }
            if (unspecifiedUrls.length) {
                let newServer = Object.assign({}, server);
                newServer.urls = unspecifiedUrls;
                finalServers.push(newServer);
            }
            
        }

        resolve(finalServers);
      }
      xhr.open("PUT", turnUrl, true);
      xhr.send();
    })
  }

  function getMedia() {
    return new Promise((resolve, reject) => {
           
      let constraints = window.constraints = {
      audio: {
      echoCancellation: true,
      sampleRate: 48000,
      //channelCount: 2,
      },
       video: false
       }

      //let constraints = {audio: true, video: false};

      navigator.mediaDevices.getUserMedia(constraints)
        .then(str => {
          resolve(str);
        }).catch(err => {
        console.error('Could not get Media: ', err);
        reject(err);
      })
    });
  }

  // gets server path and auth token.
  function updateMillicastAuth() {
    console.log('updateMillicastAuth for:', streamName);
    return new Promise((resolve, reject) => {
      let xhr                = new XMLHttpRequest();
      xhr.onreadystatechange = function (evt) {
        if (xhr.readyState == 4) {
          let res = JSON.parse(xhr.responseText);
          console.log('res: ', res);
          console.log('status:', xhr.status, ' response: ', xhr.responseText);
          switch (xhr.status) {
            case 200:
              let d = res.data;
              jwt   = d.jwt;
              url   = d.urls[0];
              resolve(d);
              break;
            default:
              reject(res);
          }
        }
      }
      xhr.open("POST", apiPath, true);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify({streamName: streamName}));
    });
  }

  // Display the path to the viewer and passes our id to it.
  function showViewURL() {
    //if no viewer stream id is provided, path to viewer not shown.
    if (!!accountId) {
      let vTxt = document.getElementById('viewerUrl');
      let href = (location.href).split('?')[0];
      console.log('href:', href, ', indexOF ', href.indexOf('htm'), 'lastindex /', href.lastIndexOf('/'));
      if (href.indexOf('htm') > -1) {
        href = href.substring(0, href.lastIndexOf('/') + 1);
      }
      let url        = href + 'viewer.html?accountId=' + accountId + '&streamName=' + streamName;
      vTxt.innerText = 'Viewer Path:\n' + url;
      vTxt.setAttribute('href', url);
    }

    //disable publish button.
    /* let btn       = document.getElementById('publishBtn');
    btn.innerHTML = 'BROADCASTING LIVE';
    btn.disabled  = true; */

    //hide form
    document.getElementById('form').setAttribute("style", "display: none;");
  }

  //sets required data to broadcast and view.
  function setParams() {
    //get millicast id from url if undefined in variable above. otherwise use show a form at runtime.
    let params = new URLSearchParams(document.location.search.substring(1));
    if (!token) {//if we have token, bypass this.
      token = params.get('token');//if no token, try url params.
    }
    if (!streamName) {
      streamName = params.get('streamName');
    }
    if (!accountId) {
      accountId = params.get('accountId');
    }

    console.log('setParams - token:', token, ' name: ', streamName, ', viewer ID:', accountId, ', mc url:', url, ', TURN url', turnUrl);
    //if still missing token in the URLS for any of them, show form.
    if (!token || !streamName || !accountId) {
      document.getElementById('form').setAttribute("style", "display: unset;");
      let i, l = views.length;
      for (i = 0; i < l; i++) {
        let item = views[i];
        let txt  = document.getElementById(item.form);
        console.log('item ', item, ' txt:', txt);
        switch (item.param) {
          case 'token':
            txt.value = !!token ? token : '';
            break;
          case 'streamName':
            txt.value = !!streamName ? streamName : '';
            break;
          case 'accountId':
            txt.value = !!accountId ? accountId : '';
            break;
        }
      }
    }
    if (token) {// && !!url
      updateMillicastAuth()
        .then(d => {
          console.log('millicast auth data:', d);
        })
        .catch(e => {
          console.log('api error: ', e);
        })
    }
  }

  function getFormParams() {
    let i, l = views.length;
    for (i = 0; i < l; i++) {
      let item = views[i];
      let txt  = document.getElementById(item.form).value;
      console.log('item ', item, ' txt:', txt);
      switch (item.param) {
        case 'token':
          token = txt;
          break;
        case 'streamName':
          streamName = txt;
          break;
        case 'accountId':
          accountId = txt;
          break;
      }
    }
    console.log('getFormParams - token:', token, ', streamName:', streamName, ', accountId:', accountId);
  }

  function toggleMic() {
    let b = !stream.getAudioTracks()[0].enabled;
    stream.getAudioTracks()[0].enabled = b;
    let micMuted = !b;
    console.log('toggleMic muted:', micMuted);
    //micOffIcon
    let btn = document.getElementById('micMuteBtn');
    btn.value = micMuted ? 'UNMUTE MIC' : 'MUTE MIC';
  }

  //START

  function ready() {
    console.log('Millicast token: ', token);
    //sets required data to broadcast and view.
    setParams();

    //Setup publish button
    let pubBtn = document.getElementById('publishBtn');
    if (pubBtn) {
      pubBtn.onclick = evt => {
        startBroadcast();
      };
    }

    //Get users camera and mic
    getMedia()
      .then(str => {
        stream     = str;
        //set cam feed to video window so user can see self.
        let vidWin = document.getElementsByTagName('video')[0];
        if (vidWin) {
          vidWin.srcObject = stream;
        }
      })
      .catch(e => {
        alert('getUserMedia Error: ', e);
      });
  }

  if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
    ready();
  } else {
    document.addEventListener('DOMContentLoaded', ready);
  }