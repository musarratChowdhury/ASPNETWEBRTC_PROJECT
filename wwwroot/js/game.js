// @ts-ignore
var connection = new signalR.HubConnectionBuilder()
    .withUrl("/game")
    .build();
let ROOM_ID = document.querySelector("#roomidtext").textContent;
console.log(ROOM_ID);
let peerId = "";

const myPeer = new Peer();
//#region PEER EVENT "open"
myPeer.on("open", (id) => {
     peerId = id;
    const startSignalR = async () => {
        await connection.start();
        await connection.invoke("JoinRoom", ROOM_ID, peerId);
    };
    startSignalR();


});
//#endregion


var One = $('[data-number="1"]');
var Two = $('[data-number="2"]');
var Three = $('[data-number="3"]');
var Four = $('[data-number="4"]');
var Five = $('[data-number="5"]');
var Six = $('[data-number="6"]');

     
One.on("click", function () {
    connection.invoke("NUMBER_PRESSED", ROOM_ID, connection.connectionId, 1);
});
Two.on("click", function () {
    console.log("Two clicked");
});
Three.on("click", function () {
    console.log("Three clicked");
});
Four.on("click", function () {
    console.log("Four clicked");
});
Five.on("click", function () {
    console.log("Five clicked");
});
Six.on("click", function () {
    console.log("Six clicked");
});

