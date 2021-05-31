
PROGRAM _INIT
	(* Insert code here *)
	 
END_PROGRAM

PROGRAM _CYCLIC
	
	teststruct;
	
	CASE step OF
		0: // warte	
			FileDelete_0.enable:=0;
			FileCreate_0.enable:=0;
			FileWrite_0.enable:=0;
			FileClose_0.enable:=0;
					
		1: //löschen alte datei
			IF FileDelete_0.enable=0 THEN
				FileDelete_0.enable := 1;
				FileDelete_0.pDevice:=ADR(LOCALDEVICE);
				FileDelete_0.pName:=ADR('web/a51/myStruct.bin');
			END_IF;
			IF FileDelete_0.status  <> ERR_FUB_BUSY AND FileDelete_0.status <> ERR_FUB_ENABLE_FALSE THEN
				FileDelete_0.enable:=0;
				step:=2;			
			END_IF;
		
		2: //create neue
			IF FileCreate_0.enable=0 THEN
				FileCreate_0.enable := 1;
				FileCreate_0.pDevice:=ADR(LOCALDEVICE);
				FileCreate_0.pFile:=ADR('web/a51/myStruct.bin');
			END_IF;
			
			IF FileCreate_0.status  <> ERR_FUB_BUSY AND FileCreate_0.status  <> ERR_FUB_ENABLE_FALSE THEN
				FileCreate_0.enable:=0;
				IF FileCreate_0.status <> ERR_OK THEN
					step:=0;
				ELSE
					step:=3;
					fileIdent:=FileCreate_0.ident;
				END_IF;							
			END_IF;
			
		3:// schreiben
			
			IF FileWrite_0.enable=0 THEN
				FileWrite_0.ident:=fileIdent;
				FileWrite_0.offset:=0;
				FileWrite_0.pSrc:=ADR(teststruct);
				FileWrite_0.len:=SIZEOF(teststruct);
				FileWrite_0.enable:=1;	
			END_IF;
			IF FileWrite_0.status  <> ERR_FUB_BUSY AND FileWrite_0.status  <> ERR_FUB_ENABLE_FALSE THEN
				FileWrite_0.enable:=0;
				IF FileWrite_0.status <> ERR_OK THEN				
					step:=0;
				ELSE
					step:=4;
					
				END_IF;
			END_IF;
		4://schließen
			
			IF FileClose_0.enable=0 THEN
				FileClose_0.ident:=fileIdent;
				FileClose_0.enable:=1;	
			END_IF;
			IF FileClose_0.status  <> ERR_FUB_BUSY AND FileClose_0.status  <> ERR_FUB_ENABLE_FALSE THEN
				FileClose_0.enable:=0;
				step:=0;
			END_IF;
	END_CASE;
	
	FileDelete_0();
	FileCreate_0();
	FileWrite_0();
	FileClose_0();
	
	 
END_PROGRAM

PROGRAM _EXIT
	(* Insert code here *)
	 
END_PROGRAM

