var One = $('[data-number="1"]');
var Two = $('[data-number="2"]');
var Three = $('[data-number="3"]');
var Four = $('[data-number="4"]');
var Five = $('[data-number="5"]');
var Six = $('[data-number="6"]');
$(function () {
  console.log("JS INITIATED");
  One.on("click", function () {
    console.log("one clicked");
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
});
