// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
// Add a listener to create the initial context menu items,
// context menu items only need to be created at runtime.onInstalled
chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    id: "Normattiva",
    title: "Normattiva",
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
        'decreto.del.presidente.della.repubblica': ['dpr'],
        'decreto.legislativo': ['dlgs'],
        'decreto.legge': ['dl'],
        'legge': ['l'],
        'costituzione': ['cost'],
        'art': ['a', 'art', 'articolo'],
        'c': ['com']
    };

    // q = 'dpr 444/2014 a 17 c 2';
    q = q.replace(/[\.,]+/g," ");
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

chrome.contextMenus.onClicked.addListener(function(item, tab) {
  // alert(item.selectionText);
  let qItem = parseLongString(item.selectionText);
  if (!qItem) {
    qItem = parseQueryString(item.selectionText);
  }
  alert(qItem);

  let url =
    'http://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:' + serializeQuery(qItem);
    
  chrome.tabs.create({url: url, index: tab.index + 1});
});

chrome.storage.onChanged.addListener(function(list, sync) {
  let newlyDisabled = [];
  let newlyEnabled = [];
  let currentRemoved = list.removedContextMenu.newValue;
  let oldRemoved = list.removedContextMenu.oldValue || [];
  for (let key of Object.keys(kLocales)) {
    if (currentRemoved.includes(key) && !oldRemoved.includes(key)) {
      newlyDisabled.push(key);
    } else if (oldRemoved.includes(key) && !currentRemoved.includes(key)) {
      newlyEnabled.push({
        id: key,
        title: kLocales[key]
      });
    }
  }
  for (let locale of newlyEnabled) {
    chrome.contextMenus.create({
      id: locale.id,
      title: locale.title,
      type: 'normal',
      contexts: ['selection'],
    });
  }
  for (let locale of newlyDisabled) {
    chrome.contextMenus.remove(locale);
  }
});
