const ROOM_ID = document.querySelector("#roomidtext").innerText;
let userId = null;
let localStream = null;
const peers = {};

const connection = new signalR.HubConnectionBuilder()
  .withUrl("/meeting")
  .build();
const videoGrid = document.querySelector("#video-grid");
const shareLinkDiv = document.querySelector("#share-link");
const copyButton = document.getElementById("copyButton");
const copyTarget = document.getElementById("copyTarget");
const currentURL = location.href;
const myVideo = document.createElement("video");
myVideo.muted;

const myPeer = new Peer();
//#region PEER EVENT "open"
myPeer.on("open", (id) => {
  userId = id;
  const startSignalR = async () => {
    await connection.start();
    await connection.invoke("JoinRoom", ROOM_ID, userId);
  };
  startSignalR();
});
//#endregion
//#region PEER EVENT CALL
// myPeer.on("call", (call) => {
//   call.answer(localStream);

//   const userVideo = document.createElement("video");
//   call.on("stream", (userVideoStream) => {
//     addVideoStream(userVideo, userVideoStream);
//   });
// });
myPeer.on("call", (call) => {
  console.log(call.provider.id);
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: true,
    })
    .then((stream) => {
      call.answer(stream);
      const userVideo = document.createElement("video");
      call.on("stream", (remoteStream) => {
        addVideoStream(userVideo, remoteStream);
      });
    })
    .catch((err) => {
      console.error("Failed to get local stream", err);
    });
});
//#endregion
//#region SIGNALR EVENT 'user-connected'
connection.on("user-connected", (id, roomId) => {
  if (userId == id) return;
  console.log(`New user in the room : ${id} with roomId ${roomId}`);
  connectToNewUser(id, localStream);
});
//#endregion
//#region SIGNALR EVENT 'user-disconnected'
connection.on("user-disconnected", (id) => {
  console.log(`User disconnected ${id}`);
  if (peers[id]) peers[id].close();
});
//#endregion
//#region CAMERA CONNECTED
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);
    localStream = stream;
  })
  .catch((err) => {
    console.error("FAILED TO GET LOCAL STREAM ", err);
  });
//#endregion
//#region NECESSARY FUNCTIONS -> AddVideoStream, ConnectNewUser
function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}
function connectToNewUser(userId, localStream) {
  const call = myPeer.call(userId, localStream);
  const userVideo = document.createElement("video");
  call.on("stream", (remoteStream) => {
    addVideoStream(userVideo, remoteStream);
  });
  call.on("close", () => {
    userVideo.remove();
  });

  peers[userId] = call;
}
//#endregion

//#region Share Link
console.log(currentURL);
copyTarget.innerText = currentURL;

copyButton.addEventListener("click", function (event) {
  const textToCopy = copyTarget.innerText;
  navigator.clipboard
    .writeText(textToCopy)
    .then(function () {
      console.log("Text copied to clipboard");
    })
    .catch(function (error) {
      console.error("Error copying text: ", error);
    });
});

//#endregion
