/**Prototype für Umgang mit B&R binaries für die eine Typ-Datei geparst wurde
 *
 *@author TK, 04/2021, version 1.0.1
                        - 1.0.2   Vehalten für meherer typdaten debugged
                                  Verhalten für parseTypedFiles aus verschiedenen subdomains debugged
 *
*/

class BinaryBRTypedFile extends BinaryBRStructFile{
  /** parst alle Dateien im typ-ordner
   * estellt objectarray "brStructs" aller ": 	STRUCT" Elemente
   * bereitet name und typstring in BRStructType[] auf
   */

  static parseTypedFiles(){
    //klassenvariablen mit Dateinamen im typ ordner
    this.BR_TYPE_FILES =[
       "myStruct"
       //,"fatdumb"
       //mit komma weitere dateien einhängen...
    ];
    //hier werden rohinformationen der Structs abgelegt
    this.brStructs = [];
    //zähler für gefundene structs, interne nutzung
    this.brStructsParsed = 0;

    var rq = new Array(BinaryBRTypedFile.BR_TYPE_FILES.length);

    BinaryBRTypedFile.BR_TYPE_FILES.forEach(function(typ_e, index){  //geht durch alle BR_TYPE_FILES im ordner

      rq[index] = new XMLHttpRequest();
      rq[index].responseType="text";
      rq[index].open('GET', '\\typ\\' + typ_e + '.typ', true);
      rq[index].onload = function(){
        var s=rq[index].response;
        s=s.replace(/\s/g,''); //entfernt whitespaces
        s=s.replace(/\(\*(.*?)\*\)/g,'');	//entfernt kommentare
        s=s.substr(4,s.length - 12);	//entfernt hauptrahmen TYPE/END_TYPE

        while (s.indexOf(":STRUCT")!=-1){//alle struct container übernehmen und splitten
          var n=s.substr(0,s.indexOf(":STRUCT")); //holt structname
          if (BinaryBRTypedFile.brStructs.find(parsed_structs_e => parsed_structs_e.name==n)!=undefined) {
            alert("multiple use of " + n + " in B&R structfile: " + BR_TYPE_FILES_Element);
            return 0;
          }else{
            var struct = new BRStructType(n);//erzeugt neue hüllklasse
            s=s.substr(s.indexOf(":STRUCT")+7); //entfernt struct header structname
            //alert(s);
            n=s.substr(0,s.indexOf("END_STRUCT;")-1); //extrahiert in neuen string ohne struct tail, -1 für letztes semikolon (split)
            //alert(n);
            s=s.substr(s.indexOf("END_STRUCT;") + 11); //entfernt entnommenen teilstring
            //alert(s.length);
            struct.brRawParse=n.split(";"); //kindelemente schon im 2 dimensionalen arry aufbereiten (0-nameStr,1-typStr)[unterelement]
            for (var i=0; i<struct.brRawParse.length;i++){ //alle unterstrukturen
              //pauschal initialisierung z.B. ":=1" am ende abschneiden
              if (struct.brRawParse[i].indexOf(":=")!=-1){
                struct.brRawParse[i]=struct.brRawParse[i].substr(0,struct.brRawParse[i].indexOf(":="));
              //	alert(element);
              }
              var test = struct.brRawParse[i].split(':');
              //alert(test[1]);
              //alert(singleChildStr[0] + "--" + singleChildStr[1] + "--" + singleChildStr);
              if (test.length!=2) {
                alert("child element not formed well: "+ struct.brRawParse[i] + " in " + struct.name);
                return 0;
              }
              struct.brRawParse[i]=[test[0],test[1]];
            }
            //alert (struct.brRawParse[0]);
          }
          BinaryBRTypedFile.brStructs.push(struct); //object
          BinaryBRTypedFile.brStructsParsed++;
        }//end_while
        //zukünftiger platz für call des eventHandlers in HMI nach parsen der letzten StructDatei
        if (BinaryBRTypedFile.brStructsParsed == BinaryBRTypedFile.BR_TYPE_FILES.length) {
            //alert(BinaryBRTypedFile.brStructs[0].brRawParse);
        }
        //alert("empfang" + BinaryBRTypedFile.brStructsParsed);
      };
      rq[index].send();
    });
  }
  /**
      - nimmt blob und structname entgegen und versucht die JS Entsprechung der struktur zu erzeugen
      - verwendet dazu die BRTypedFile.brStructs aus Klassenvariable und die Klasse BRStructType
   *
   */
  constructor(b,defname){
    super(b);
    this.bytesRead=this.offset;
    this.elements = this.makeStructNodes(defname).node;
    this.bytesRead=this.offset - this.bytesRead //letzte offsetverschiebung zurücknehmen (gilt erst für weiteren speicherbereich)
  }
  /**
    hängt kindelement in elternknoten eine
    @param node  ref auf  Elternelement
    @param nodeName  name des einzuhängenden value-blattes oder object-knotens
    @param nodeType getrimmter B&R typstring aus strkturdefinitione
  */
  makeStructNodes(nodeType){ //nodeName raus, der kann immer aus structdef entnommen werden und node wird vor dem eigentlichen call erzeugt!
    //alert("start rek: " + node);
    var out=new Object();
    out.corrected = 0;
    var atomarType = this.isAtomarBRType(nodeType);
    if (atomarType===true) {//echter atomarer Typ, außer STRING als blatt
      out.corrected=this.correctOffset(nodeType);
      out.node=this.makeAtomarValue(nodeType);
      return out;
      //alert(node[nodeName]);
    }else if (Number.isInteger(atomarType)){//atomarer String als blatt
      out.corrected = this.correctOffset("STRING");
      out.node = this.makeAtomarValue("STRING",atomarType);
      return out;
    }else if (nodeType.indexOf("ARRAY")!=-1){ //array marker erkannt, behandeln....
      if (nodeType.indexOf(",")!=-1){
        alert("unhandled unidimensional array: "+ nodeType + " , parsing stopped! ");
        out.corrected = 0;
        out.node = false;
        return out;
      }
      //lauflänge extrahieren
      var first = nodeType.indexOf('[0..') + 4;
      //  alert("first: " + first);
      var last = nodeType.indexOf(']');
      //  alert("last: " + last);
      var arLen = parseInt(nodeType.substr(first,last - first)) + 1;
      //  alert("lenstr: " + lenStr);
      var arTypeStr = nodeType.substr(last + 3,nodeType.length);
      //darüber iterieren
      var node=new Array(arLen);
      var atomarArType = this.isAtomarBRType(arTypeStr);
      if (atomarArType===true) {//echter atomarer Typ, außer STRING als array
        out.corrected = this.correctOffset(arTypeStr);
        for (var indexArray=0; indexArray < arLen; indexArray++)
          node[indexArray]=this.makeAtomarValue(arTypeStr);
        out.node=node;
        return out;
      }else if (Number.isInteger(atomarArType)){//atomarer String als array
        out.corrected = this.correctOffset("STRING");
        for (var indexArray=0; indexArray < arLen; indexArray++)
          node[indexArray]=this.makeAtomarValue("STRING",arTypeStr);
        out.node=node;
        return out;
      }else{ //struct als array
        for (var indexArray=0; indexArray < arLen; indexArray++){ //wegen prüfung an elemnt 1, schleife an 1 durchzählen
          //if (arTypeStr == 'file_cal_typ') alert ("offset cCL now: " + this.offset);
          var back= new Object();
          back=this.makeStructNodes(arTypeStr); //für alle struct[] rekursionstiefe erhöhen
          node[indexArray] = back.node;
        }
        //letztes elment pauschal zur ermittlung des korekturoffsets nutzen
        out.corrected = back.corrected;
        out.node=node;
        return out;
      }
    }else{//struct als blatt auflösen
      var fund=BinaryBRTypedFile.brStructs.find(parsed_structs_e => parsed_structs_e.name==nodeType);
      if (fund==undefined){
        alert("structname: " + nodeType + " unknown, parsing stopped!");
        out.corrected = 0;
        out.node = false;
        return out;
      }else{ //über alle Elemente der Strukturdefinition iterieren und rekursionstiefe erhöhen
        var node = new Object;
      //  if (nodeType == 'seq_Slot_typ') alert ("offset for: " + nodeType + " at : " + this.offset);
        for (var indexArray=0; indexArray < fund.brRawParse.length; indexArray++){
          try {
            //if (fund.brRawParse[indexArray][0] == 'changed') alert ("offset for vname: " + fund.brRawParse[indexArray][0] + " at: " + this.offset);
            var back= new Object();
            back = this.makeStructNodes(fund.brRawParse[indexArray][1]);
            node[fund.brRawParse[indexArray][0]] = back.node;
            if (back.corrected > out.corrected) out.corrected = back.corrected; //hier Modulooperator abhängig von unterelmenten setzen, je nach enthaltenen unterelementen 0, 2 oder 4
          } catch (e) {
            alert("parsing struct fails at offset: " + this.offset + " for: " + fund.brRawParse[indexArray][0] + ":" + fund.brRawParse[indexArray][1] + "with exception: " + e);
          } finally {

          }
        }
        if (out.corrected > 0) while ((this.offset % out.corrected)!=0)this.offset++;//nachgelagerte korrektur nach fertigstellung eines structs, intern dynamische entscheidung auf welches vielfaches
        out.node=node;
        return out;
      }
    }
  }
  /**
    bei der internen ablage in B&R Structs,
    wird ein folgendes element automatisch auf speicher-offset gelegt, die dem nächsten vielfachen der
    datentyp-speichergröße entsprechen

    !!!Ausnahme: Das gesamte strucht nimmt immer das nächste vielfache von 4 im speicher ein
     wenn das struct nur 1 byte untertypen enthällt, dann wird auch nicht korrigiert
  */
   correctOffset (typestr){
     switch(typestr) {
       case 'BOOL':
       case 'USINT':
       case 'SINT':
       case 'STRING':
       //nix
       return 0;
       break;
       case 'UINT':
       case 'INT':
       while ((this.offset % 2)!=0)this.offset++;
       return 2;
       break;
       case 'UDINT':
       case 'DINT':
       case 'DATE_AND_TIME':
       case 'REAL':
       while ((this.offset % 4)!=0)this.offset++;
       return 4;
       break;
       /*case 'END_STRUCT':
       //dynamische entscheidung, mit welchem modulo eine Korrektur nach strukterzeugung stattfinden muss
       if (this.structByteCorrection > 0)
        while ((this.offset % this.structByteCorrection)!=0)this.offset++;
       break;*/
       default:
         if (typeof(typestr) == "undefined"){
           alert("atomar type identifier is undefined: " + typestr);
         }else
           alert("atomar type identifier: " + typestr + " unhandled");
         }
     }
 /**
   fallunterscheidun für typstr
   Rückgabe true für atomare Basistypen
   int mit stringlänge für string
 */
  isAtomarBRType (typestr){
    switch(typestr) {
      case 'BOOL':
      case 'USINT':
      case 'UINT':
      case 'UDINT':
      case 'SINT':
      case 'INT':
      case 'DINT':
      case 'DATE_AND_TIME':
      case 'REAL':   return true;
      break;
      default:
        if (typeof(typestr) == "undefined"){
          alert("atomar type identifier is undefined: " + typestr);
        }else if(typestr.indexOf("STRING")!=-1){//single string
          var lenStr= typestr.substr(typestr.indexOf('[')+1,typestr.length - 1);
          return parseInt(lenStr);
        }else{
        //  alert("atomar type identifier: " + typestr + " unhandled");
          return false;
        }
    }
  }
/**
    nimmt atomaren typstring entgegen und gibt  werte der
    JS entsprechung der binärdaten zurück
    dabei wird offset hochgezählt
*/
  makeAtomarValue(type,length){
    if (length==null){
      switch(type) {
    	  case 'BOOL': 	 return this.makeBOOL();
        break;
    	  case 'USINT':  return this.makeUSINT();
        break;
        case 'UINT':   return this.makeUINT();
        break;
        case 'UDINT':  return this.makeUDINT();
        break;
        case 'SINT':   return this.makeSINT();
        break;
        case 'INT':    return this.makeINT();
        break;
        case 'DINT':   return this.makeDINT();
        break;
        case 'DATE_AND_TIME': return this.makeDT();
        break;
        case 'REAL':   return this.makeFLOAT();
        break;
    	  default:
    		  alert("atomar type identifier: " + type + " unhandled");
    	}
    }else{
      switch(type) {
        case 'STRING':  return this.makeSTR(length);
        break;
        default:
          alert("atomar type identifier: " + type + " unhandled");
      }
    }
  }
  /**
    Erzeugt DOM-String der B&R Strukturentsprechung
    ein aufruf löst einen struct auf
    --noch nicht ganz durchentwickelt, aber prinzipiell machbar.
    PROBLEM: ein nachträgliches $.append ist zu träge
    PROBLEM: ein nachträgliches einhängen von clickEventhandler an die node klassen, lässt bei der riesigen struktur,
    den stack überlaufen,

    debugging der offset regeln erst mal via konsole und heapsnapshot
    danach spezialisierte klassen zum menschenlesbaren aufbereiten der haupstrukturen
    - config
    - profile
    - seq
    ...

  */
  toHtmlDOM(node,level){
    if (node==null){
      this.s='';
      this.toHtmlDOM(this.elements,0);
    }else{
      //alert("rek call");
      //<span class="struct_level struct_level_' + level + '">
      if ((typeof node === 'number') || (typeof node === 'string') || (typeof node === 'boolean') || (node instanceof Date)){
        this.s+='<span class="struct_vname">' + nodeName + '</span>';
        this.s+='<span class="struct_value">' + node + '</span><br>';
      }else if (Array.isArray(node)){ //falls node ein array ist
        //header auf gleichem level s+ ohne []
        this.s+='<span class="struct_level_' + level + '"><span class="struct_sname">' + nodeName + '</span><br>';
        if ((typeof node[0] === 'number') || (typeof node[0] === 'string') || (typeof node[0] === 'boolean') || (node[0] instanceof Date)){//array von atomarem typ
          for (var indexArray=0; indexArray < node.length; indexArray++){
            this.s+='<span class="struct_level struct_level_' + (level + 1) + '"><span class="struct_vname">' + nodeName + '[' + indexArray + ']</span>';
            this.s+='<span class="struct_value">' + node[indexArray] + '</span></span><br>';
          }
        }else if(typeof node[0] === 'object'){      //array von objectknoten
        //  alert(typeof node[0]);
          //dann über jedes elemnt nodeName erzeugen mit [] und rekursiver aufruf mit level + 1
          //this.s+='<span class="struct_level_' + level + '"><span class="struct_sname">' + nodeName + '</span></span><br>';
          for (var indexArray=0; indexArray < node.length; indexArray++)
            this.toHtmlDOM(node[indexArray],nodeName + '[' + indexArray + ']',level + 1);
        }else{
          alert("unhandled node type: " + typeof node[0] + "in: " + nodeName);
        }
      }else if(typeof node === 'object'){ //object als blatt
        this.s+='<span class="struct_level_' + level + '"><span class="struct_sname">' + nodeName + '</span></span><br>';
        for (var e in node) { //über alle objektknoten ein rekursiver aufruf
          if (node.hasOwnProperty(e)) {
            this.toHtmlDOM(node[e],e,level + 1);
          }
        }
      }else{
        alert("unhandled node type: " + typeof node + "in: " + nodeName);
      }
    }
  }
}
