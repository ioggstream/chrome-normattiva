// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
// Add a listener to create the initial context menu items,
// context menu items only need to be created at runtime.onInstalled
chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    id: "Cerca su normattiva",
    title: "Cerca su normattiva",
    type: 'normal',
    contexts: ['selection'],
  });
});

// legge:2009-12-31;196~art17-com2

function parseLongString(q) {
  var mesi = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre",
  "ottobre", "novembre", "dicembre"];

  var long_re = new RegExp([
   '(?<tipo>(decreto.legislativo|decreto.legge|decreto.del.presidente.della.repubblica|legge|costituzione|costituzione.della.repubblica.italiana))',
   '(?<data>[^,]+)',
   ', n. (?<numero>[0-9]+)'
   ].join(''));
  
  //DECRETO LEGISLATIVO 30 marzo 2001, n. 165
  let ret = long_re.exec(q.toLowerCase());
  if (!ret) {
    return null;
  }
  let data = ret.groups.data.trim().split(" ");
  data = data[2] + "-" + (1 + mesi.indexOf(data[1])) + "-" + data[0];
  return {
    "tipo": ret.groups.tipo.replace(/ /g, "."),
    "data": data,
    "norma": ret.groups.numero
  };
}

function parseQueryString(q){
    let norma = null;
    let data = "";
    let normattivaMap = {
        'decreto.del.presidente.della.repubblica': ['dpr', 'd.p.r'],
        'decreto.legislativo': ['dlgs', 'd.lgs'],
        'decreto.legge': ['dl', 'd.l'],
        'legge': ['l'],
        'costituzione': ['cost'],
        'art': ['a', 'art', 'articolo'],
        'com': ['com', 'c', 'comma']
    };

    q = q.toLowerCase();
    // q = 'dpr 444/2014 a 17 c 2';
    q = q.replace(/[,]+/g," ");
    q = q.split(" ");
    // tipo di norma.
    let tipo = q[0];
    Object.keys(normattivaMap).forEach(function(key) {
        console.log(normattivaMap[key]);
        if (normattivaMap[key].includes(tipo)) {
            tipo = key;
        }
    });

    let numero = q[1];
    if (numero.indexOf("/") >= 0) {
      numero = numero.split("/");
        norma = numero[0];
        data = numero[1];
    } else {
        norma = numero;
    }

    // remove "articolo"
    if (q[2] && normattivaMap['art'].includes(q[2].trim("."))) {
      q.splice(2, 1);
    }
    // remove "comma"
    if (q[3] && normattivaMap['com'].includes(q[3].trim("."))) {
      q.splice(3, 1);
    }
    
    return {
      "tipo": tipo,
      "data": data,
      "norma": norma,
      "articolo": q[2],
      "comma": q[3]
    }
};

function serializeQuery(qItem){
  let ret = qItem.tipo + ":" + qItem.data + ";" + qItem.norma;
  if (qItem.articolo){
    ret += '~art' + qItem.articolo;
  }
  if (qItem.comma){
    ret += '-com' + qItem.comma;
  }
  return ret;
}


// Create 
function createSearchUrl(text) {
  let qItem = parseLongString(text);
  if (!qItem) {
    qItem = parseQueryString(text);
  }
  console.log(qItem);

  let url =
    'http://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:' + serializeQuery(qItem);
  return url;
}

// Allow searching from chrome bar.
chrome.omnibox.onInputEntered.addListener(function(text) {
  chrome.tabs.create({url: createSearchUrl(text)});
});

// Allow searching from selected text.
chrome.contextMenus.onClicked.addListener(function(item, tab) {
    chrome.tabs.create({url: createSearchUrl(item.selectionText), index: tab.index + 1});
});
