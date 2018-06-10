// ==UserScript==
// @name         JoyMails-Helper
// @version      0.5
// @description  Erzeugt Mails zufällig UND angepasst an Wochentag, Uhrzeit, Menge der Komplimente und Kommentare
// @author       Aki
// @match https://www.joyclub.de/clubmailv3/*
// @grant        none
// ==/UserScript==

//TODO
// Feiertage und Wochenende
// Komplimente-Mails (article) mit hidden verstecken
// unsichtbar-toggle
// Vorlagen für Kontakte
// Durch Mails navigieren


"use strict";

const logging = true;
log("Script Start");

// ########################### Variablen ###########################
const Unterschrift = "Aki";

// Dankesvorlagen "!" wird ersetzt durch "für die Komplimente!" etc.
const DankesVorlagen = [
    "*grins* Dankeschön! *knicks*",
    "Danke! *knicks* *blumenwiese*",
    "*danke*schön!"
];

// Wenn jemand mehr als 10 Komplimente schickt
const DankesVorlagen_fuer_Massenkomplimente = [
    "*liebguck* Wow! Danke für die vielen Komplimente! *knicks**blumenschenk*",
    "Hui *wow* Sooo viele Komplimente! Dankeschön! *knicks*",
    "Oh wie schön *grins* Ich liebe Komplimente. Dankeschön! *knicks*"
];

// "schönen" wird durch zufällige Adjektive ersetzt und "Tag" durch beispielsweise "Donnerstagabend"
const GrussformelVorlagen = ["Hab einen schönen Tag!",
                       "Genieß den Tag!",
                       "Einen schönen Tag noch!"
                      ];

const GrussformelVorlagenNacht = ["Träum süß! *heia*",
                            "Eine erholsame Nacht dir! *heia*",
                            "*gutenacht*"
                           ];

const Adjektive = {
    "": ["toll", "schön", "angenehm"],
    "morgen": ["toll", "wunderbar", "schön", "angenehm", "ruhig"],
    "nachmittag": [ "schön", "entspannt"],
    "abend": [ "entspannend", "kuschlig", "erholsam", "ruhig"],
    "nacht": ["ruhig"],
};

const Smileys = [
    "zwinker",
    "muffin",
    "tee",
    "kaffee"
];


Element.prototype.appendBefore = function (element) {
  element.parentNode.insertBefore(this, element);
};


Element.prototype.appendAfter = function (element) {
  element.parentNode.insertBefore(this, element.nextSibling);
};


// ########################### Funktionen ###########################

function log(text){
    // Um logging schnell an und aus zu schalten
    if (logging){
        console.log(text);
    }
}

function get_Zufall(array) {
//gibt ein zufälliges Element aus einem Array zurück
    let min = 0;
    let max = array.length-1;
    let zufallsZahl = Math.floor(Math.random() * (max - min + 1)) + min;
    return array[zufallsZahl];
}

function get_wochentag_und_tageszeit(datum){
    // gibt den aktuellen Wochentag und die Tageszeit zurück (für die Grußformel wichtig)

    // Wochentag herausfinden
    let wochentag_int = datum.getDay();
    let tage = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    let wochentag = tage[wochentag_int];
    
    // Tageszeit herausfinden
    let h = datum.getHours();
    let tageszeit = "";
    switch (true) {
        case (h >= 3 && h <= 9):
            tageszeit = "morgen";
            break;
        case (h >= 10 && h <= 12):
            tageszeit = "";
            break;
        case (h >= 13 && h <= 15):
            tageszeit = "nachmittag";
            break;
        case (h >= 16 && h <= 21):
            tageszeit = "abend";
            break;
        case (h >= 22 || h <= 3):
            tageszeit = "nacht";
            break;
        default:
            log("Tageszeit nicht erkannt");
            break;
    }

    // Grußformel zusammensetzen
    return [wochentag, tageszeit];
}

function ist_kompliment(mail){
    let mailTextElement = mail.querySelector("p")
    let mailText

    if (mailTextElement) mailText = mailTextElement.innerHTML;
    else return false;

    //let mailtext = mail.children[0].innerHTML;
    if (mailText.includes("Kompliment für dein")) {
        return true;
    }
    return false;
}

function ist_eigene_mail(mail){
    let meineMail = mail.querySelector("div.conv-detail-msg.clearfix.my_msg");
    if (meineMail) return true;
    else {return false;}
}

function ist_erste_ungelesene_mail(mail){
    let ungelesenInfo = mail.querySelector("div.cm-msg-list-paging-text-separator");
    if (ungelesenInfo) return true;
    else {return false;}
}

