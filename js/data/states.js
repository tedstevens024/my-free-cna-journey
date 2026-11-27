/* State certification pathway data.
 * RULE: nothing here is guessed. Federal facts are quoted/paraphrased from the official eCFR text.
 * A state's details are only shown after they are checked against an official state source and the
 * entry carries `sources` + `verifiedDate`. Until then the app shows "Not yet verified". */
(function (root) {
  'use strict';

  const federal = {
    title: 'Federal minimum (applies in every state)',
    verifiedDate: '2026-11-22',
    sources: [
      { title: '42 CFR § 483.152 — Requirements for approval of a nurse aide training and competency evaluation program', url: 'https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-483/subpart-D/section-483.152' },
      { title: '42 CFR § 483.154 — Nurse aide competency evaluation', url: 'https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-483/subpart-D/section-483.154' },
    ],
    facts: [
      'A state-approved nurse aide training program must have no less than 75 clock hours of training.',
      'It must include at least 16 hours of supervised practical training (performing tasks on a person under direct supervision of an RN or LPN).',
      'At least 16 hours of training must come before any direct contact with a resident: communication, infection control, safety/emergency procedures (including the Heimlich maneuver), promoting independence, and residents\' rights.',
      'The competency evaluation has two parts: a written or oral exam (you may choose which), and a skills demonstration of randomly selected tasks.',
      'You must pass both parts. Passing is recorded in the state nurse aide registry within 30 days.',
      'If you do not pass, you must be told which areas you missed, and you get at least three chances to take the evaluation.',
      'Many states require MORE than these minimums. Your state\'s rules are what count.',
    ],
    money: [
      'If a nursing facility employs you (or has offered you a job) on the day you start a training and competency evaluation program, you may not be charged for any part of it — including textbooks and required materials. (§ 483.152(c)(1), § 483.154(c)(2))',
      'If you pay for training yourself and are hired by a nursing facility within 12 months of finishing, the state must provide for pro-rated reimbursement of your costs while you work there as a nurse aide. (§ 483.152(c)(2), § 483.154(c)(3))',
    ],
  };

  const STATE_NAMES = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
    DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
    IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
    NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
    NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
    RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
    VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  };

  /* Verified state entries go here (merged from research/states/XX.json after review).
   * Shape: { agency, registryUrl, trainingHoursTotal, clinicalHours, classroomHours, testVendor,
   *          testParts:[], steps:[], renewal, notes, sources:[{title,url,checked}], verifiedDate } */
  /* CROSS-CHECK RULE (user's standing order): a fact appears under `facts` only when at least THREE
   * different official sources agree. Facts with fewer agreeing sources go under `partial` and the app
   * labels them as not fully cross-checked. `sources` indexes refer to the entry's `sources` array. */
  const OKD = 'https://oklahoma.gov/content/dam/ok/en/';
  const verified = {
    OK: {
      agency: 'Oklahoma State Department of Health (OSDH) — Nurse Aide and Nontechnical Services Worker Registry',
      title: 'Long Term Care Aide (the certified nurse aide who works in nursing homes)',
      verifiedDate: '2026-11-24',
      verifiedBy: 'Claude & Carbon — each fact read on the official documents below',
      sources: [
        /* 0 */ { title: 'OSDH — Nurse Aide Registry (main page)', url: 'https://oklahoma.gov/health/services/licensing-inspections/health-resources-development-service/nurse-aide-registry.html' },
        /* 1 */ { title: 'Oklahoma Administrative Code 310:677 — Nurse Aide Training and Certification (rules, eff. 9-11-2023)', url: OKD + 'health/health2/aem-documents/protective-health/long-term-care-services/forms/current/rules-and-regs/Chapter%20677%2009.2023.pdf' },
        /* 2 */ { title: 'Oklahoma Statutes 63 O.S. § 1-1950.1 – 1-1951 (Nursing Home Care Act excerpt)', url: OKD + 'health/health2/aem-documents/protective-health/hrds/nurse-aide-registry/63-os-1-1950.1-63-1-1951-nurse-aide-certification-11-1-2017.pdf' },
        /* 3 */ { title: 'OSDH — Long Term Care Aide Training Program (NATCEP) Application', url: OKD + 'health/health2/aem-documents/protective-health/long-term-care-services/forms/current/nurse-aide-training-program-resources/ltc/LTC%20NATCEP%20App.pdf' },
        /* 4 */ { title: 'CNA Training Verification Form (OSDH / CareerTech)', url: OKD + 'careertech/testing-centers/testing/hcp-coordinator-resources/cna-training-verification-form1.pdf' },
        /* 5 */ { title: 'OSDH — Nurse Aide Renewal Application (ODH 717.301)', url: OKD + 'health/health2/aem-documents/protective-health/long-term-care-services/forms/current/renewal/ODH%20717.301%20Renewal%20App%2006.24.pdf' },
        /* 6 */ { title: 'OSDH — Certified Nurse Aide Retest Application (ODH 841)', url: OKD + 'health/health2/aem-documents/protective-health/long-term-care-services/forms/current/retest/ODH841-CNARetestApp-12.23.pdf' },
        /* 7 */ { title: 'Oklahoma CareerTech Testing Center — Nurse Aide certification exams', url: 'https://oklahoma.gov/careertech/testing-center/health-professional-certifications/nurse-aide.html' },
        /* 8 */ { title: 'CareerTech — Certified Nurse Aide Study Guide (official)', url: OKD + 'careertech/testing-centers/testing/study-guides/certified-nurse-aide-sg.pdf' },
        /* 9 */ { title: '42 CFR § 483.152 — federal training requirements (eCFR)', url: 'https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-483/subpart-D/section-483.152' },
        /* 10 */ { title: '42 CFR § 483.154 — federal competency evaluation (eCFR)', url: 'https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-483/subpart-D/section-483.154' },
        /* 11 */ { title: 'CareerTech — Clinical Skills Observer Manual (critical tasks, 7 skills/60 min, 80% accuracy; rev. 07/01/2025)', url: OKD + 'careertech/testing-centers/testing/hcp-coordinator-resources/cso-manual.pdf' },
        /* 12 */ { title: 'CareerTech — HCP Test Site Coordinator Manual (exam administration & passing score; rev. 07/01/2025)', url: OKD + 'careertech/testing-centers/testing/hcp-coordinator-resources/test-site-coord-manual.pdf' },
      ],
      facts: [
        { h: 'Who is in charge', text: 'The Oklahoma State Department of Health Nurse Aide Registry approves training programs and keeps the registry of certified nurse aides.', sources: [0, 1, 7] },
        { h: 'Training hours', text: 'A long term care aide training program must be at least 75 hours.', sources: [1, 3, 4, 9] },
        { h: 'Before you touch a resident', text: 'At least 16 hours of training must come before any direct contact with a resident: communication, infection control, safety and emergency procedures (including the Heimlich maneuver), promoting independence, and residents\' rights.', sources: [1, 3, 9] },
        { h: 'Hands-on practice', text: 'At least 16 hours of supervised practical (clinical) training.', sources: [1, 3, 4, 9] },
        { h: 'Alzheimer\'s training', text: 'Oklahoma requires at least 10 hours of training in the care of Alzheimer\'s patients.', sources: [1, 2, 3] },
        { h: 'The exam', text: 'The competency exam has a written test (you may ask for it to be given orally) and a skills test where you perform nurse aide tasks.', sources: [1, 8, 10] },
        { h: 'How the skills & written tests work', text: 'Long term care candidates perform 7 skills within 60 minutes. Every scenario includes walking with a transfer belt, a bed-to-wheelchair (or wheelchair-to-bed) transfer, range of motion, and vital signs including blood pressure. You must do all critical tasks correctly and 80% of the other tasks to pass the skills test, then score 70% or higher on the written test.', sources: [8, 11, 12] },
        { h: 'Where you test', text: 'The nurse aide exams are given through the Oklahoma CareerTech Testing Center at approved Health Certification Project (HCP) test sites. You must finish an approved training program first.', sources: [0, 7, 8] },
        { h: 'What to bring when you register for the exam', text: 'The CareerTech nurse aide page lists: the CNA Training Verification Form signed by your training program supervisor (or an approval letter from the Nurse Aide Registry); a valid, current photo ID issued by a U.S. government entity (for example a passport, driver\'s license or school-issued ID); proof of your Social Security number (Social Security card, a letter from the Social Security Administration, a W-2 or an official tax return); and an Affidavit of Lawful Presence. Check the page before you register — the list can change.', sources: [7, 0, 4] },
        { h: 'Staying certified', text: 'A long term care aide renews every 2 years and must have worked at least 8 hours of paid nursing or health-related services during the previous 24 months.', sources: [1, 5, 6] },
        { h: 'If you don\'t work for 24 months', text: 'Without at least 8 hours of paid nursing work in the 24-month period, you must retest (or, after a longer lapse, retrain) to be certified again.', sources: [1, 5, 6] },
      ],
      partial: [
        { text: 'Oklahoma has several nurse aide types, each with its own written exam: Long Term Care (exam 7C — the one this app prepares you for), Home Health Care (5A), ICF/IID Care (2A, formerly Developmentally Disabled Care), Adult Day Care (3A) and Residential Care (4A). Certified Medication Aides have separate rules.', sources: [7, 0], why: 'Listed on the CareerTech nurse aide exam page and the OSDH Nurse Aide Registry page (two official Oklahoma pages).' },
        { text: 'There is no state fee to apply for or renew a long term care aide certification (other aide types pay $10). Test sites set their own testing fees.', sources: [1, 5, 8], why: 'Confirmed in the rules and on the renewal form; the test-fee part comes from the study guide.' },
      ],
      correction: 'Note: some unofficial sites say Oklahoma CNAs need 8 hours of continuing education every year. On the official rules and renewal form, that requirement is for Certified MEDICATION Aides — not for long term care aides.',
      resources: [
        { title: 'Official Oklahoma CNA Study Guide (exam info, skills list, sample questions)', url: OKD + 'careertech/testing-centers/testing/study-guides/certified-nurse-aide-sg.pdf' },
        { title: 'Official Nurse Aide Practice Scenarios', url: OKD + 'careertech/testing-centers/testing/hcp/nurse-aide-practice-scenarios.pdf' },
        { title: 'State-approved Long Term Care Aide curriculum (OSDH)', url: OKD + 'health/health2/aem-documents/protective-health/long-term-care-services/forms/current/nurse-aide-training-program-resources/ltc/hrds-nar-ltc-curriculum%20-2023.pdf' },
        { title: 'Approved training programs list', url: OKD + 'careertech/testing-centers/testing/hcp/nar-approved-training-programs.pdf' },
        { title: 'Test sites list', url: OKD + 'careertech/testing-centers/testing/hcp/test-sites.pdf' },
        { title: 'Moving to Oklahoma with a CNA from another state? See "Reciprocity" on the OSDH Nurse Aide Registry page', url: 'https://oklahoma.gov/health/services/licensing-inspections/health-resources-development-service/nurse-aide-registry.html' },
        { title: 'Verify a nurse aide / Registry contact: (405) 426-8150 · NAR@health.ok.gov', url: 'https://oklahoma.gov/health/services/licensing-inspections/health-resources-development-service/nurse-aide-registry.html' },
      ],
    },
  };

  const howToFind = [
    'Search the web for: "<your state> nurse aide registry" and open the result that ends in .gov (or your state\'s official health department / board of nursing site).',
    'Look for the "candidate handbook" from your state\'s testing company — it lists the exact skills, critical steps, fees and testing rules.',
    'Ask your employer: many facilities offer free state-approved training to employees (see the money facts above).',
    'Write down the page address and the date you checked it in your Notes in this app.',
  ];

  function getState(code) {
    if (!code || !STATE_NAMES[code]) return null;
    return Object.assign({ code, name: STATE_NAMES[code], verified: !!verified[code] }, verified[code] || {});
  }

  const api = { federal, STATE_NAMES, verified, howToFind, getState };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.CNA = root.CNA || {}; root.CNA.states = api; }
})(typeof self !== 'undefined' ? self : this);
