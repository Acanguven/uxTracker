$('input.cc-num').payment('formatCardNumber').on("keyup change", function(){
  var type = $.payment.cardType( $(this).val() );
  if(type == "visa"){
    $(".company").html("VISA");
    $(".card").attr("data-type", "visa");
  } else if(type == "mastercard"){
    $(".company").html("<div></div><div></div>");
    $(".card").attr("data-type", "mastercard");
  }else{
    $(".card").attr("data-type", "unknown");
    $(".company").html("CARD");
  }
});
$('input.cc-exp').payment('formatCardExpiry');
$('input.cc-cvc').payment('formatCardCVC');
$(".button.flip").click(function(){
  $(".card").toggleClass("flip");
});

$("#buy").click(function(){
  var pack = $(this).attr("pack");
  var uid = $(this).attr("uid");
  top.location.href = "api/givePack/"+uid+"/"+pack;
});