function ist_erste_heute_mail(mail){
    let zeitInfo = mail.querySelector("div.cm-msg-list-paging-date-separator time");
    if (zeitInfo && zeitInfo.innerHTML == "Heute") return true;
    else {return false;}
}

function verstecke_komplimente(){
    // versteckt Komplimente im Mailverlauf

    let mailListe = document.querySelectorAll("section.cm-msg-list article")
    if (!mailListe) {
        log("Mails noch nicht geladen");
        return;
    }
    let anzahl_komplimente = 0;
    let anzahl_neue_komplimente = 0;
    let mail;

    // Mails von alt bis neu durchgehen um unbeantwortete Komplimente und Kommentare zu zählen
    for (let i = 0; i < mailListe.length; i++) { // letzte Mail ist Vorschau -> nicht löschen

        mail = mailListe[i];

        if (ist_kompliment(mail) && !ist_erste_ungelesene_mail(mail) && !ist_erste_heute_mail(mail)){
            anzahl_neue_komplimente++;
            anzahl_komplimente++;
            mail.setAttribute("hidden", true);
        }

        if (ist_eigene_mail(mail)){
            anzahl_neue_komplimente = 0;
        }
    }
    if (anzahl_komplimente){
        let buttonText;
        if (anzahl_neue_komplimente) buttonText = anzahl_neue_komplimente + " neue Komplimente"
        else buttonText = "alle Komplimente anzeigen"
        sMenue.toggleKomplimenteButton.button.innerHTML = buttonText;
        sMenue.toggleKomplimenteButton.button.appendAfter(mail.parentNode);
    }
}

function get_anzahl_kommentare_und_komplimente(){
    // findet im Mailverlauf die Anzahl meiner erhaltenen Komplimente und Kommentare
    // nach meiner letzter Nachricht

    let mailliste = document.getElementsByClassName("cm-bubble clearfix");
    let anzahl_komplimente = 0;
    let anzahl_kommentare = 0;

    // Mails von alt bis neu durchgehen um unbeantwortete Komplimente und Kommentare zu zählen
    for (let i = 0; i < mailliste.length; i++) {

        let mail = mailliste[i];
        let mailtext = mailliste[i].children[0].innerHTML;
        let nachricht_ist_kompliment = false;

        if (mailtext.includes("Kompliment für dein")) {
            anzahl_komplimente++;
        }
        if (mailtext.includes("Kommentar zu dein")) {
            anzahl_kommentare++;
        }
        // wenn ich schon eine Antwort geschrieben habe, muss der Counter für Komplimente und Kommentare auf Null gesetzt werden
        if (mail.innerHTML.includes("is_counterpart_deleted")) { // mail ist von mir
            anzahl_komplimente = 0;
            anzahl_kommentare = 0;
        }
    }

    return {kommentare: anzahl_kommentare,
            komplimente: anzahl_komplimente}
}

function erzeuge_grussformel(datum){
    // Baut eine zufällige Grußformel zusammen aus zufällig auswählen Vorlagen
    // Adjektiven und passender Tageszeit

    let wt = get_wochentag_und_tageszeit(datum);
    let wochentag = wt[0];
    let tageszeit = wt[1];

    let AdjektivEndungen = {
        "": "en",
        "morgen": "en",
        "nachmittag": "en",
        "abend": "en",
        "nacht": "e",
    };

    let zufaelligesAdjektiv = get_Zufall(Adjektive[tageszeit]);
    zufaelligesAdjektiv += AdjektivEndungen[tageszeit];

    let zufaelligeGrussformel = get_Zufall(GrussformelVorlagen);

    switch (tageszeit) {
        case "nacht":
            zufaelligeGrussformel = get_Zufall(GrussformelVorlagenNacht);
            break;
        default:
            break;
    }

    //Grussformel zusammensetzen
    let grussformel = zufaelligeGrussformel.replace("schönen", zufaelligesAdjektiv);
    grussformel = grussformel.replace("Tag",wochentag+tageszeit);
    if (tageszeit != "nacht"){
        grussformel +=" *" + get_Zufall(Smileys) + "*"
    }
    grussformel += "\n"+ Unterschrift


    return grussformel;
}

