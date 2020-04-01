# MIllicast-Band-Live-
MIllicast Audio Only for Four

You will need a Millicast account for this project.
https://millicast.com/

1. In your Millicast portal(+) Add a new token M
Make sure to select Usw ANY name!!!!!!

With these files.
1. Open the JS/Publisher.js file.
2. Open the JS/viewer.js file.
EDIT THE FOLLOWING

let accountId = ''YOURID'; //let accountId ADD YOUR ACCOUNT ID HERE
let token ="REPLACE WITH YOUR TOKEN";   //YOUR TOKEN FOR STREAM goes HERE

EDIT THE FOLLOWING ON PUBLISHER JS.
1. Open the JS/Publisher.js file.
let token ="YOUR TOKEN GOES HERE";

   
// CHANGE THE NAMES AS NEEDED AND PATH YOURSITE and the file folder

   let stream1 = "https://YOURSITE.com/audiofour/pub/?id=live1";
   let stream2 = "https://YOURSITE.com/audiofour/pub/?id=live2";
   let stream3 = "https://YOURSITE.com/audiofour/pub/?id=live3";
   let stream4 = "https://YOURSITE.com/audiofour/pub/?id=live4";

 Your ready to stream and customize your way. 
 
If you want to publish the stream the four players I have set up the all.html player in the player folder to use. You can screen grab using https://obsproject.com/ with screen capture. I would use the WebRTC in your portal to publish the 4 audio streams if you want it in real time.
example link
https://YOUR_SITE.com/audiofour/player/all.html

