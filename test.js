function parseLongString(q) {
  var long_re = new RegExp([
   '(?<tipo>(decreto.legislativo|decreto.legge|decreto.del.presidente.della.repubblica|legge|costituzione|costituzione.della.repubblica.italiana))',
   '(?<data>[^,]+)',
   ', n. (?<numero>[0-9]+)'
   ].join(''));
  
  //DECRETO LEGISLATIVO 30 marzo 2001, n. 165
  ret = long_re.exec(q);
  let tipo = ret.groups.tipo.replace(/ /g, ".");
  let data = ret.groups.data.split(" ");
  let norma = reg.groups.numero;
  alert(tipo + ":" + data + ";" + norma);
  return reg.groups;
}

tests = [
 "DECRETO DEL PRESIDENTE DELLA REPUBBLICA 26 ottobre 1972, n. 633",
 
]


tests_2 = [
 "decreto.del.presidente.della.repubblica:1972;633~art35quater"
]
parseLongString(tests[0]);
