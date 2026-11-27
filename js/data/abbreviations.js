/* Oklahoma's official abbreviation list for the nurse aide exam.
 * Source: Oklahoma CareerTech Certified Nurse Aide Study Guide, "Abbreviations, Symbols and Acronyms" (p. 46),
 * copied in the same order and wording (only the guide's typo "milliter" is corrected to "milliliter").
 * `also` = other official curricula that define the abbreviation the same way (checked by Claude 2026-11-22
 * against the saved official PDFs). Two or more `also` sources + the Oklahoma guide = 3 agreeing sources. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.CNA = root.CNA || {}; root.CNA.abbreviations = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SOURCE = 'okSG';
  const PAGE = 46;

  const list = [
    { a: '°', m: 'degree(s)' },
    { a: '#', m: 'pound(s)' },
    { a: 'ADL', m: 'activities of daily living', also: ['okCore', 'inCur', 'vaCur'] },
    { a: 'AM', m: 'morning', also: ['vaCur', 'ncHB'] },
    { a: 'ax (with temperature)', m: 'axial', also: ['okCore', 'inCur'],
      note: 'Oklahoma\'s course standards (Procedure 43) and Indiana\'s curriculum call this an axillary temperature — taken in the armpit.' },
    { a: 'BID', m: 'twice daily', also: ['vaCur'] },
    { a: 'BP', m: 'blood pressure', also: ['inCur', 'vaCur', 'ncAA'] },
    { a: 'c', m: 'cup' },
    { a: 'CMA', m: 'certified medication aide' },
    { a: 'CNA', m: 'certified nurse aide', also: ['inCur', 'ncHB'] },
    { a: 'CPR', m: 'cardiopulmonary resuscitation' },
    { a: 'F', m: 'Fahrenheit' },
    { a: 'HIPAA', m: 'Health Insurance Portability and Accountability Act', also: ['inCur', 'vaCur'] },
    { a: 'HS', m: 'at bedtime', also: ['vaCur'] },
    { a: 'I&O', m: 'intake and output', also: ['vaCur', 'ncAA'] },
    { a: 'IV', m: 'intravenous', also: ['inCur', 'vaCur', 'ncAA'] },
    { a: 'L', m: 'liter' },
    { a: 'LPN', m: 'licensed practical nurse', also: ['inCur', 'vaCur'] },
    { a: 'mL', m: 'milliliter', also: ['vaCur', 'ncAA'] },
    { a: 'mmHg', m: 'millimeter of mercury', also: ['ncAA'] },
    { a: 'NG', m: 'nasogastric', also: ['inCur'] },
    { a: 'NKA', m: 'no known allergies' },
    { a: 'NPO', m: 'nothing per oral (nothing by mouth)', also: ['inCur', 'vaCur'] },
    { a: 'OSDH', m: 'Oklahoma State Department of Health', also: ['okCore'] },
    { a: 'OTC', m: 'over the counter' },
    { a: 'P', m: 'pulse', also: ['inCur'] },
    { a: 'PEG', m: 'percutaneous endoscopic gastrostomy tube', also: ['inCur'] },
    { a: 'PM', m: 'afternoon', also: ['vaCur'] },
    { a: 'PO', m: 'per oral (by mouth)', also: ['inCur', 'vaCur'] },
    { a: 'POC', m: 'plan of care' },
    { a: 'PPE', m: 'personal protective equipment', also: ['inCur', 'vaCur'] },
    { a: 'QID', m: 'four times a day', also: ['vaCur'] },
    { a: 'R', m: 'respirations' },
    { a: 'R (with temperature)', m: 'rectal' },
    { a: 'RN', m: 'registered nurse', also: ['inCur', 'vaCur'] },
    { a: 'ROM', m: 'range of motion', also: ['inCur', 'vaCur'] },
    { a: 'T', m: 'temperature' },
    { a: 'TED', m: 'thromboembolism deterrent', also: ['inCur'] },
    { a: 'TID', m: 'three times a day', also: ['vaCur'] },
  ];
  list.forEach((x) => { x.also = x.also || []; x.agree = 1 + x.also.length; });

  return { SOURCE, PAGE, list };
});
