$(document).ready(function () {
  $("form").on("submit", function (event) {
    event.preventDefault(); // wył. odświeżanie strony po wciśnięciu enter
    $("#formLiczba").blur();
  });

  let zapisaneSlowka = localStorage.getItem("zapisane slowka");
  if (zapisaneSlowka == null || zapisaneSlowka == "") {
    localStorage.setItem("zapisane slowka", JSON.stringify([]));
    $("#baza_slowek").append(
      `<div id="zapisane" title="zapisane słówka"> </div>`
    );
  } else {
    dodajZapisaneDoHTML(zapisaneSlowka);
  }

  document.querySelector(".switch").value = themeActual;

  let slowkaAng = []; // lista wszystkich ang słówek
  let slowkaPl = []; // lista wszystkich pl słówek
  let los_slowkaAng = []; // lista ang wylosowanych słówek
  let los_slowkaPl = []; // lista pl wylosowanych słówek

  let slowkaNr = 0; // licznik słówek
  let aktualnyNr = 0; // numer aktualnego słówka

  let licznikBazy; // policzone wszystkie pary słówek

  let kolor = []; // lista kolorów

  let strona_karty_dom = localStorage.getItem("ang-pl"); // domyślna strona karty
  if (strona_karty_dom == "pl-ang") $("#ang_pl").text("PL - ANG");
  else $("#ang_pl").text("ANG - PL");
  let strona_karty_akt = strona_karty_dom; // aktualna strona karty true-pl  false-ang

  let karta_blokada = false; // blokada obrotu karty

  let znam; // zapamiętane ostatnie wciśnięcie przycisku znam lub nie_znam
  let licznikZnam = 0; // licznik znanych słówek (za pierwszym razem)

  let cofnijLock = true; // blokada cofnięcia po pierwszym wciśnięciu

  let licznikPost = 0; // licznik paska postępu

  let divSlowek = "#baza_slowek";

  $("#plansza").hide(); // domyślne ukrycie planszy i podsumowania
  $("#podsumowanie").hide();
  $("#zestawyLista").hide();
  $("#zestawSlowka").hide();
  $("#divLiczbySlowek").text(formLiczba.value);
  policzSlowka();
  wyborZestawu("wszystkie słówka");
  generujPrzyciskiZestaw();
  formLiczba.value = localStorage.getItem("liczba slowek");
  formWidth(formLiczba.value);

  ////////////////////////////////////////////////////////////////
  ////////////////   WYKRYWANIE KLIKNIĘĆ   ///////////////////////
  ////////////////////////////////////////////////////////////////
  $("#losowanie").click(function () {
    //przycisk losowanie
    licznikPost = 0;
    $("#pasek").css("width", "0");
    //$('#pasek').css('borderRadius', '4px 0px 0px 4px');
    slowkaNr = 0;
    aktualnyNr = 0; // reset
    strona_karty_akt = strona_karty_dom;
    cofnijLock = true;
    policzSlowka(); // liczenie wszystkich par słówek
    przypiszSlowka();
    // sprawdzZnane();
    losujSlowka();
    $("#zestawSlowka").slideUp(200);
    $("#zestawyLista").slideUp();
    $("#plansza").slideDown();
    $("#pod_karta").show();
    $(".karta").text("START");
    $(".karta").css({
      backgroundColor: "var(--card-pl-bkg)",
      border: "4px solid var(--card-pl-brd)",
      color: "var(--card-txt-pl)",
    });
    $("#podsumowanie").slideUp(500);
  });

  $(".karta").click(function () {
    //przycisk karta
    if (slowkaNr != aktualnyNr && karta_blokada == false) {
      kartaObrot();
      $(".karta").toggleClass("karta_anim");

      setTimeout(function () {
        $(".karta").toggleClass("karta_anim");
        karta_blokada = false;
      }, 500);
      karta_blokada = true;
    }
  });

  $("#ang_pl").click(function () {
    //przycisk ang - pl
    if (strona_karty_dom == "ang-pl") {
      strona_karty_dom = "pl-ang";
      $("#ang_pl").text("PL - ANG");
      localStorage.setItem("ang-pl", strona_karty_dom);
    } else {
      strona_karty_dom = "ang-pl";
      $("#ang_pl").text("ANG - PL");
      localStorage.setItem("ang-pl", strona_karty_dom);
    }
  });

  $("#znam").click(function () {
    //przycisk znam
    znam = true;
    nastepnaPara(znam);
    cofnijLock = false;
    cardFade();
  });

  $("#nie_znam").click(function () {
    //przycisk nie znam
    znam = false;
    nastepnaPara(znam);
    cofnijLock = false;
    cardFade();
  });

  $("#przyciskMinus").click(function () {
    //przycisk minus
    if (formLiczba.value > 1) {
      $("#przyciskPlus")
        .html(' <i class="icon-plus"></i> ')
        .css({ fontSize: "20px", lineHeight: "160%" });
      formLiczba.value--;
      $("#divLiczbySlowek").text(formLiczba.value);
      localStorage.setItem("liczba slowek", formLiczba.value);
      formWidth(formLiczba.value);
    }
    $("#plansza").slideUp();
    $("#podsumowanie").slideUp();
  });

  $("#przyciskPlus").click(function () {
    //przycisk plus
    if (formLiczba.value < licznikBazy && formLiczba.value < 99) {
      formLiczba.value++;
      $("#divLiczbySlowek").text(formLiczba.value);
      localStorage.setItem("liczba slowek", formLiczba.value);
      formWidth(formLiczba.value);
    }
    if (formLiczba.value == licznikBazy) {
      $("#przyciskPlus")
        .text("max")
        .css({ fontSize: "12px", lineHeight: "240%" });
    }
    $("#plansza").slideUp();
    $("#podsumowanie").slideUp();
  });

  $("#cofnij").click(function () {
    //przycisk cofnij
    if (cofnijLock == false) {
      cofnijRuch();
      cardFade();
    }
  });

  $("#formLiczba").focusin(function () {
    // wejście w okienko formularza
    $("#formLiczba").css({ width: "36px", margin: "0px" });
    $("#plansza").slideUp();
    $("#podsumowanie").slideUp();
  });

  $("#formLiczba").focusout(function () {
    // wyjście z okienka formularza
    if (formLiczba.value > 99) formLiczba.value = 99;
    if (formLiczba.value > licznikBazy) formLiczba.value = licznikBazy;
    localStorage.setItem("liczba slowek", formLiczba.value);
    formWidth(formLiczba.value);
  });

  $("#przyciskZestaw").click(function () {
    // przycisk zestaw
    $("#opis-slowka").css({ display: "none" });
    $("#zestawyLista").slideToggle();
    $("#plansza").slideUp();
    $("#podsumowanie").slideUp();
    $("#zestawSlowka").slideUp(200);
  });

  $(".zestaw").click(function () {
    // przyciski listy zestawów
    wyborZestawu(this.title);
    if (formLiczba.value < licznikBazy)
      $("#przyciskPlus")
        .html(' <i class="icon-plus"></i> ')
        .css({ fontSize: "20px", lineHeight: "160%" });
    $("#zestawSlowka").slideUp(0);
    przyciskRozwin();
    $("#zestawSlowka").slideToggle(700);
  });

  let opisBtn = false;

  if (localStorage.getItem("opis-btn") == "true") {
    $("#opis-btn").css({ opacity: "1" });
    opisBtn = true;
  } else {
    $("#opis-btn").css({ opacity: "0.6" });
    $("#opis-slowka").css({ display: "none" });
    opisBtn = false;
  }

  $("#opis-btn").click(function () {
    if (opisBtn == false) {
      $("#opis-btn").css({ opacity: "1" });
      opisBtn = true;
      localStorage.setItem("opis-btn", true);
    } else {
      $("#opis-btn").css({ opacity: "0.6" });
      $("#opis-slowka").css({ display: "none" });
      opisBtn = false;
      localStorage.setItem("opis-btn", false);
    }
  });
  ////////////////////////////////////////////////////////////
  //////////////////// WYBÓR ZESTAWU /////////////////////////
  ////////////////////////////////////////////////////////////
  function wyborZestawu(x) {
    $(".zestaw").css("backgroundColor", "var(--button-bkg)"); // reset tła przycisku
    $(".zestaw[title |= 'zapisane słówka']").css(
      "backgroundColor",
      "var(--unknown-bkg)"
    ); // reset tła zapisane słówka

    divSlowek = $('#baza_slowek div[title="' + x + '"]');
    if (x == "wszystkie słówka") divSlowek = $("#baza_slowek");
    $(".zestaw[title |= '" + x + "']").css(
      "backgroundColor",
      "var(--button-bkg-hover)"
    );

    if (x == "zapisane słówka") {
      $(".zestaw[title |= 'zapisane słówka']").css(
        "backgroundColor",
        "var(--unknown-brd)"
      );
    }

    policzSlowka();
    formWidth(formLiczba.value);
    $("#wybranyZestaw").text("Zestaw: " + x);
  }

  ///////////////////////////////////////////////////////////////////////
  //////////////// GENEROWANIE PRZYCISKÓW ZESTAWÓW //////////////////////
  ///////////////////////////////////////////////////////////////////////
  function generujPrzyciskiZestaw() {
    let licznik = 1;
    let tytulZestawu = "";

    $("#zestawyLista").append(
      '<div class="zestaw_pack" title="wszystkie słówka"><div class="zestaw" title="wszystkie słówka">wszystkie słówka</div></div><hr>'
    );
    $(".zestaw[title |= 'wszystkie słówka']").css(
      "backgroundColor",
      "var(--button-bkg-hover)"
    );
    while (typeof tytulZestawu !== "undefined") {
      tytulZestawu = $("#baza_slowek > div:nth-child(" + licznik + ")").attr(
        "title"
      );
      if (typeof tytulZestawu !== "undefined") {
        $("#zestawyLista").append(
          '<div class="zestaw_pack"title="' +
            tytulZestawu +
            '"><div class="zestaw" title="' +
            tytulZestawu +
            '">' +
            tytulZestawu +
            "</div></div>"
        );
      }
      licznik++;
    }
  }

  //////////////////////////////////////////////////////////////
  /////////////// PRZYCISK ROZWIJANIA ZESTAWU //////////////////
  //////////////////////////////////////////////////////////////
  function przyciskRozwin() {
    slowkaNr = 0;
    aktualnyNr = 0; // reset
    policzSlowka();
    przypiszSlowka();

    let listaNr = 0;
    licznikPar = licznikBazy;
    $("#zestawSlowka").empty();
    $("#zestawSlowka").append(
      '<div id="liczbaSlowek">Liczba słówek: ' + licznikBazy + "<br><hr></div>"
    );
    while (listaNr != licznikBazy) {
      $("#zestawSlowka").append(
        '<span style="color:var(--word-ang)">' + slowkaAng[listaNr] + "</span>"
      );
      $("#zestawSlowka").append(
        '<span style="color:var(--word-dash)"> - </span>'
      );
      $("#zestawSlowka").append(
        '<span style="color:var(--word-pl)">' + slowkaPl[listaNr] + "</span>"
      );
      $("#zestawSlowka").append("<br>");
      listaNr++;
    }
  }

  //////////////////////////////////////////////////////////////
  //////////////////// ROZMIAR FORMULARZA //////////////////////
  //////////////////////////////////////////////////////////////
  function formWidth(x) {
    if (x > 9) $("#formLiczba").css({ width: "36px", margin: "0px" });
    else $("#formLiczba").css({ width: "22px", margin: "7px" });
    if (x == "") formLiczba.value = 1;
  }

  /////////////////////////////////////////////////////////////
  //////////////////// PRZYPISANIE SŁÓWEK /////////////////////
  /////////////////////////////////////////////////////////////
  function przypiszSlowka() {
    let znakNr = 0;
    let slowkaAll = $(divSlowek).text(); // pobranie wszystkich słówek z diva
    let iloscPetli = licznikBazy;
    while (iloscPetli > 0) {
      ///////////////////// ANG ///////////////////////
      slowkaAng[slowkaNr] = "";
      while (
        slowkaAll[znakNr] == "\n" ||
        slowkaAll[znakNr] == "\t" ||
        slowkaAll[znakNr] == "-"
      )
        znakNr++;
      while (slowkaAll[znakNr] != "-") {
        slowkaAng[slowkaNr] += slowkaAll[znakNr];
        znakNr++;
      }

      // sprawdzZnane(slowkaAng[slowkaNr]);
      ///////////////////// PL ////////////////////////
      slowkaPl[slowkaNr] = "";
      while (slowkaAll[znakNr] == "\n" || slowkaAll[znakNr] == "-") znakNr++;
      while (slowkaAll[znakNr] != "\n") {
        slowkaPl[slowkaNr] += slowkaAll[znakNr];
        znakNr++;
      }
      slowkaNr++;
      iloscPetli--;
    }
  }

  ////////////////////////////////////////////////////////////
  ////////////////// LOSOWANIE SŁÓWEK ////////////////////////
  ////////////////////////////////////////////////////////////
  function losujSlowka() {
    $("#opis-slowka").css({ display: "none" });
    let nr = 0;
    let losNr = 0;
    slowkaNr = formLiczba.value;
    while (nr < formLiczba.value) {
      losNr = Math.floor(Math.random() * licznikBazy);

      if (slowkaAng[losNr] != "x") {
        los_slowkaAng[nr] = slowkaAng[losNr];
        los_slowkaPl[nr] = slowkaPl[losNr];
        slowkaAng[losNr] = "x";
        nr++;
      }
    }
  }

  /////////////////////////////////////////////////////////////////////
  //////////////////// LICZENIE WSZYSTKICH SŁÓWEK /////////////////////
  /////////////////////////////////////////////////////////////////////
  function policzSlowka() {
    let znak = "";
    let nr_znaku = 0;
    let wszystko = $(divSlowek).text();
    licznikBazy = 0;
    licznikZnam = 0;

    while (typeof znak !== "undefined") {
      znak = wszystko[nr_znaku];
      if (znak == "-") licznikBazy++;
      nr_znaku++;
    }

    if (licznikBazy < formLiczba.value) formLiczba.value = licznikBazy;
  }

  //////////////////////////////////////////////////////////////////
  ////////////////////// OBRACANIE KARTY ///////////////////////////
  //////////////////////////////////////////////////////////////////
  function kartaObrot() {
    if (strona_karty_akt == "ang-pl") {
      setTimeout(function () {
        $(".karta").text(los_slowkaAng[aktualnyNr]);
        opisBtn == true && apiDownload(los_slowkaAng[aktualnyNr]);
        $(".karta").css({
          backgroundColor: "var(--card-ang-bkg)",
          border: "4px solid var(--card-ang-brd)",
          color: "var(--card-txt-ang)",
        });
        strona_karty_akt = "pl-ang";
      }, 250);
    } else {
      setTimeout(function () {
        $(".karta").text(los_slowkaPl[aktualnyNr]);
        $(".karta").css({
          backgroundColor: "var(--card-pl-bkg)",
          border: "4px solid var(--card-pl-brd)",
          color: "var(--card-txt-pl)",
        });
        strona_karty_akt = "ang-pl";
      }, 250);
    }
  }

  //////////////////////////////////////////////////////////////////////
  ///////////////////////  ZNAM  /  NIE ZNAM  //////////////////////////
  //////////////////////////////////////////////////////////////////////
  function nastepnaPara(x) {
    if (slowkaNr == aktualnyNr + 1) {
      if (x == true) kolor[aktualnyNr] = "var(--word-pl)"; // zieleń
      else kolor[aktualnyNr] = "var(--word-ang)"; // czerwień
      koniec();
    } else {
      if (x == true) {
        kolor[aktualnyNr] = "var(--word-pl)"; // zieleń
        aktualnyNr++;
        strona_karty_akt = strona_karty_dom;
        kartaObrot();
        pasek_postepu();
      }
      if (x == false) {
        kolor[aktualnyNr] = "var(--word-ang)"; // czerwień
        los_slowkaAng[slowkaNr] = los_slowkaAng[aktualnyNr];
        los_slowkaPl[slowkaNr] = los_slowkaPl[aktualnyNr];
        slowkaNr++;
        aktualnyNr++;
        // $('.karta').text(los_slowkaAng[aktualnyNr]);
        // $('.karta').css({'backgroundColor': '#b53609','border': '4px solid #902600'});
        strona_karty_akt = strona_karty_dom;
        kartaObrot();
        // if(strona_karty_dom==false) kartaObrot(); // fix na szybkie mignięcie odpowiedzi
      }
    }
  }

  //////////////////////////////////////////////////////////////////
  /////////////////////// FADE NAPISU NA KARCIE ////////////////////
  //////////////////////////////////////////////////////////////////
  function cardFade() {
    $(".karta").css("color", "#ffe2d800");
    $(".karta").css("text-shadow", "2px 2px 1px rgba(0,0,0,0)");
    $(".karta").css("transition", "all 0.25s");

    setTimeout(function () {
      $(".karta").css("text-shadow", "var(--card-txt-shadow)");
      $(".karta").css("transition", "none");
      if (strona_karty_akt == "pl-ang")
        $(".karta").css("color", "var(--card-txt-ang)");
      else $(".karta").css("color", "var(--card-txt-pl)");
    }, 250);
  }
  /////////////////////////////////////////////////////////////////
  //////////////////////////  COFNIJ RUCH  ////////////////////////
  /////////////////////////////////////////////////////////////////
  function cofnijRuch() {
    aktualnyNr--;
    if (znam == false) slowkaNr--;
    if (znam == true) {
      licznikPost = licznikPost - 100 / formLiczba.value;
      $("#pasek").css("width", licznikPost + "%");
    }
    // strona_karty_akt = !strona_karty_akt;
    strona_karty_akt == "ang-pl"
      ? (strona_karty_akt = "pl-ang")
      : (strona_karty_akt = "ang-pl");
    kartaObrot();
    cofnijLock = true;
  }
  ////////////////////////////////////////////////////////////////
  ////////////////////////  PASEK POSTĘPU  ///////////////////////
  ////////////////////////////////////////////////////////////////
  function pasek_postepu() {
    licznikPost = licznikPost + 100 / formLiczba.value;
    $("#pasek").css("width", licznikPost + "%");
  }

  ///////////////////////////////////////////////////////////////
  //////////////////////////  KONIEC  ///////////////////////////
  ///////////////////////////////////////////////////////////////
  function koniec() {
    $("#opis-slowka").css({ display: "none" });
    $("#pasek").css("width", "100%");
    $(".karta").text("KONIEC");
    $("#plansza").delay(1000).slideUp(500);
    $("#pod_karta").hide();
    podsumowanie();
    $("#podsumowanie").delay(1500).slideDown(1000);
  }
  /////////////////////////////////////////////////////////////////
  //////////////////////////  PODSUMOWANIE  ///////////////////////
  /////////////////////////////////////////////////////////////////
  function podsumowanie() {
    let listaNr = 0;
    licznikPar = formLiczba.value;
    $("#lista").empty();

    while (listaNr != formLiczba.value) {
      $("#lista").append(
        '<span style="color:' +
          kolor[listaNr] +
          '">' +
          los_slowkaAng[listaNr] +
          "</span>"
      );

      ////////////////////////////
      if (kolor[listaNr] == "var(--word-ang)") {
        zapiszNieznane(`${los_slowkaAng[listaNr]}-${los_slowkaPl[listaNr]}`);
        $("#zapisane").remove();
        dodajZapisaneDoHTML(localStorage.getItem("zapisane slowka"));
      }
      //////////////////////////////
      $("#lista").append(
        '<span style="color:' + kolor[listaNr] + '"> - </span>'
      );
      $("#lista").append(
        '<span style="color:' +
          kolor[listaNr] +
          '">' +
          los_slowkaPl[listaNr] +
          "</span>"
      );
      $("#lista").append("<br>");
      if (kolor[listaNr] == "var(--word-pl)") licznikZnam++;
      listaNr++;
    }

    $("#licznikZnam").text(licznikZnam + " / " + formLiczba.value);
    cofnijLock = true;
  }

  //////////////////////////////////////////////////////////////////////////////////
  ///////////////////////  ZAPISYWANIE NIEZNANYCH SŁÓWEK  //////////////////////////
  //////////////////////////////////////////////////////////////////////////////////
  function zapiszNieznane(zapisane) {
    zapisane = zapisane.trim();
    zapisaneSlowka = JSON.parse(localStorage.getItem("zapisane slowka"));
    if (!zapisaneSlowka.includes(zapisane)) zapisaneSlowka.push(zapisane);
    localStorage.setItem("zapisane slowka", JSON.stringify(zapisaneSlowka));
  }

  function dodajZapisaneDoHTML(lista) {
    // console.log(JSON.parse(lista).flat().join("\n"));
    $("#baza_slowek").append(
      `<div id="zapisane" title="zapisane słówka"> ${JSON.parse(lista).join(
        "\n"
      )}\n</div>`
    );
  }
  //////////////////////////////////////////////////////////////////
  ///////////////////////  ANG WORDS API  //////////////////////////
  //////////////////////////////////////////////////////////////////
  let sound = null;

  const link = "https://api.dictionaryapi.dev/api/v2/entries/en/";
  const apiDownload = (slowo) => {
    fetch(link + slowo)
      .then((response) => {
        if (response.ok) {
          $("#opis-slowka").css({ display: "block" });
          $("#opis").css({ display: "block" });
          $("#opis-slowka h2").text("DESCRIPTION");
          return response.json();
        } else {
          $("#opis-slowka h2").text("NO DESCRIPTION");
          $("#opis").css({ display: "none" });
          $("#audio-btn").css({ display: "none" });
        }
      })
      .then((data) => {
        $("#opis").html(
          `<b>Meaning: </b>${data[0].meanings[0].definitions[0].definition}`
        );
        if (data[0].meanings[0].synonyms[0] != undefined) {
          $("#opis").append("<hr><b>Synonyms: </b>");
          data[0].meanings[0].synonyms.forEach((item) =>
            $("#opis").append(`${item}, `)
          );
        }
        if (data[0].meanings[0].definitions[0].example != undefined) {
          $("#opis").append(
            `<hr><b>Example: </b>${data[0].meanings[0].definitions[0].example}`
          );
        }
        if (data[0].phonetics[0].audio != "") {
          sound = new Audio(data[0].phonetics[0].audio);
          $("#audio-btn").css({ display: "block" });
        } else {
          $("#audio-btn").css({ display: "none" });
        }
        // console.log(data);
      });
    // .catch((err) => {
    //   alert("Something went wrong!", err);
    // });
  };

  $("#audio-btn").click(function () {
    sound.play();
  });
});

/////////////////////////////////////////////////////////////////////////
///////////////////////   KOLORYSTYKA STRONY   //////////////////////////
/////////////////////////////////////////////////////////////////////////
let themeActual = localStorage.getItem("ang-pl-site");

setTheme(themeActual);

function setTheme(themeValue) {
  switch (themeValue) {
    case "1":
      document.documentElement.className = "theme1";
      break;
    case "2":
      document.documentElement.className = "theme2";
      break;
    case "3":
      document.documentElement.className = "theme3";
  }
  localStorage.setItem("ang-pl-site", themeValue);
}
//////////////////////////////////////////////////////////////////////////