function erzeuge_dankestext (kk){
    // stellt zufällige aber passende Dankestexte zusammen

    let zufaelligeVorlage;

    let anzahlKomplimente = kk.komplimente;
    let anzahlKommentare = kk.kommentare;

    if (anzahlKomplimente > 10){
        zufaelligeVorlage = get_Zufall(DankesVorlagen_fuer_Massenkomplimente);
        return zufaelligeVorlage;
    }

    let komplimentText = "";
    switch (true) {
        case (anzahlKomplimente == 1):
            komplimentText = "das Kompliment";
            break;
        case (anzahlKomplimente > 5):
            komplimentText = "die vielen Komplimente";
            break;
        case (anzahlKomplimente > 1):
            komplimentText = "die Komplimente";
            break;
    }
    let kommentarText = ""
    switch (true) {
        case (anzahlKommentare == 1):
            kommentarText = "den Kommentar";
            break;
        case (anzahlKommentare > 5):
            kommentarText = "die vielen Kommentare";
            break;
        case (anzahlKommentare > 1):
            kommentarText = "die Kommentare";
            break;
    }
    // Zusammensetzen, z.B.: "das Kompliment und die Kommentare"
    let kkString = komplimentText;
    if (kommentarText != "") {
        if (kkString == ""){
            kkString = kommentarText;
        }
        else {
            kkString = kkString + " und " + kommentarText;
        }
    }
    let zusaetzlicher_Text = (kkString != "") ? " für "+ kkString + "!" : "!";
    zufaelligeVorlage = get_Zufall(DankesVorlagen);
    zufaelligeVorlage = zufaelligeVorlage.replace("!", zusaetzlicher_Text);

    return zufaelligeVorlage;
}

function Button(buttonID, buttonText, buttonShortcut, keyCode, buttonFunktion){
    //var testButton = new Button("DankeButton", "<u>D</u>anke", "[Alt+1]", "*danke*", "Digit1");

    //this.mailText = mailText;
    this.button = document.createElement ('button');

    attribute_festlegen (this.button);

    // Mausklick und Tastenshortcuts Listener hinzufügen
    this.button.addEventListener ("click", buttonAction, false);
    document.addEventListener ("keydown", shortCutAction, false);

    //Button in der Website anzeigen
    //document.body.appendChild(this.button);

    function attribute_festlegen(button) {
        // Setzt die HTML Attribute für die Button

        button.style.font = "80%";
        button.style.width = "24%";
        button.style.color = "white";
        button.style.margin = "5px";
        button.style.marginLeft = "0px";
        button.style.marginRight = "5px";
        button.style.align = "center";
        button.style.padding = "3px";
        button.style.paddingLeft = "10px";
        button.style.paddingRight = "10px";
        button.style.borderRadius = "5px";
        button.style.backgroundColor = "#444";
        button.style.borderColor = "#444";

        button.setAttribute ('type', "button");
        button.setAttribute ('id', buttonID);
        button.setAttribute ('title', buttonShortcut);
        button.innerHTML = buttonText;
    }

    function shortCutAction(event){
        if (event.altKey && event.code == keyCode){

            log(buttonShortcut+" gedrückt");
            // Per Default werden bei Mac sonst Sonderzeichen mit der Alt-Taste eingefügt
            event.preventDefault();

            //Button Click Auslösen
            document.getElementById (buttonID).click();
        }
    }

    function buttonAction (event){

        if (typeof buttonFunktion == 'function'){
            buttonFunktion();
        }
        else if (typeof buttonFunktion == 'string'){
            updateTextArea(buttonFunktion, true);
        }
        else {
            log("Letzer Parameter für Button muss ein String oder eine Funktion sein");
        }
    }
}

function updateTextArea(text, append){
    // Text im Messagefeld ändern

    let textfeld = document.getElementById('cm-new-message-textarea');

    if (append && textfeld.value) {
        // Maileingabefeld füllen

        textfeld.value = textfeld.value.trim();
        textfeld.value = textfeld.value + "\n" + text;

    }
    else textfeld.value = text;

    let event = new Event('change', { bubbles: true });
    textfeld.dispatchEvent(event);
    textfeld.focus();
}

