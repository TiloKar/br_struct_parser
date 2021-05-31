"use strict";
var AAAmyStruct = {};

var onButtonClick = function ()  {
	var xhr = new XMLHttpRequest(); //	binRequest = new XMLHttpRequest();
	xhr.responseType="arraybuffer"; //	binRequest.responseType="arraybuffer";
	xhr.open("GET", "\\a51\\myStruct.bin", true);//binRequest.open("GET", path, true);
	xhr.onload = function(){
		var temp = new BinaryBRTypedFile(xhr.response,'testStruct_typ'); //trendobject synchron erzeugen
		AAAmyStruct=temp.elements;
		alert('see F12->sources->pause->scope->global, that object was constructed');
	};
	xhr.send();
	//added a comment
};
window.onload = function ()  { //beim ersten Webseite laden
	BinaryBRTypedFile.parseTypedFiles(); //parsed die B&R Typdateien
};
