
TYPE
	testStruct_typ : 	STRUCT 
		New_Member6 : UDINT := 1;
		New_Member5 : USINT := 25;
		New_Member7 : SINT := -5;
		New_Member1 : USINT := 5;
		New_Member2 : UINT := 18;
		New_Member3 : testSubstructTyp;
		New_Member4 : STRING[80] := 'hallowelt';
	END_STRUCT;
	testSubstructTyp : 	STRUCT 
		New_Member2 : DATE_AND_TIME;
		New_Member3 : USINT := 255;
		New_Member1 : UDINT := 455667;
	END_STRUCT;
END_TYPE