function erzeuge_scriptmenue (){

    // MessagesDiv
    let loeschenButtonAction = function (){
        updateTextArea("", false);
    }

    let dankeUndGrussButtonAction = function (){

        let dankeUndGrussButtonText = erzeuge_dankestext(get_anzahl_kommentare_und_komplimente());
        dankeUndGrussButtonText += "\n" + erzeuge_grussformel(new Date());
        updateTextArea(dankeUndGrussButtonText, false);
    }

    let grussButtonAction = function (){

        updateTextArea(erzeuge_grussformel(new Date()), true);
    }


    this.leftMenuDiv = document.createElement ('div');
    this.leftMenuDiv.setAttribute ('id', "leftMenuDiv");

    var dankeUndGrussButton = new Button("dankeUndGrussButton", "<u>D</u>anke + Gruß", "[Alt+D]", "KeyD", dankeUndGrussButtonAction);
    this.leftMenuDiv.appendChild(dankeUndGrussButton.button);


    var grussButton = new Button("grussButton", "<u>G</u>rußformel", "[Alt+D]", "KeyG", grussButtonAction);
    this.leftMenuDiv.appendChild(grussButton.button);
    let SmileyButtonText = '<img src="//nimg.joyclub.de/smile/liebguck.gif" height="18">'
    +'<img src="//nimg.joyclub.de/smile/knicks.gif"  height="18">'
    +'<img src="//nimg.joyclub.de/smile/sonne.gif" height="18">';
    var smileyDankeButton = new Button("smileyDankeButton", SmileyButtonText, "[Alt+S]", "KeyS", "*liebguck* *knicks* *sonne*");
    this.leftMenuDiv.appendChild(smileyDankeButton.button);

    var dankeButton = new Button("dankeButton", '<img src="//nimg.joyclub.de/smile/danke.gif" height="18">', "[Alt+A]", "KeyA", "*danke*");
    this.leftMenuDiv.appendChild(dankeButton.button);
    dankeButton.button.style.width="12%";

    var ditoButton = new Button("ditoButton", '<img src="//nimg.joyclub.de/smile/dito.gif" height="18">', "[Alt+I]", "KeyI", "*dito*");
    this.leftMenuDiv.appendChild(ditoButton.button);
    ditoButton.button.style.width="12%";

    // LöschenButtonDiv
    this.rightMenuDiv = document.createElement ('div');
    this.rightMenuDiv.setAttribute ('id', "rightMenuDiv");

    var loeschenButton = new Button("LoeschenButton", "Clear", "[Alt+Entf]", "Delete", loeschenButtonAction);
    loeschenButton.button.style.width="100%";

    this.leftMenuDiv.setAttribute ('style',
                                   "width:100%;"
                                   +"display: inline-block;"
                                   +"*display: inline; */"
                                   +"zoom: 1;"
                                  );

    this.rightMenuDiv.setAttribute ('style',
                                    "top:0px;"
                                   );

    this.rightMenuDiv.appendChild(loeschenButton.button);

    var toggleKomplimenteAction = function(){
        let toggleButton = document.getElementById("toggleKomplimente");

        if (!(toggleButton.innerHTML == "Komplimente ausblenden")){
            let mailliste = document.querySelector("section.cm-msg-list").children;
            for (let i = 0; i < mailliste.length; i++) {
                mailliste[i].removeAttribute("hidden");
            }
            toggleButton.innerHTML = "Komplimente ausblenden";
        }
        else{
            verstecke_komplimente();
        }
    };

    this.toggleKomplimenteButton = new Button("toggleKomplimente", " Komplimente ausblenden", "[Alt+K]", "KeyK", toggleKomplimenteAction);
    this.toggleKomplimenteButton.button.style.width="40%";
    this.toggleKomplimenteButton.button.style.textAlign="center";
    this.toggleKomplimenteButton.button.style.marginLeft="75px";
    this.toggleKomplimenteButton.button.style.backgroundColor="#1f1f1f";
    this.toggleKomplimenteButton.button.onmouseover = function()
    {
        this.style.backgroundColor = "#333333";
    }
    this.toggleKomplimenteButton.button.setAttribute("class","cmv3_gimmix_bubble")
    

}

function korrigiere_position_von_scriptmenue(){

    //try{
    // Menü in fertig geladene Website einfügen
    let textfeld = document.querySelector('section.cm-new');
    if (!textfeld) return; // textfeld noch nicht geladen

    sMenue.leftMenuDiv.appendAfter(textfeld);

    // Shortcut für Senden und Clear-Menü einfügen
    let sendenButton = document.querySelector("button.single-clickable.btn.btn-danger");
    sendenButton.setAttribute("title","[Alt + Enter]");

    sMenue.rightMenuDiv.appendBefore(sendenButton);
    //}
    //catch (err){
    //    //throw err;
    //    log("Anpassen von Menüposition fehlgeschlagen weil Website noch nicht vollständig geladen war"
    //        +"-> setTimeout(position_von_scriptmenue_anpassen um 1000 oder mehr höher setzen");
    //}
}

