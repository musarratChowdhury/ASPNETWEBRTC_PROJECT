
// @ts-ignore
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/game")
    .build();

var One = $('[data-number="1"]');
var Two = $('[data-number="2"]');
var Three = $('[data-number="3"]');
var Four = $('[data-number="4"]');
var Five = $('[data-number="5"]');
var Six = $('[data-number="6"]');

$(() => {
  console.log("JS INITIATED");
  const ROOM_ID =document.querySelector("#roomidtext").textContent;
  console.log(ROOM_ID)
  One.on("click", () => {
    connection.invoke(ROOM_ID, )
  });
  Two.on("click", () => {
    console.log("Two clicked");
  });
  Three.on("click", () => {
    console.log("Three clicked");
  });
  Four.on("click", () => {
    console.log("Four clicked");
  });
  Five.on("click", () => {
    console.log("Five clicked");
  });
  Six.on("click", () => {
    console.log("Six clicked");
  });
});
