

import $ from 'jquery';

$(()=>{
    console.log("hello");
    console.log('how are you?');
    
    $(".one").on("click",()=>{
        console.log("one clicked")
    })
})