function oeffne_vorlagenmenue_fuer_kontakte() {

    // Das Menü mit den Vorlagen unter der Büroklammer existiert nicht, nicht mal die Unterpunkte, wenn es nicht geöffnet ist
    // wenn dann muss ein extra Menü angelegt werden
    let linkesMenue = document.createElement("div");

    linkesMenue.setAttribute ('style', "position: fixed;"
                          +"left: 5%;"
                          +"top: 130px;"

                          +"height: 180px;"
                          +"width: 200px;"
                          +"width: 230px;"
                          +"background-color: #444;"
                          +"padding: 10px;"
                          +"border-radius:5px;"
                         );
    linkesMenue.innerHTML = "Kontakte können nicht so einfach mit Vorlagen beehrt werden. Die einzelnen Vorlagen werden erst generiert, wenn man sie manuell öffnet."
    + "Vorher sind sie im Dokument nicht existent.";
    document.body.appendChild (linkesMenue);
}

function oeffne_vorlagenmenue() {
    // öffnet die Joyclubeigenen Vorlagen links im Fenster - nur bei Nicht-Kontakten

    let joyVorlagen = document.querySelector("div.cm-conversation-no-thanks div.dropdown-menu");
    if (!joyVorlagen) return; // Menü noch nicht geladen

    let joyVorlagenScrollDiv = joyVorlagen.querySelector("div[data-joy-cm-note-list]");
    //if (!joyVorlagenScrollDiv) return; //Menü nicht existens weil Person in Kontaktliste ist

    joyVorlagen.parentNode.classList.add("open");
    joyVorlagenScrollDiv.setAttribute ('style',"max-height: 580px;height:580px;");
    joyVorlagen.setAttribute ('style', "position: fixed;"
                              +"left: 5%;"
                              +"top: 130px;"
                              +"width: 230px;"
                              +"height: 600px;"
                              +"max-height: 500px"
                              +"background-color: #444;"
                              +"padding: 10px;"
                              +"border-radius:5px;"
                             );
}

function checke_sichtbarkeit_vorlagenmenue (){
    // Schaut, ob die Menüs sichtbar sind
    // das Vorlagenmenü wird immer bei Mausklicks und Laden neuer Mails geschlossen
    // das Skriptmenü muss beim Laden neuer Mails auch immer neu angelegt werden

    var messageTeil = document.querySelector("section.cm-msg-list");
    // Website ist beim ersten Skriptaufruf noch nicht vorständig geladen
    if (!messageTeil) return;


    let menuediv = document.getElementsByClassName("dropdown-menu")[2];
    if (!menuediv) return; //gibt es bei Kontakten nicht

    let joyVorlagenContainer = menuediv.parentNode;

    if (! joyVorlagenContainer.classList.contains("open")) {

        log("Vorlagenmenü öffnen");
        oeffne_vorlagenmenue();
        document.getElementById('cm-new-message-textarea').focus();

    }
}

// ########################### Listener ###########################

// VorlagenMenü immer wieder anzeigen, wenn es nicht zu sehen ist, z.B. nach Laden neuer Mail
//setInterval(checke_sichtbarkeit_vorlagenmenue, 500);

// Nach einem Click wird das VorlagenMenü immer geschlossen und würde ohne diesen Listener
// kurz blinkern, es sei denn, der MenueSichtbarkeitsCheck-Intervall ist kleiner
// Alternative wäre alle Klicks fürs DOCUMENT abzufangen und .preventDefault(), falls
// einer der Buttons getroffen wurde
document.addEventListener ("click", oeffne_vorlagenmenue, false);

// Alt-Enter -> SendenButton
document.addEventListener ("keydown", function(zEvent){
    if (zEvent.altKey && zEvent.code == "Enter"){

        log("Alt+Enter gedrückt");
        // Per Default werden bei Mac sonst Sonderzeichen mit der Alt-Taste eingefügt
        zEvent.preventDefault();

        //Button Click Auslösen
        var sendButton = document.querySelector("button.single-clickable.btn.btn-danger").click();
    }
}
                           , false);

// Beim Anklicken neuer Mails müssen die Menüs wieder angezeigt werden
var MailReloadBeobachter = new MutationObserver(function () {

    console.log("Websiteänderung entdeckt");

    // Das vollständige Laden dauert manchmal ein Weilchen -> Timeout nutzen
    setTimeout(korrigiere_position_von_scriptmenue, 500);
    setTimeout(verstecke_komplimente, 500);
    setTimeout(checke_sichtbarkeit_vorlagenmenue,500);
});
MailReloadBeobachter.observe(document.body, {childList: true});

// ########################### Programm ###########################

var sMenue = new erzeuge_scriptmenue();
setTimeout(korrigiere_position_von_scriptmenue, 5000);

//oeffne_vorlagenmenue_fuer_kontakte()




