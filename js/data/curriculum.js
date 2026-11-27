/* CNA learning pathway. Original educational text written for this project.
 * General nurse-aide knowledge for exam preparation. It does NOT replace an approved
 * training program, supervised clinical hours, or your state's competency evaluation.
 * Always follow your instructor, your facility's policies, and your state candidate handbook.
 *
 * Lesson: { id, unit, topic, title, minutes, summary, sections:[{h, text?, list?}], keyPoints:[] }
 * Knowledge-check questions live in questions.js (field `lesson`).
 * Official sources for every lesson live in sources.js. */
(function (root) {
  'use strict';

    // Units follow the topic order of Oklahoma's official "Course Standards to Teach the Oklahoma Long Term Care Nurse
  // Aide Training and Competency Evaluation Program" (OSDH, 2008, PDF p.1: Topics 1-29) — the order an Oklahoma
  // program teaches. `ok` = the Oklahoma topic numbers a unit covers. `first16` = a topic federal rule
  // 42 CFR 483.152(b)(1) (quoted on Course Standards p.1) requires in the first 16 hours, before any direct contact
  // with a resident: communication, infection control, safety/emergencies, residents' independence, residents' rights.
  const units = [
    { id: 'u1', topic: 'role', title: 'Health Care & Your Role as a Nurse Aide', icon: '🩺', ok: [1, 2, 28] },
    { id: 'u11', topic: 'documentation', title: 'Observing, Reporting & Documentation', icon: '📝', ok: [3] },
    { id: 'u5', topic: 'communication', title: 'Communication', icon: '💬', ok: [4], first16: true },
    { id: 'u3', topic: 'infection', title: 'Infection Prevention & Control', icon: '🧼', ok: [5], first16: true },
    { id: 'u4', topic: 'safety', title: 'Body Mechanics, Safety & Emergencies', icon: '🛡️', ok: [6, 7, 8], first16: true },
    { id: 'u2', topic: 'rights', title: 'Resident Rights & Independence', icon: '🤝', ok: [9, 10], first16: true },
    { id: 'u13', topic: 'aging', title: 'The Body, Aging, Memory Loss & Psychosocial Needs', icon: '🌱', ok: [11, 12, 13, 14] },
    { id: 'u14', topic: 'environment', title: 'The Resident\'s Room, Beds & Positioning', icon: '🛏️', ok: [15, 16] },
    { id: 'u7', topic: 'vitals', title: 'Vital Signs & Measurements', icon: '❤️', ok: [17] },
    { id: 'u6', topic: 'personal-care', title: 'Personal Care & Hygiene', icon: '🛁', ok: [18, 19, 20, 21, 22] },
    { id: 'u9', topic: 'mobility', title: 'Transfers & Walking', icon: '🦽', ok: [23, 24] },
    { id: 'u8', topic: 'nutrition', title: 'Nutrition & Hydration', icon: '🥗', ok: [25] },
    { id: 'u15', topic: 'elimination', title: 'Elimination: Toileting & Catheter Care', icon: '🚻', ok: [26] },
    { id: 'u10', topic: 'dementia', title: 'End-of-Life & Alzheimer\'s Care', icon: '🧠', ok: [27, 29] },
    { id: 'u12', topic: 'skills', title: 'Getting Ready for the Exam', icon: '🎓' },
  ];

  const lessons = [
    // ---------- Unit 1: Role ----------
    { id: 'role-1', unit: 'u1', topic: 'role', title: 'What a CNA does', minutes: 15,
      summary: 'The nurse aide gives hands-on daily care under the direction of a licensed nurse.',
      sections: [
        { h: 'The big picture', text: 'A Certified Nursing Assistant (CNA), also called a nurse aide, helps residents and patients with activities of daily living (ADLs): bathing, dressing, grooming, eating, toileting, moving and walking. CNAs work in nursing homes, hospitals, assisted living, home health and rehab centers. You work under the supervision of a licensed nurse (a registered nurse, RN, or a licensed practical nurse, LPN).' },
        { h: 'Activities of daily living (ADLs)', list: ['Bathing and personal hygiene', 'Dressing and grooming', 'Eating and drinking', 'Toileting and continence care', 'Transferring and moving (mobility)'] },
        { h: 'The care team', list: ['Registered Nurse (RN) and Licensed Practical Nurse (LPN) — plan and supervise care, give medications', 'Physician, nurse practitioner, physician assistant — diagnose and order treatment', 'Physical, occupational and speech therapists', 'Dietitian, social worker, activities staff', 'The resident and the resident\'s family — Oklahoma\'s course standards list them first on the team, and say family members are "a valuable part of the health care team"'] },
        { h: 'Why your observations matter', text: 'You spend more time with residents than almost anyone else on the team. Small changes you notice — a new cough, confusion, not eating, skin redness — and report to the nurse can prevent serious problems.' },
        { h: 'Licensing and inspections (the survey process)', list: ['Every Oklahoma facility that employs CNAs is licensed by the Oklahoma State Department of Health (OSDH) and must meet state rules and/or federal requirements to keep that license (some nursing facilities are licensed by the state only and are not Medicaid-certified)', 'A standard survey (also called the annual survey) is an inspection to check that the facility follows federal requirements and state regulations', 'Federal rules require each nursing home to have a standard survey no later than 15 months after the last one, and the statewide average must be 12 months or less'] },
      ],
      keyPoints: ['CNAs help residents with activities of daily living (ADLs), working under a licensed nurse.', 'Report changes in a resident to the nurse right away.', 'You are part of a health care team that coordinates each resident\'s care.', 'The Oklahoma State Department of Health licenses nursing homes and inspects them with a standard survey about once a year.'] },

    { id: 'role-2', unit: 'u1', topic: 'role', title: 'Scope of practice & professionalism', minutes: 15,
      summary: 'Know what you can and cannot do, and act professionally and ethically.',
      sections: [
        { h: 'Scope of practice', text: 'Scope of practice means the tasks you are trained and legally allowed to do. Only do tasks you were trained for, that are in your job description, and that the nurse assigned to you. If you are unsure, ask the nurse before acting.' },
        { h: 'Things nurse aides generally do NOT do', list: ['Give medications (unless you are separately certified, for example as a Certified Medication Aide)', 'Insert or remove tubes such as urinary catheters or feeding tubes', 'Take verbal or phone orders from a doctor — orders go to the nurse (general nursing practice; follow facility policy)', 'Diagnose or tell a resident/family about a diagnosis', 'Perform sterile procedures, such as a sterile dressing change (in Oklahoma\'s sample test question, when a sterile dressing falls off, the aide does not re-apply it; the aide places a clean towel or pillowcase under the foot and stays with the resident)', 'Change a care plan on your own'] },
        { h: 'Delegation', text: 'The nurse delegates (assigns) tasks to you. You may refuse a task only if it is outside your scope, you were not trained, it is unsafe, or it is unethical or illegal — and you must tell the nurse right away and explain why. Never simply ignore an assignment.' },
        { h: 'Professional behavior', list: ['Be on time, reliable and in proper uniform', 'Keep resident information confidential (HIPAA)', 'Do not accept tips or gifts of money (facility policy — follow your employer\'s rules)', 'Do not discuss residents on social media or in public', 'Be honest — report your own mistakes right away'] },
      ],
      keyPoints: ['Only do tasks you are trained and allowed to do (your scope of practice).', 'If you are unsure, ask the nurse.', 'Keep resident information confidential.'] },
    { id: 'anatomy-1', unit: 'u13', topic: 'aging', title: 'Basic anatomy: the body systems', minutes: 20,
      summary: 'How the body is built and what each body system does — Oklahoma Topic 11, the base for understanding every procedure.',
      sections: [
        { h: 'How the body is built', list: ['Cells — the basic building blocks of all living things. Each cell takes in food, water and oxygen and gets rid of waste', 'Tissues — groups of similar cells that work together', 'Organs — groups of tissues that do one or more special jobs', 'Systems — groups of organs that work together to do a main body job'] },
        { h: 'Integumentary system (skin, hair, nails)', list: ['Skin keeps germs out — it is the body\'s first line of defense against infection', 'Hair protects the skin and organs; nails protect the tips of fingers and toes', 'Oil glands keep skin moist and smooth; sweat glands cool the body'] },
        { h: 'Musculoskeletal system (bones and muscles)', list: ['Bones are the frame of the body; a joint is where two bones meet and allows movement', 'Muscles contract (shorten) and relax (lengthen) to make movement possible', 'Ligaments connect bone to bone and support joints', 'Tendons connect muscles to bones', 'Cartilage cushions joints'] },
        { h: 'Nervous and endocrine systems', list: ['Brain — sends, receives and makes sense of messages', 'Spinal cord — carries messages between the nerves and the brain', 'Nerves — carry messages between the brain and the rest of the body', 'Endocrine glands make hormones that control body functions'] },
        { h: 'Circulatory and respiratory systems', list: ['The heart pumps blood through the body', 'Blood travels in blood vessels: arteries, veins and capillaries', 'Air comes in through the mouth and nose and travels down the trachea (windpipe) to the lungs', 'The lungs move oxygen from the air into the blood and remove carbon dioxide (a waste gas)'] },
        { h: 'Urinary system', list: ['Kidneys filter waste from the blood and make urine', 'Ureters carry urine from the kidneys to the bladder', 'The bladder stores urine', 'The urethra carries urine from the bladder out of the body'] },
        { h: 'Gastrointestinal (digestive) system', list: ['Mouth — takes in and chews (masticates) food and fluid', 'Esophagus — carries food from the mouth to the stomach', 'Stomach — mixes food with digestive juices', 'Small intestine — absorbs nutrients; large intestine — absorbs water from waste', 'Rectum stores waste; the anus is the opening where waste leaves the body', 'The liver and gallbladder help digestion'] },
        { h: 'Reproductive system', list: ['Male: testes make testosterone and sperm; the prostate makes fluid for sperm; the penis is the external organ for urine and semen', 'Female: ovaries make estrogen, progesterone and eggs (ova); fallopian tubes carry eggs to the uterus; the vagina is the canal leading out of the body; breasts make milk for infants'] },
        { h: 'Why a nurse aide needs this', text: 'Oklahoma\'s course standards say the nurse aide should understand the body and think about how it works whenever doing a procedure. Our examples: why you clean from front to back (urinary system), why you keep skin clean and dry (skin is the first defense against infection), and why you support joints during range of motion.' },
      ],
      keyPoints: ['Skin is the body\'s first line of defense against infection — it keeps germs out.', 'Ligaments connect bone to bone; tendons connect muscles to bones.', 'Kidneys filter waste from the blood and make urine; ureters carry it to the bladder, which stores it, and the urethra carries it out of the body.', 'The lungs move oxygen from the air into the blood and remove carbon dioxide.', 'The heart pumps blood through the blood vessels — arteries, veins and capillaries.'] },
    { id: 'role-3', unit: 'u1', topic: 'role', title: 'How the body changes with age', minutes: 20,
      summary: 'Normal aging changes in every body system and the senses, and how a nurse aide helps. From Oklahoma\'s official course standards (Topic 12: The Aging Process), checked against Indiana and Virginia official curricula and NIH.',
      sections: [
        { h: 'Normal aging — how body systems and skin change', list: ['Lungs: lung capacity decreases and deep breathing is harder, so the resident may breathe faster when active, ill or stressed', 'Heart and blood vessels: vessels become more rigid and narrow; the heart works harder, which may cause high blood pressure and poor circulation', 'Digestion: taste decreases and appetite may drop; tooth and gum problems make eating harder; constipation is more common', 'Urinary: kidneys filter waste more slowly; bladder tone decreases, so urination is more frequent and incontinence and bladder infections are more likely', 'Skin: less fat, water and oil, so it is drier and more sensitive to cold (Oklahoma); Virginia\'s curriculum adds that it becomes thinner and more fragile', 'Bones and muscles: bones become brittle and break more easily; muscles weaken; joints are stiffer — move and transfer residents gently', 'Nervous system: short-term memory may decrease; less awareness of pain and injury (Oklahoma). Virginia\'s curriculum lists slower reaction time as a fall risk'] },
        { h: 'Normal aging — how the senses (sight, hearing, smell, taste & touch) change', list: ['Sight: it gets harder to see things up close (presbyopia) and to see in dim light; Virginia\'s curriculum adds that eyes adjust more slowly to light changes. Oklahoma\'s course standards add that reds and oranges are easier to see than blues and greens', 'Hearing: gradual hearing loss (presbycusis) is common, starting with high-pitched sounds. Face the resident and speak slowly and distinctly (Oklahoma)', 'Smell and taste: weaker, which can lower appetite and make it hard to notice smoke or body odor', 'Touch: less feeling in the skin, so hot items and bumps may not be noticed — always check water temperature to prevent burns'] },
        { h: 'Feelings and social changes', list: ['Loss of friends and family, and of the ability to join social activities', 'Change in role in the family or community, which can make a person feel less useful or respected', 'Changes in income and giving up a home, car or belongings', 'Self-esteem can become hard to keep up'] },
        { h: 'How you help (Oklahoma course standards)', list: ['Help each resident be as independent as possible — do not take over tasks they can do', 'Be patient and a good listener; do not rush', 'Watch for safety hazards', 'Treat each resident as an adult and use the name and title they prefer', 'Some residents like touch for comfort and some do not — respect their choice', 'Report changes you notice (for example new trouble hearing, eye drainage, or a broken hearing aid) to the nurse'] },
      ],
      keyPoints: ['Aging slows every body system: lungs hold less air, vessels stiffen, bladder tone decreases, bones get brittle and muscles weaken.', 'Older skin is drier (Oklahoma) and, Virginia\'s curriculum adds, thinner and more fragile; older bones break more easily — move and transfer residents gently.', 'Hearing loss (presbycusis) and trouble seeing up close (presbyopia) are normal with age — face the resident and speak clearly without shouting.', 'Be patient, do not rush, and let residents do what they can for themselves.'] },

    // ---------- Unit 2: Rights ----------
    { id: 'rights-1', unit: 'u2', topic: 'rights', title: 'Resident rights', minutes: 20,
      summary: 'Residents keep their rights as people and citizens when they move into a care facility.',
      sections: [
        { h: 'Why rights matter', text: 'In the United States, federal rules for nursing homes (from the Omnibus Budget Reconciliation Act of 1987, "OBRA") protect resident rights. Facilities must post them and staff must honor them every day.' },
        { h: 'Key resident rights', list: ['To be treated with dignity and respect', 'To privacy — in care, in communication and in their records', 'To make their own choices (daily schedule, clothing, activities)', 'To be informed about their care and to refuse care or treatment', 'To be free from abuse, neglect and exploitation', 'To be free from physical or chemical restraints used for discipline or staff convenience', 'To voice complaints without fear of punishment', 'To manage their own money (federal rule, 42 CFR 483.10(f)(10)) and to keep and use personal possessions (Oklahoma)', 'To visit and communicate with people of their choosing'] },
        { h: 'If a resident refuses care', text: 'A resident has the right to refuse. Do not force or argue. Stay calm, ask why, explain what the care is for, offer to try again later or another choice, and report the refusal to the nurse.' },
      ],
      keyPoints: ['Residents have the right to refuse care — respect it and tell the nurse.', 'Restraints are never used for staff convenience or discipline.', 'Protect privacy and dignity in every task.'] },

    { id: 'rights-2', unit: 'u2', topic: 'rights', title: 'Privacy, dignity & preventing abuse', minutes: 20,
      summary: 'How to protect privacy and dignity, and what to do if you suspect abuse.',
      sections: [
        { h: 'Protecting privacy & dignity', list: ['Knock and wait before entering; introduce yourself', 'Close the door, curtain and blinds during care', 'Keep the resident covered except the part being cared for', 'Call the resident by the name they prefer — never "honey" or "sweetie" unless they ask', 'Let them do as much for themselves as they can (promotes independence)', 'Never discuss a resident where others can hear'] },
        { h: 'Types of abuse & neglect', list: ['Physical — hitting, rough handling, unnecessary restraint', 'Verbal/emotional — yelling, threats, insults, ignoring', 'Sexual — any unwanted sexual contact', 'Financial — stealing or misusing money/belongings', 'Neglect — failing to give needed care (food, water, toileting, repositioning)', 'Involuntary seclusion — isolating a resident against their will'] },
        { h: 'Your legal duty — what to do & reporting suspected abuse, neglect or hitting a resident', text: 'Oklahoma\'s course standards say: report suspected abuse or neglect to the nurse immediately. You report what you suspect. Virginia\'s curriculum calls nurse aides mandated reporters — required by law to report suspected or observed abuse or neglect. In Oklahoma, violations must be reported according to state laws and facilities must investigate thoroughly. If a resident is in danger right now, protect them first. Tip: do not ignore it, and do not confront the person yourself — tell the nurse.' },
      ],
      keyPoints: ['Knock before entering, and provide privacy (door, curtain) during care.', 'Report suspected abuse or neglect to the nurse immediately (Oklahoma\'s course standards).', 'Neglect is a form of abuse.'] },
    { id: 'rights-3', unit: 'u2', topic: 'rights', title: 'Promoting independence & choices', minutes: 20,
      summary: 'Oklahoma\'s written exam has a whole duty area on this: residents keep making their own choices and doing what they can for themselves.',
      sections: [
        { h: 'What independence means', text: 'Oklahoma\'s nurse aide course standards describe independence as the resident\'s choices, thinking, feelings, daily-life decisions (bathing, eating, drinking), activities, relationships and freedom — with safety always. A person living in a nursing facility has not lost the ability to feel, understand and make choices.' },
        { h: 'Do not take tasks away — when a resident is slow to dress or eat', text: 'Residents may be slow to dress or eat, but caregivers should not take these tasks away from them. Let the resident do as much as they can, help only with what they cannot do, and give them time. Feeling in control — even of a small task like buttoning a shirt — matters.' },
        { h: 'Offer real choices', list: ['When to get up and go to bed', 'When and how often to bathe or shower', 'What to wear (offering two outfits can help)', 'What and when to eat', 'Which activities to join', 'When to use the toilet'] },
        { h: 'Dignity', text: 'Respecting privacy and keeping information confidential protect the resident\'s dignity and self-esteem. Use self-help devices the care plan provides so residents can move and care for themselves.' },
      ],
      keyPoints: ['Let residents do as much for themselves as they can — even if it takes longer.', 'Always offer choices: when to bathe, what to wear, what to eat, what to do.', 'Privacy and confidentiality protect dignity and self-esteem.'] },

    // ---------- Unit 3: Infection ----------
    { id: 'infection-1', unit: 'u3', topic: 'infection', title: 'How infections spread', minutes: 20,
      summary: 'The chain of infection and how breaking any link stops the spread.',
      sections: [
        { h: 'The chain of infection (the 6 links)', list: ['Infectious agent — the germ (bacteria, virus, fungus)', 'Reservoir — where it lives (people, surfaces, water)', 'Portal of exit — how it leaves (cough, blood, stool, wounds)', 'Mode of transmission — how it travels (hands, droplets, air, objects)', 'Portal of entry — how it gets in (mouth, nose, broken skin, catheter)', 'Susceptible host — a person who can get sick (older adults are at higher risk)'] },
        { h: 'Break the chain', text: 'Hand hygiene is one of the best ways to prevent the spread of infection. Cleaning equipment, using gloves and other PPE correctly, and keeping residents clean and dry also break links in the chain.' },
        { h: 'Signs of infection to report', list: ['Fever or chills', 'Redness, swelling, warmth, pain or drainage at a site', 'New cough or trouble breathing', 'Cloudy, foul-smelling urine or burning', 'New or sudden confusion — report it right away (Oklahoma). In older adults this may be an early sign of infection (MedlinePlus)'] },
      ],
      keyPoints: ['Hand hygiene is one of the best ways to stop the spread of infection.', 'Report any new or sudden confusion to the nurse right away. (In older adults it can be a sign of infection — MedlinePlus and Virginia.)'] },

    { id: 'infection-2', unit: 'u3', topic: 'infection', title: 'Hand hygiene & standard precautions', minutes: 20,
      summary: 'Treat all blood and body fluids as potentially infectious.',
      sections: [
        { h: 'Standard precautions', text: 'Standard precautions are used with every person, every time, because you cannot tell who carries an infection. Treat blood, all body fluids (except sweat), non-intact skin and mucous membranes as potentially infectious.' },
        { h: 'When to clean your hands', list: ['Before and after contact with each resident', 'Before putting on gloves and after removing them', 'After touching body fluids or contaminated items', 'Before handling food or clean supplies', 'After using the restroom'] },
        { h: 'Soap & water vs. hand sanitizer', text: 'Oklahoma\'s feeding assistant curriculum says: wash with soap and water right away, or as soon as you can, after contact with blood or other potentially infectious materials. If there has been no such contact, an antiseptic hand cleaner (hand sanitizer) may be used. CDC adds: wash with soap and water when hands are visibly soiled, and use a hand sanitizer with at least 60% alcohol. For C. difficile (C. diff), the CDC says hand sanitizer does not kill C. diff spores, so wear gloves and a gown even for short visits — the gloves keep spores off your hands. Many facilities also require soap and water after C. diff care, especially during an outbreak, so follow your facility policy.' },
        { h: 'Handwashing basics — how long to scrub & wash your hands', list: ['Wet hands with warm water, fingertips pointing down', 'Apply soap and lather all surfaces — palms, backs, between fingers, under nails', 'Scrub for at least 20 seconds. Oklahoma\'s standards say at least 10 seconds and CDC says at least 15–20, so 20 seconds meets all of them', 'Rinse with fingertips down', 'Dry with a clean paper towel; use a clean, dry towel to turn off the faucet', 'Do not touch the sink with your hands or uniform'] },
      ],
      keyPoints: ['Standard precautions are used for all resident care.', 'CDC: hand sanitizer does not kill C. diff spores — wear gloves and a gown for C. diff care. Oklahoma: wash with soap and water after contact with blood or other potentially infectious materials.', 'Lather and scrub all surfaces: Oklahoma\'s standards say at least 10 seconds and CDC says at least 15–20 — scrubbing 20 seconds meets all of them.'] },

    { id: 'infection-3', unit: 'u3', topic: 'infection', title: 'PPE & transmission-based precautions', minutes: 20,
      summary: 'Gloves, gowns, masks and eye protection — when to use them and in what order.',
      sections: [
        { h: 'Personal protective equipment (PPE)', list: ['Gloves — touching body fluids, mucous membranes, broken skin, soiled items', 'Gown — when clothing may get splashed or soiled', 'Mask/respirator — droplet or airborne risk', 'Goggles/face shield — when splashes to the face are possible'] },
        { h: 'Common donning (putting on) order', text: 'Hand hygiene → gown → mask or respirator → goggles/face shield → gloves (pulled over the gown cuffs).' },
        { h: 'Common doffing (taking off) order', text: 'Gloves → goggles/face shield → gown → mask or respirator → hand hygiene. Gloves are the most contaminated, so they come off first. Oklahoma\'s PPE guide (OSDH): remove all PPE before you leave the room, except a respirator if you wear one. Remove the respirator after you leave the room and close the door. Always follow your facility\'s posted sequence.' },
        { h: 'Transmission-based precautions', list: ['Contact — Oklahoma\'s examples: conjunctivitis, scabies and impetigo. CDC: gown and gloves, and CDC also uses contact precautions for C. diff. (For MRSA, Oklahoma says follow Standard Precautions.)', 'Droplet — e.g. influenza: mask within close range', 'Airborne — Oklahoma\'s examples: tuberculosis, chickenpox and measles. Wear a respirator and fit-check it (seal check) (OSDH). CDC: a fit-tested N95 respirator and a special negative-pressure room'] },
        { h: 'Sharps and linens', text: 'Oklahoma: handle and dispose of sharps safely according to current nursing practices and local and state laws. OSHA: do not recap used needles; put sharps in a puncture-resistant sharps container. Hold soiled linen away from your uniform, never shake it (CDC), and place it in the proper laundry bag.' },
      ],
      keyPoints: ['When taking off PPE, gloves come off first.', 'Never put linen on the floor.', 'Carry linen away from your uniform.'] },
    { id: 'infection-4', unit: 'u3', topic: 'infection', title: 'Medical asepsis: clean vs. sterile', minutes: 15,
      summary: 'Medical asepsis means keeping germs from spreading by keeping clean things away from dirty things.',
      sections: [
        { h: 'Words to know', list: ['Sterilization — kills ALL microorganisms (for example with steam or chemicals)', 'Disinfection — kills or reduces disease-causing germs', 'Clean — free of visible dirt; clean is NOT sterile', 'Medical asepsis — practices that keep clean things away from dirty things to stop the spread of germs', 'Contaminated — has touched something dirty or unsterile'] },
        { h: 'Medical asepsis in daily care', list: ['Treat blood, body fluids, secretions, excretions, broken skin and mucous membranes as potentially infectious (Standard Precautions)', 'Clean your hands before resident contact or a clean task, after contact with blood or body fluids, and right after removing gloves', 'Work from clean to dirty', 'Carry linen away from your uniform and never put it on the floor', 'Nurse aides do not perform sterile procedures — in Oklahoma\'s sample test question, the aide does not re-apply a sterile dressing that fell off; when the charge nurse cannot come, the aide places a clean towel or pillowcase under the foot and stays with the resident'] },
        { h: 'Isolation bags', text: 'Oklahoma\'s official Nurse Aide Skills List includes "Double-bag for isolation precautions," so learn it for the Oklahoma test. Current CDC guidance says a single bag of sufficient strength is usually adequate for laundry and solid waste. At work, follow your facility\'s isolation policy.' },
      ],
      keyPoints: ['Sterilization kills all microorganisms; disinfection kills or reduces germs — clean is not sterile.', 'Clean your hands before resident contact or a clean task, after body fluids, and right after removing gloves.', 'Oklahoma tests double-bagging for isolation; CDC says one strong bag is usually enough — follow your facility\'s policy.'] },

    // ---------- Unit 4: Safety ----------
    { id: 'safety-1', unit: 'u4', topic: 'safety', title: 'Preventing falls & injuries', minutes: 20,
      summary: 'Falls are a leading cause of injury in older adults. Most can be prevented.',
      sections: [
        { h: 'Fall prevention & room safety checks before leaving', list: ['Keep the call light within the resident\'s reach — always', 'Bed height: up for care, down for transfer; lock wheelchair and bed brakes (Oklahoma). Many facilities also leave the bed low when care is done; follow the care plan', 'Non-skid footwear when walking', 'Clear clutter and wipe up spills right away', 'Good lighting — Oklahoma says indirect lighting is preferable because glare causes fatigue', 'Answer call lights promptly; take the resident to the bathroom frequently (Oklahoma, for residents with dementia)', 'Lock wheelchair brakes before transfers'] },
        { h: 'If a resident starts to fall', text: 'If a resident begins to fall, never try to stop the fall. Gently ease the resident to the floor (Oklahoma). Body-mechanics tip: keep your back straight, widen your stance, and protect their head. Call for help immediately, and keep the resident in the same position until the nurse examines them (Oklahoma).' },
        { h: 'Restraints', text: 'Restraints limit movement and can cause harm — Virginia\'s curriculum lists bruising, pressure sores and a risk of suffocation. Oklahoma requires a specific doctor\'s order, and federal rules (42 CFR 483.12(a)(2)) require the least restrictive alternative for the least amount of time. Bed rails can count as restraints. Follow the care plan exactly and never use a restraint for convenience.' },
      ],
      keyPoints: ['Before you leave: call light within reach, wheels locked, and the bed at the height your facility and care plan say (Oklahoma: up for care, down for transfer).', 'If a resident starts to fall, never try to stop the fall — gently ease them to the floor and call for help.'] },

    { id: 'safety-2', unit: 'u4', topic: 'safety', title: 'Fire, choking & emergencies', minutes: 20,
      summary: 'Know what to do when seconds count.',
      sections: [
        { h: 'Fire: RACE (Oklahoma\'s wording)', list: ['R — Remove residents from the immediate fire area to safety', 'A — Activate the alarm', 'C — Contain the fire by closing all doors and windows', 'E — Extinguish the fire (only if it is small and you are trained; otherwise follow the facility\'s evacuation plan)', 'Some books say "Rescue" for R. Oklahoma\'s course standards say "Remove" — both mean getting residents away from the fire.'] },
        { h: 'Using an extinguisher: PASS', list: ['P — Pull the pin', 'A — Aim the nozzle (general fire-safety guidance: at the base of the fire)', 'S — Squeeze the handle', 'S — Sweep from side to side'] },
        { h: 'Oxygen safety', text: 'Oxygen supports burning. No smoking, open flames or sparking items near oxygen. Post "oxygen in use" signs as required and report problems with equipment to the nurse. Oklahoma says oxygen is highly flammable — use extreme caution. Do not change oxygen settings yourself; that is the nurse\'s job (general scope of practice).' },
        { h: 'Choking', text: 'Signs of choking (Oklahoma): the resident cannot breathe, speak or cough, or gasps or clutches at the throat (the universal sign for choking). Call for help immediately. The procedure for an adult is the Heimlich procedure (abdominal thrusts) — Oklahoma says knowing this procedure is required of all CNAs. MedlinePlus: if the person is coughing forcefully and can speak, do not do first aid — a strong cough can dislodge the object. Your CPR/first-aid course teaches the hands-on steps.' },
        { h: 'Other emergencies — seizure, fainting, stroke, chest pain', list: ['Seizure — protect the head, move objects away, do not hold them down, nothing in the mouth, time it, call the nurse', 'Fainting — help them lie down, call the nurse', 'Signs of stroke (Oklahoma): headache, dizziness, weakness or paralysis of an arm or leg or one side of the body, inability to talk — get the nurse immediately. Virginia\'s curriculum adds: drooping on one side of the face, and note the time the signs began', 'Chest pain or trouble breathing — get help immediately'] },
      ],
      keyPoints: ['Fire: RACE (Remove residents, Activate the alarm, Contain, Extinguish). Extinguisher: PASS (Pull, Aim, Squeeze, Sweep).', 'Never allow open flames or electrical appliances near oxygen.', 'Seizure: protect from injury, never restrain, put nothing in the mouth.'] },

    { id: 'safety-3', unit: 'u4', topic: 'safety', title: 'Body mechanics — protecting your back', minutes: 15,
      summary: 'Use your body safely so you can care for others for years.',
      sections: [
        { h: 'Good body mechanics', list: ['Keep a wide base of support — feet shoulder-width apart', 'Bend at the hips and knees, not the waist', 'Keep your back straight and the load close to your body', 'Use the strong muscles of your legs to lift', 'Do not twist — pivot your feet instead', 'Raise the bed to a comfortable working height (then lower it when done)', 'Get help or use lifting equipment when needed'] },
      ],
      keyPoints: ['Bend your knees, keep your back straight, and lift with your legs.', 'Never lift and twist — pivot your feet instead.', 'If in doubt, get help (or use lifting equipment).'] },
    { id: 'safety-4', unit: 'u4', topic: 'safety', title: 'Restraints & restraint alternatives', minutes: 20,
      summary: 'Restraints limit a resident\'s freedom and can cause harm. They require a doctor\'s order, and federal rules require the least restrictive alternative for the least amount of time.',
      sections: [
        { h: 'What counts as a restraint', list: ['Physical restraints (Virginia\'s examples): vest, wrist or ankle, waist/belt, mitt', 'Bed side rails, when used to keep a resident in bed', 'Any chair that keeps a resident from getting up (Virginia)', 'Chemical restraints: medicine used to control behavior'] },
        { h: 'The rules', list: ['A specific doctor\'s order is required', 'Never used for staff convenience or discipline', 'Federal rules (42 CFR 483.12(a)(2)) require the least restrictive alternative for the least amount of time', 'Apply exactly as the manufacturer and your training say, with a quick-release knot', 'Check fit: Oklahoma\'s standards say a flat hand should fit between the resident and the restraint', 'Release at least every 2 hours and provide activity', 'Check the resident often: Oklahoma\'s standards say at least every hour; Virginia\'s curriculum says at least every 15 minutes — follow your facility\'s policy and the care plan', 'Document according to facility policy'] },
        { h: 'Problems restraints cause (Virginia\'s nurse aide curriculum)', list: ['Bruising, and a risk of suffocation', 'Pressure sores, pneumonia, constipation and incontinence from not moving', 'Agitation, stress and anxiety', 'Loss of independence, dignity and self-esteem'] },
        { h: 'Alternatives: look for the cause first', text: 'Virginia\'s curriculum: before a restraint is ever considered, look for the reason behind the behavior — is the resident wet, soiled, tired, thirsty, hungry, bored, in pain, or confused? Meet the need, offer meaningful activities, and redirect. Oklahoma\'s course standards say difficult behavior may result from too much stimulation, change in routine or environment, physical pain or discomfort, reactions to medications, and fatigue — try to distract the resident and redirect behavior. Report behavior changes to the nurse.' },
      ],
      keyPoints: ['A restraint needs a doctor\'s order and is never used for staff convenience or discipline.', 'Release a restraint at least every 2 hours and provide activity.', 'Virginia\'s curriculum: look for the cause first (wet, hungry, thirsty, tired, bored, in pain). Federal rules: use the least restrictive alternative.'] },

    // ---------- Unit 5: Communication ----------
    { id: 'communication-1', unit: 'u5', topic: 'communication', title: 'Communicating with residents', minutes: 15,
      summary: 'Clear, kind communication builds trust and safety.',
      sections: [
        { h: 'Basics', list: ['Introduce yourself and explain what you will do before you start', 'Face the person, at eye level, and speak clearly', 'Use simple words and short sentences', 'Listen actively — nod, ask open questions, give them time to answer', 'Watch body language — yours and theirs'] },
        { h: 'Special needs — communicating with residents who have hearing loss, vision loss (clock positions on a plate or meal tray) or aphasia', list: ['Hearing loss — face them, reduce background noise, speak clearly (don\'t shout), check that hearing aids are in and working', 'Vision loss — say who you are when you enter, explain what you are doing, describe where things are (clock positions on a plate), and tell the resident when you are entering or leaving the room (Oklahoma). Tip: keep items where the resident expects them', 'Aphasia after a stroke — be patient with residents who have difficulty communicating (Oklahoma). Gestures, yes/no questions and picture boards are common practice (general nursing practice — follow the care plan)', 'Different language — tell the nurse. Residents have the right to be informed "in a language they can understand" (Oklahoma). Virginia\'s curriculum says to use available interpreter services per facility policy'] },
      ],
      keyPoints: ['Always introduce yourself and explain what you will do.', 'With hearing loss: face the person and speak slowly and clearly — don\'t shout.'] },

    { id: 'communication-2', unit: 'u5', topic: 'communication', title: 'Working with families & the team', minutes: 15,
      summary: 'Respectful communication with families and coworkers.',
      sections: [
        { h: 'When families ask about a resident\'s diagnosis, condition or medications — what to say', text: 'Families may feel worried, guilty or angry. Listen, stay calm and polite, and do not take it personally. Questions about the resident\'s condition, diagnosis or medications go to the nurse.' },
        { h: 'Handling complaints', text: 'Listen without arguing, thank them for telling you, fix it if it is within your role, and report it to the nurse. Residents and families have the right to complain without retaliation.' },
        { h: 'Reporting to the nurse', text: 'Be specific and factual: who, what, when, where. Report anything unusual right away, and report at the end of your shift (hand-off).' },
      ],
      keyPoints: ['Give facts, not opinions.', 'Share what you observe with the care team so the nurse knows.'] },

    // ---------- Unit 6: Personal care ----------
    { id: 'personal-care-1', unit: 'u6', topic: 'personal-care', title: 'Bathing & skin care', minutes: 20,
      summary: 'Bathing keeps skin healthy and gives you a chance to check the skin.',
      sections: [
        { h: 'Before any care', list: ['Knock, introduce yourself, explain the procedure', 'Wash hands; gather supplies', 'Provide privacy', 'Check water temperature (use a thermometer if available, or test on your inner wrist) and ask the resident if it feels comfortable', 'Raise bed to working height; lock wheels'] },
        { h: 'Bed bath order', text: 'Work from cleanest to dirtiest: eyes (no soap, wipe inner to outer corner, a different part of the cloth for each eye), face, arms and underarms, chest, abdomen, legs and feet, back, then perineal area last with fresh water. Change water when it becomes dirty, soapy or cool.' },
        { h: 'Pressure injuries (bedsores) — turning & repositioning residents in bed', text: 'Pressure injuries form over bony areas (hips, heels, tailbone/sacrum, elbows, ears, shoulder blades) when pressure cuts off blood flow. Prevent them by repositioning at least every 2 hours (or as the care plan says), keeping skin clean and dry, avoiding wrinkles in linens, and encouraging food and fluids. Report any red area that does not fade, blisters, or open skin.' },
        { h: 'Daily skin care and checks (Oklahoma Topic 19)', list: ['Skin is the largest organ; it helps control body temperature and is the first line of defense against infection', 'Aging skin is thinner, less elastic and easier to damage — it tears and bruises more easily, so handle it gently', 'During care, look for rashes, scrapes (abrasions), dryness, color changes, pressure areas, warmth or coolness, bruising and swelling — report anything unusual to the nurse right away', 'Pressure sores also form in friction areas where skin rubs on skin: under the breasts and belly folds, between the buttocks and legs, under the arms, in the groin and around tubing', 'Pat the skin dry instead of rubbing, and put lotion on dry areas', 'Keep linens dry, wrinkle-free and free of crumbs or objects; make sure clothing, shoes and incontinence briefs are not too tight (plastic away from the skin)', 'Give back rubs to increase comfort and circulation (follow the care plan)', 'Use heel and elbow protectors, pillows or foam pads to cushion pressure areas', 'Wear gloves (Standard Precautions) if the skin is broken'] },
      ],
      keyPoints: ['Bathe clean to dirty: eyes first, with no soap, inner corner to outer corner.', 'Reposition at least every 2 hours (or as the care plan says).', 'Report redness over a pressure point that does not go away.', 'Pat the skin dry instead of rubbing — it helps prevent skin tears — and put lotion on dry skin.', 'Back rubs increase comfort and circulation.', 'Aging skin is thinner and tears and bruises more easily, so handle it gently.'] },

    { id: 'personal-care-2', unit: 'u6', topic: 'personal-care', title: 'Oral care, grooming & dressing', minutes: 20,
      summary: 'Grooming supports dignity, comfort and health.',
      sections: [
        { h: 'Oral care', list: ['Oklahoma requires oral care at least daily (OSDH regulations) — more often for residents who are unconscious, vomiting, have a high temperature, breathe through the mouth, are on oxygen, or are dying. Brush the teeth and tongue gently', 'Unconscious residents: position on their side, use very little liquid and a swab to prevent choking/aspiration', 'Dentures: handle carefully over a sink lined with a towel and filled halfway with water (Oklahoma); rinse under warm water (never hot; hot water may damage dentures); store them in cool water in a denture cup marked with the resident\'s name'] },
        { h: 'Shaving, nails & hair', list: ['Never use an electric razor near any water source, when oxygen is in use, or if the resident has a pacemaker (Oklahoma). Never use any electrical appliance near oxygen', 'Nail care: soak, clean and file. Never cut the toenails of a resident who is diabetic or has impaired circulation (Oklahoma) — a podiatrist provides the best care', 'Let residents choose their hairstyle and products'] },
        { h: 'Dressing with a weak side', text: 'Let the resident choose their clothes. For one-sided weakness (e.g. after a stroke): dress the weak (affected) side first, and undress the strong side first. "Weak in first, strong out first."' },
      ],
      keyPoints: ['Store dentures in cool water in a labeled cup — never use hot water.', 'Dress the weak side first; undress the strong side first.', 'Never use an electric razor near water, when oxygen is in use, or if the resident has a pacemaker.'] },

    { id: 'personal-care-3', unit: 'u6', topic: 'personal-care', title: 'Toileting, perineal & catheter care', minutes: 20,
      summary: 'Respectful, clean toileting care prevents infection and skin breakdown.',
      sections: [
        { h: 'Perineal care', text: 'Always clean from front to back (cleanest to dirtiest) to keep stool bacteria away from the urinary tract. Use a clean area of the washcloth for each stroke. Rinse and pat dry well. For an uncircumcised male, gently pull back the foreskin and clean beneath it (Oklahoma, Procedure 34), then return the foreskin to its normal position (standard practice — not written in the Oklahoma document).' },
        { h: 'Urinary catheter care', list: ['Clean the catheter tubing starting at the opening (meatus) and moving outward/down about 4 inches (Oklahoma course standards, Procedure 34), using a clean area of the cloth each stroke', 'Keep the drainage bag below the level of the bladder, off the floor', 'Keep the tubing free of kinks and secured to the leg', 'Report: no urine, blood, cloudy urine, foul odor, leaking or complaints of pain'] },
        { h: 'Bedpans & incontinence', text: 'Offer toileting regularly. Provide privacy and toilet paper, and allow hand washing afterward. Incontinence care should be done promptly and without negative comments. Measure and record output if ordered.' },
      ],
      keyPoints: ['Perineal care: front to back, using a clean part of the washcloth for each stroke.', 'Keep the drainage bag below the bladder and off the floor.', 'Report urine that is cloudy, bloody, foul-smelling, or not draining.'] },
    { id: 'personal-care-4', unit: 'u6', topic: 'personal-care', title: 'Bowel & bladder retraining', minutes: 15,
      summary: 'Retraining helps an incontinent resident regain control. It takes time, a steady schedule and a positive attitude.',
      sections: [
        { h: 'How bowel and bladder retraining works', text: 'Bowel and bladder training programs may be ordered for a resident who is incontinent, to help improve control (Oklahoma). Virginia\'s curriculum: identify the resident\'s pattern of elimination, keep an accurate record, and set a toileting schedule.' },
        { h: 'Your role', list: ['Follow the elimination schedule exactly as the nurse instructs', 'Explain the schedule to the resident', 'Virginia\'s curriculum: toilet the resident before long procedures, before meals and before bedtime; Indiana and Virginia curricula also say about 30 minutes after the resident drinks fluids', 'Answer call lights promptly — the resident may not be able to wait', 'Provide privacy and do not rush', 'Help with perineal care and a change of clothes after an accident', 'Encourage fluids if allowed', 'Record each success and accident accurately'] },
        { h: 'Attitude', text: 'Be supportive and sensitive. Praise success and be understanding about accidents — retraining does not happen overnight. Work as a team so every shift follows the same plan.' },
      ],
      keyPoints: ['Follow the elimination schedule exactly as the nurse instructs.', 'Virginia\'s curriculum: offer the toilet before long procedures and before meals; Indiana and Virginia say about 30 minutes after fluids.', 'Record successes and accidents accurately, and be patient and positive — retraining takes time.'] },
    { id: 'personal-care-5', unit: 'u6', topic: 'personal-care', title: 'Making beds (occupied & unoccupied)', minutes: 20,
      summary: 'Oklahoma tests bedmaking. A clean, smooth bed protects the skin, prevents infection, and helps the resident rest.',
      sections: [
        { h: 'Kinds of beds', list: ['Unoccupied bed — made while no one is in it', 'Occupied bed — made while the resident stays in bed (for a resident who cannot get up)', 'Closed bed — completely made with spread and blankets in place, for a resident who is up for the day', 'Open bed — top linens folded down so the resident can get back in easily'] },
        { h: 'Infection control', list: ['Carry clean linen away from your uniform and place it on a clean surface', 'Never put clean or dirty linen on the floor', 'Work from the cleanest area (head of the bed) to the dirtiest (foot of the bed)', 'Roll soiled linen with the dirty side inward and put it straight into the laundry bag or hamper'] },
        { h: 'Good technique', list: ['Finish one side of the bed before moving to the other — it is quicker and saves your back', 'Raise the bed to a safe working height; lower it when you finish', 'For an occupied bed: close the curtain and door, keep the resident covered the whole time, and keep them safe while turned on their side', 'Leave the bottom sheet smooth and free of wrinkles — wrinkles can cause skin breakdown'] },
      ],
      keyPoints: ['Unoccupied bed = no one in it; occupied bed = resident stays in bed; closed bed for a resident up all day; open bed folded down for return.', 'Work from the clean head of the bed to the dirty foot, roll soiled linen inward, and never put linen on the floor.', 'Make one side at a time, keep the resident covered, and leave the bottom sheet wrinkle-free.'] },
    { id: 'personal-care-6', unit: 'u6', topic: 'personal-care', title: 'Compression (elastic) stockings', minutes: 15,
      summary: 'Applying compression support stockings is on Oklahoma\'s official skills list. They help circulation in the legs.',
      sections: [
        { h: 'Why they are used', text: 'Compression stockings (sometimes called TED hose or elastic stockings) help blood circulate in the lower legs. The Indiana and Virginia official nurse-aide curricula also say they lower the risk of blood clots. They are used only when ordered — follow the care plan.' },
        { h: 'When and how to put on compression stockings (Indiana and Virginia official curricula)', list: ['Check the care plan for when the stockings go on and come off', 'Look at the skin first; report redness, warmth, swelling, very dry skin, open areas or pain to the nurse', 'Apply them before the resident gets out of bed, while the legs are elevated', 'Turn the stocking inside out to the heel, slip it over the foot, and gently pull it up the leg', 'Make sure there are no wrinkles or twists and that the heel is in place', 'Report complaints of pain, numbness or discomfort'] },
        { h: 'About the sources', text: 'Oklahoma\'s study guide confirms this is a tested skill, but the Oklahoma documents reviewed do not list the steps. The steps above come from two other states\' official curricula. Follow your Oklahoma instructor.' },
      ],
      keyPoints: ['Applying compression stockings is on Oklahoma\'s skills list — follow the care plan for when they go on and come off.', 'Check the skin first and report redness, warmth, swelling, open areas or pain.', 'Apply before the resident gets out of bed, with no wrinkles or twists.'] },

    // ---------- Unit 7: Vitals ----------
    { id: 'vitals-1', unit: 'u7', topic: 'vitals', title: 'Temperature, pulse & respirations', minutes: 25,
      summary: 'Accurate vital signs help the nurse catch problems early.',
      sections: [
        { h: 'Typical adult ranges (general guide)', list: ['Temperature — Oklahoma\'s normal ranges: oral 97.6–99.6 °F, axillary (armpit) 96.6–98.6 °F, aural (ear) 98.6–100.6 °F. Average body temperature is 98.6 °F (37 °C); MedlinePlus lists a normal range of 97.7–99.1 °F', 'Pulse: 60–100 beats per minute', 'Respirations: about 12–20 breaths per minute (some official sources list 12–16 or 12–18)', 'Your facility and nurse decide what is "abnormal" for each resident — always report readings outside the range or a big change'] },
        { h: 'Temperature sites', list: ['Oral — Oklahoma\'s course standards say wait 15 minutes after the resident smokes or drinks; follow facility policy after eating', 'Tympanic (ear), temporal (forehead), axillary (armpit — usually lowest), rectal (usually highest)', 'Never take an oral temperature on a resident who is unconscious or has seizures (Oklahoma). Many facilities also avoid it for a confused resident or one on oxygen by mask (facility policy)'] },
        { h: 'Radial pulse', text: 'Place the tips of your first three fingers (Oklahoma) — not your thumb, which has its own pulse — on the thumb side of the inner wrist. Count for a full 60 seconds for the most accurate result. Note the rate, rhythm (regular/irregular) and strength.' },
        { h: 'Respirations', text: 'Count one rise and fall of the chest as one breath, for a full 60 seconds. People change their breathing if they know you are watching, so many aides keep their fingers on the wrist after counting the pulse and count respirations without announcing it.' },
      ],
      keyPoints: ['Normal adult pulse: 60–100 beats per minute.', 'Normal adult breathing: about 12–20 breaths per minute.', 'Count pulse and respirations for one full minute.', 'Take a radial pulse with your fingertips on the thumb side of the wrist — never with your thumb.'] },

    { id: 'vitals-2', unit: 'u7', topic: 'vitals', title: 'Blood pressure, pain, height & weight', minutes: 25,
      summary: 'Blood pressure and other measurements.',
      sections: [
        { h: 'Blood pressure', text: 'Blood pressure has two numbers: systolic (top, pressure when the heart beats) over diastolic (bottom, pressure when the heart rests). According to the National Heart, Lung, and Blood Institute (NIH), a normal adult reading is less than 120 systolic AND less than 80 diastolic. Report readings your facility lists as abnormal.' },
        { h: 'Manual blood pressure basics', list: ['Use the correct cuff size; wrap it around the bare upper unaffected arm about 1–2 inches above the elbow (Oklahoma)', 'Virginia\'s curriculum also says do not take BP on an arm with an IV, a dialysis shunt, a cast, or paralysis, or on the side of a mastectomy', 'Resident seated or lying, arm supported at heart level', 'Find the brachial pulse at the inner elbow; place the stethoscope there', 'Inflate per your training method (Oklahoma: to 160 mmHg if the resident\'s usual blood pressure is unknown), then open the valve slowly (Oklahoma)', 'First clear sound = systolic; when the sound disappears = diastolic', 'Wipe the earpieces and diaphragm before and after use'] },
        { h: 'Pain', text: 'A common nursing saying is "pain is whatever the person says it is" — take the resident\'s report seriously. Ask about location, how bad it is (many facilities use a 0–10 scale), and what it feels like. Oklahoma: watch facial expression and response if a resident is unable to say they are in pain. Report the resident\'s report of pain to the nurse (Oklahoma).' },
        { h: 'Weight', text: 'Oklahoma: weigh at least monthly (or as the care plan says), schedule daily weights at the same time each day, have the resident wear the same type of clothing, have the resident empty the bladder first, and follow the scale maker\'s guidelines. Use the same scale and balance/zero it first. Report sudden gains or losses.' },
      ],
      keyPoints: ['Oklahoma: take BP on the unaffected arm. Virginia adds: not on an arm with an IV, dialysis shunt, cast or paralysis, or on the side of a mastectomy.', 'Daily weights: same time each day, similar clothing.', 'Report a resident\'s pain to the nurse, and watch the face of a resident who cannot say they hurt (Oklahoma).'] },

    // ---------- Unit 8: Nutrition ----------
    { id: 'nutrition-1', unit: 'u8', topic: 'nutrition', title: 'Nutrition, diets & feeding', minutes: 20,
      summary: 'Helping residents eat safely and well.',
      sections: [
        { h: 'Special diets', list: ['Low-sodium — limits salt to prevent or reduce swelling (edema) (Oklahoma). Virginia\'s curriculum adds that it is ordered for high blood pressure', 'Diabetic/consistent carbohydrate — diabetes', 'Mechanical soft, pureed — chewing or swallowing problems', 'Thickened liquids — for swallowing problems (dysphagia). Use the thickness the care plan orders', 'NPO — "nothing by mouth"; give no food or fluids at all'] },
        { h: 'Feeding a resident', list: ['Check the meal tray against the diet card and the resident\'s name', 'Resident in a comfortable sitting position for meals (Oklahoma). Oklahoma\'s course standards say Fowler\'s position (head raised 45–60 degrees) is comfortable for eating. Follow the care plan', 'Sit at eye level; hand hygiene for you and the resident', 'Feed slowly in small bites — Oklahoma\'s feeding procedure says fill the spoon half full and direct the food to the unaffected (strong) side of the mouth; let them chew and swallow before the next', 'Offer fluids between bites; tell visually impaired residents what is on the plate', 'Virginia\'s curriculum: keep the resident upright about 30 minutes after the meal. Follow the care plan', 'Record how much was eaten the way your facility does it (Oklahoma: "according to current nursing practices"; Virginia\'s curriculum uses a percentage), and report poor appetite'] },
        { h: 'Signs of swallowing trouble — report', list: ['Coughing or choking during meals', 'Resident says food will not go down (Oklahoma)', 'Pocketing food in the cheeks', 'Excessive drooling, or complains of heartburn (Oklahoma)'] },
      ],
      keyPoints: ['Residents sit up for meals in a comfortable sitting position (Oklahoma) — follow the care plan.', 'NPO means nothing by mouth.', 'Report coughing or choking while eating.'] },

    { id: 'nutrition-2', unit: 'u8', topic: 'nutrition', title: 'Hydration & intake/output', minutes: 20,
      summary: 'Older adults may not feel thirsty — offer fluids often.',
      sections: [
        { h: 'Dehydration', text: 'Older adults may not feel thirst. Oklahoma lists dry mouth, searching and smacking lips as signs a resident is thirsty. MedlinePlus adds these signs of dehydration: urinating less than usual, dark-colored urine, feeling tired and dizziness. Offer fluids often (unless restricted) and keep fresh water within reach.' },
        { h: 'Fluid restriction & forcing fluids', text: 'Some residents have orders to limit fluids (e.g. heart or kidney failure); others to encourage extra fluids. Follow the care plan exactly.' },
        { h: 'Measuring intake & output (I&O)', list: ['Fluids are measured in milliliters (mL); 1 ounce = 30 mL', 'Intake: liquids taken with meals and between meals, and foods Oklahoma counts as liquid (gelatin, soup, ice cream)', 'Output: urine and vomit (emesis) (Oklahoma); your facility may also count liquid stool and drainage', 'Measure output in a graduate (graduated measuring container) (Oklahoma). Virginia\'s curriculum adds: set the graduate on a counter top and read it at eye level', 'Record right away so nothing is forgotten'] },
      ],
      keyPoints: ['1 fluid ounce = 30 mL.', 'Ice cream, gelatin and soup count as fluid intake.', 'Measure output in a graduate (Oklahoma); Virginia\'s curriculum says set it on a counter top and read it at eye level.'] },

    // ---------- Unit 9: Mobility ----------
    { id: 'mobility-1', unit: 'u9', topic: 'mobility', title: 'Positioning & range of motion', minutes: 20,
      summary: 'Changing position and moving joints prevents complications.',
      sections: [
        { h: 'Common positions', list: ['Fowler\'s — head raised 45–60°; semi-Fowler\'s — head raised 30–45° (Oklahoma). Virginia\'s curriculum also lists high Fowler\'s at 60–90°', 'Supine — flat on the back', 'Lateral — on the side, supported with pillows', 'Prone — on the stomach (Virginia\'s curriculum; not in Oklahoma\'s list)', 'Sims\' — side-lying, almost prone (Virginia\'s curriculum; not in Oklahoma\'s list)'] },
        { h: 'Complications of immobility', list: ['Pressure sores (Oklahoma)', 'Contractures (joints stiffen and shorten) and other musculoskeletal deformities (Oklahoma)', 'Respiratory complications and decreased circulation (Oklahoma); Virginia names pneumonia and blood clots', 'Virginia\'s curriculum also lists depression and brittle bones'] },
        { h: 'Range of motion (ROM)', text: 'Passive ROM exercises move each joint gently through its normal motion. Support the limb above and below the joint, move slowly and smoothly, repeat as the care plan says, and stop if there is pain — then report it. Never force a joint.' },
      ],
      keyPoints: ['Reposition at least every 2 hours (or as the care plan says).', 'Stop range of motion if the resident has pain, and tell the nurse.'] },

    { id: 'mobility-2', unit: 'u9', topic: 'mobility', title: 'Transfers, gait belts & walking', minutes: 25,
      summary: 'Safe transfers protect both the resident and you.',
      sections: [
        { h: 'Gait (transfer) belt', text: 'A gait belt goes around the resident\'s waist over clothing. It should be snug but not tight — check the fit the way your Oklahoma instructor teaches. Oklahoma\'s skills test checks that you grasp the belt correctly. Ask the nurse before using a belt on a resident with a recent abdominal surgery or a medical device (general nursing practice — follow facility policy).' },
        { h: 'Bed to wheelchair (pivot) transfer', list: ['Place the wheelchair on the resident\'s stronger (unaffected) side, braced firmly against the side of the bed, and lock the brakes; move footrests out of the way', 'Bed in low position, wheels locked', 'Help the resident sit on the edge of the bed with feet flat on the floor, non-skid shoes on', 'Apply the gait belt; stand in front of the resident and block the resident\'s feet with your feet (Oklahoma)', 'On a count, help them stand, pivot together, and lower into the chair', 'Position them comfortably, footrests down, call light in reach'] },
        { h: 'Walking (ambulation)', text: 'Stand to the side and slightly behind the resident and walk at the resident\'s pace (Oklahoma\'s walking procedure). When the resident uses a cane, stand on the resident\'s affected (weak) side (Oklahoma). Watch for dizziness. If they become weak, ease them down safely and call for help.' },
        { h: 'Mechanical lifts', text: 'Use a mechanical lift only if you are trained. Always have at least one co-worker help, and follow the manufacturer\'s guidelines (Oklahoma). Virginia\'s curriculum says at least 2 nurse aides should be present.' },
      ],
      keyPoints: ['Lock the wheelchair and bed wheels before a transfer.', 'Place the wheelchair on the resident\'s stronger (unaffected) side.', 'When walking a resident, stand to the side and slightly behind; with a cane, stand on the affected (weak) side.'] },

    // ---------- Unit 10: Dementia ----------
    { id: 'dementia-1', unit: 'u10', topic: 'dementia', title: 'Understanding dementia', minutes: 20,
      summary: 'Dementia is a progressive loss of memory and thinking ability.',
      sections: [
        { h: 'What dementia is', text: 'Oklahoma\'s course standards define dementia as progressive mental deterioration due to brain disease; Alzheimer\'s disease is the most common. The National Institute on Aging (NIA) says dementia is not a normal part of aging. Symptoms include memory loss, confusion, and trouble with judgment and language. Other types include vascular dementia (NIA). It usually gets worse over time.' },
        { h: 'Delirium is different', text: 'Oklahoma\'s course standards don\'t use the word "delirium"; they say report any sudden change in condition, including confusion, to the nurse right away. General health information: delirium is sudden confusion, often caused by infection, dehydration, medications or illness. It can often be treated. Any sudden change in thinking or behavior must be reported to the nurse right away.' },
        { h: 'Common behaviors', list: ['Repeating questions', 'Wandering and pacing', 'Sundowning — more confusion and agitation in late afternoon and evening', 'Agitation, catastrophic reactions (overreacting to small things)', 'Suspicion, hallucinations'] },
      ],
      keyPoints: ['Dementia is a progressive loss of memory, judgment and other abilities caused by brain disease (Oklahoma) — the National Institute on Aging says it is not a normal part of aging.', 'Sudden confusion or any sudden change in condition must be reported to the nurse right away.'] },

    { id: 'dementia-2', unit: 'u10', topic: 'dementia', title: 'Dementia care techniques', minutes: 20,
      summary: 'Calm, simple, person-centered care.',
      sections: [
        { h: 'Helpful approaches — how to talk with and care for a resident who has dementia', list: ['Approach from the front, calmly; say your name and theirs', 'One-step instructions, simple words, one question at a time', 'Keep a consistent routine and calm environment', 'Do not argue. Distract and redirect (Oklahoma). Use reality orientation, validation or reminiscing only when the nurse tells you to (Oklahoma)', 'Break tasks into small steps; let them do what they can', 'Look for the cause of behavior: pain, hunger, toileting needs, noise, fear'] },
        { h: 'Wandering', text: 'Make sure the resident is safe, walk with them, offer a safe place to walk, and redirect with an activity. Follow facility alarm and safety policies. Never lock a resident in a room (that is involuntary seclusion).' },
        { h: 'Validation example — when a confused resident wants to go home or asks for a loved one (mother, children)', text: 'If a resident says "I need to go home to feed my children," arguing ("Your children are grown") can cause distress. Instead acknowledge the feeling ("You really love your children. Tell me about them.") and gently redirect. Oklahoma: use validation only when the nurse instructs it.' },
      ],
      keyPoints: ['Never argue — stay calm, reassure, and redirect.', 'Difficult behavior can come from too much stimulation, a change in routine, pain or discomfort, medicines, or tiredness.'] },
    { id: 'dementia-5', unit: 'u10', topic: 'dementia', title: 'Stages of Alzheimer\'s disease', minutes: 15,
      summary: 'Oklahoma\'s exam asks you to know the characteristics of each stage of dementia. Oklahoma\'s course standards describe Alzheimer\'s in three phases; Virginia calls them early (mild), middle (moderate) and late (severe).',
      sections: [
        { h: 'Early stage (mild) — Oklahoma "Phase One"', list: ['Forgets things, especially recent events (short-term memory loss)', 'Avoids unfamiliar situations and looks for the familiar', 'Mood swings or moodiness; Virginia adds: may lose interest in work and hobbies', 'Virginia adds: unable to concentrate, poor judgment'] },
        { h: 'Middle stage (moderate) — Oklahoma "Phase Two"', list: ['Restless, especially in the evening (sundowning); Virginia adds: may wander or pace', 'Does not recognize dangerous situations', 'Needs help with activities of daily living (ADLs)', 'Speaks in one- or two-word answers and repeats; Virginia adds: difficulty finding the right words', 'More agitation'] },
        { h: 'Late stage (severe) — Oklahoma "Phase Three"', list: ['Does not recognize family, staff or even themselves', 'Depends on others for all ADLs', 'Incontinent', 'Unable to walk; Virginia adds: confined to bed', 'Virginia adds: difficulty swallowing and eating'] },
        { h: 'Good to know', list: ['Indiana\'s official curriculum uses a 7-stage scale; its stages are also grouped as early, mid and late stage.', 'Oklahoma\'s course standards note that death usually results from complications such as infection, aspiration (breathing food or liquid into the lungs) or heart failure.', 'At every stage, let the resident do as much as they can for themselves — Oklahoma tests "promoting independence with ADLs" for residents with dementia.'] },
      ],
      keyPoints: ['Oklahoma describes Alzheimer\'s in three phases; Virginia calls them early (mild), middle (moderate) and late (severe).', 'Early stage: forgets recent events, is moody, and avoids unfamiliar situations.', 'Middle stage: restless in the evening (sundowning) and needs help with ADLs; Virginia adds that the resident may wander.', 'Late stage: does not recognize family, depends on others for all care, is incontinent and cannot walk.'] },
    { id: 'dementia-6', unit: 'u10', topic: 'dementia', title: 'Psychosocial, spiritual & cultural needs', minutes: 15,
      summary: 'Oklahoma\'s exam (Duty J) asks you to tell apart emotional, mental health, spiritual and cultural needs, and to respond to them. From Oklahoma\'s course standards and study guide, checked against Virginia and Indiana.',
      sections: [
        { h: 'What psychosocial needs are', text: 'Oklahoma\'s course standards define psychosocial needs as the "need for independence, a supportive environment, recognition as an individual, spiritual fulfillment, and social interaction." They go beyond the body\'s physical needs (food, water, rest, safety).' },
        { h: 'The four types Oklahoma tests', list: ['Emotional — feeling loved, accepted, secure and respected; keeping self-esteem', 'Mental health — coping with fear, loss, anger or sadness; report signs of depression or changes in behavior to the nurse', 'Spiritual — the search for meaning in life, usually through religion: prayer, services, clergy visits, holy days', 'Cultural — the values, beliefs and customs passed down in a group, including language, food, modesty and personal space'] },
        { h: 'Why these needs can go unmet', list: ['Losses: health, a spouse, friends, a home, a car, independence', 'Moving into a nursing home: fear, uncertainty and less control over daily life', 'A rushed caregiver who has no time to talk'] },
        { h: 'How you respond', list: ['Talk with residents while you help them bathe, eat, dress or exercise — and really listen', 'Show empathy if a resident is angry or sad after a loss', 'Let residents do what they can and make their own choices; encourage personal belongings', 'Respect religious practices and encourage residents to continue them; respect food restrictions and fasting', 'Do not judge beliefs, values or habits that are different from yours', 'Use available interpreter services per facility policy when there is a language barrier (Virginia\'s curriculum)', 'Tell the nurse when a resident asks for clergy or a spiritual counselor (Oklahoma\'s team includes one), or seems depressed'] },
      ],
      keyPoints: ['Psychosocial needs include independence, a supportive environment, being recognized as an individual, spiritual fulfillment and social interaction.', 'Culture is the values, beliefs and customs passed down in a group — respect cultural differences and never judge them.', 'Respect each resident\'s spiritual beliefs: encourage religious practices and honor food restrictions.', 'Meet emotional needs by talking with residents, really listening, showing empathy, and letting them do what they can.'] },

    { id: 'dementia-3', unit: 'u10', topic: 'dementia', title: 'Mental health & end-of-life care', minutes: 20,
      summary: 'Emotional needs, depression, and comfort at the end of life.',
      sections: [
        { h: 'Depression, anxiety & suicide or self-harm warning signs', text: 'Watch for sadness and withdrawal (Oklahoma\'s description of depression), a drop in appetite (Virginia\'s curriculum says depression may decrease appetite), or statements about not wanting to live. Report these to the nurse immediately — especially any talk of self-harm.' },
        { h: 'Comfort care at the end of life', list: ['Keep the person clean, dry and comfortable; reposition gently', 'Mouth care often — lips and mouth can become very dry', 'Oklahoma\'s course standards say hearing is believed to be the last sense to be lost — keep talking kindly even if the resident does not respond, identify yourself, and explain everything you are doing', 'Respect cultural and religious wishes', 'Support the family, give privacy', 'Report changes in breathing, skin color or responsiveness to the nurse'] },
        { h: 'Advance directives', text: 'Oklahoma\'s course standards call a living will an advance directive: it gives the resident\'s choices about life-sustaining care. Because of the resident\'s choice, the doctor may write a "Do Not Resuscitate" (DNR) order. Ask the nurse if you are unsure, and know where to find your facility\'s policies.' },
        { h: 'Grief and the five stages', list: ['Oklahoma\'s course standards teach that a dying resident and the family may pass through five stages of grief (Dr. Elisabeth Kübler-Ross):', 'Denial — refusing to accept the diagnosis or talk about it', 'Anger — rage and resentment; may lash out at anyone, even over small things', 'Bargaining — trying to arrange more time, bargaining with doctors or God', 'Depression — mourning; crying and withdrawing', 'Acceptance — has worked through the feelings and understands that death is near', 'Each person moves through the stages at a different rate or time, and not everyone goes through all of them — never judge, rush or put a timeline on someone\'s grief'] },
      ],
      keyPoints: ['Report any talk of suicide or self-harm to the nurse immediately.', 'Near the end of life, keep lips moist and give gentle mouth care often.', 'Grief has five stages (denial, anger, bargaining, depression, acceptance), but each person moves through them at their own pace and not always through all of them — never judge or rush grief.'] },
    { id: 'dementia-4', unit: 'u10', topic: 'dementia', title: 'Postmortem care', minutes: 15,
      summary: 'Care of the body after death is done with respect for the resident and the family, following facility policy.',
      sections: [
        { h: 'Before you begin', list: ['Follow facility procedures — the nurse directs postmortem care', 'Respect the family\'s religious or cultural wishes for care of the body', 'Provide privacy; help a roommate leave the area until the body is prepared and removed', 'Wear gloves'] },
        { h: 'Caring for and positioning the body (postmortem care)', list: ['Place the body on its back (supine) with one pillow under the head so blood does not settle in and discolor the face', 'Gently close the eyes (Virginia\'s curriculum)', 'Put the dentures in (Oklahoma course standards)', 'Remove tubes or dressings only if the nurse instructs', 'Wash the body as needed and comb the hair', 'Place a pad under the buttocks — urine or stool may drain after death', 'Put on a clean gown and place the body in good alignment for the family to view'] },
        { h: 'Afterward', list: ['Give the family privacy and time to grieve', 'Follow facility policy for personal belongings (Virginia\'s curriculum: have a witness when items are given to a family member)', 'Document according to facility policy', 'After the body is removed, strip the bed and clean the room per policy'] },
      ],
      keyPoints: ['Respect the family\'s religious and cultural wishes for care of the body.', 'Place the body on its back with one pillow under the head to prevent facial discoloration.', 'Give privacy and time to the family, and follow facility policy for belongings and documentation.'] },

    // ---------- Unit 11: Documentation ----------
    { id: 'documentation-1', unit: 'u11', topic: 'documentation', title: 'Observing & reporting', minutes: 15,
      summary: 'Use all your senses to notice changes, and report facts.',
      sections: [
        { h: 'Objective vs. subjective', text: 'Objective information is what you can see, hear, feel, smell or measure ("Resident ate 25% of lunch," "skin on left heel is red"). Subjective information is what the resident tells you that you cannot measure ("I feel dizzy"). Record subjective statements in the resident\'s own words, in quotation marks.' },
        { h: 'Changes to report to the nurse right away', list: ['Falls or injuries', 'Chest pain, trouble breathing, sudden confusion, signs of stroke', 'Big changes in vital signs', 'Bleeding, vomiting, severe pain', 'Suspected abuse', 'Also tell the nurse when a resident refuses care or a meal — respect the refusal: Oklahoma says residents have "the right to refuse treatment"'] },
      ],
      keyPoints: ['Objective = what you see or measure; subjective = what the resident tells you.', 'Write facts, not opinions.'] },

    { id: 'documentation-2', unit: 'u11', topic: 'documentation', title: 'Charting rules', minutes: 15,
      summary: 'The medical record is a legal document.',
      sections: [
        { h: 'Charting rules', list: ['Document only care you gave yourself — never for someone else', 'Document after the care is done, never before', 'Be accurate, brief, and factual; use approved abbreviations only', 'Paper charts: use ink, never white-out; draw one line through an error, write "error" (or as policy says), your initials and the date', 'Electronic records: never share your password (HIPAA / facility policy)', 'Oklahoma\'s course standards: "If it isn\'t documented, legally it wasn\'t done."'] },
        { h: 'Confidentiality (HIPAA)', text: 'Share resident information only with people who need it for care. Do not leave charts open or screens unlocked (HIPAA / facility policy). Oklahoma\'s course standards say never discuss a resident\'s personal or medical information with friends or news media — so never post about residents online. Tip: even without names, details in a post can identify a resident.' },
      ],
      keyPoints: ['Never document before the care is done.', 'Correct errors with a single line, your initials and the date — never erase or use white-out.', 'Your charting is a legal record: if you don\'t document it, legally it didn\'t happen — and never document for someone else.'] },

    // ---------- Unit 12: Exam ----------
    { id: 'skills-1', unit: 'u12', topic: 'skills', title: 'How the CNA exam works', minutes: 15,
      summary: 'The Oklahoma nurse aide exam has two parts: a clinical skills test, then a written (or oral) test.',
      sections: [
        { h: 'Two parts', text: 'Under federal rules, nurse aides who work in nursing homes must complete a state-approved training program and pass a state competency evaluation. In Oklahoma the exam is given at CareerTech (HCP) test sites: first a hands-on clinical skills test in front of an evaluator, then a written test (you may ask for it to be read aloud). See the lesson "Oklahoma test day" and the Oklahoma CNA Requirements screen for the details.' },
        { h: 'Opening and closing steps evaluators watch for in nearly every skill on the test', list: ['Knock, introduce yourself, identify the resident', 'Explain the procedure', 'Hand hygiene', 'Provide privacy', 'Safety: bed height and wheels locked, call light in reach at the end', 'Communicate with the resident throughout', 'Hand hygiene at the end; report and record'] },
        { h: 'Critical steps', text: 'Some steps are "critical tasks" (for example, hand washing or using the wheelchair wheel locks). On Oklahoma\'s clinical skills test, if any critical task is marked "No" — or your vital signs are outside the allowed margin (temperature must match, pulse within 4 beats, respirations within 2 breaths, both blood pressure numbers within 4 mmHg) — the evaluator enters a score of 0, so you fail the whole clinical skills test. Oklahoma\'s official CareerTech testing manuals list them. Practice those until they are automatic.' },
      ],
      keyPoints: ['The exam has a written (or oral) test and a skills test.', 'Opening steps (knock, introduce yourself, identify the resident, explain, privacy) are part of nearly every skill.', 'Read Oklahoma\'s official CareerTech Certified Nurse Aide study guide.'] },

    { id: 'skills-2', unit: 'u12', topic: 'skills', title: 'Study & test-taking strategies', minutes: 15,
      summary: 'Work smarter with the time you have.',
      sections: [
        { h: 'Test-taking tips', list: ['Read the whole question and every answer before choosing', 'Look for key words: first, best, most important, never, always', 'When in doubt, choose the answer that keeps the resident SAFE, respects their RIGHTS, or tells the NURSE', 'The CNA does not diagnose, give medications, or change orders', 'Do not overthink — pick what the textbook-ideal nurse aide would do'] },
        { h: 'Studying around a work schedule', list: ['Short sessions (10–15 minutes) add up — use them on busy days', 'Practice skills out loud at home with a family member as the "resident"', 'Review missed questions often — they show your weak spots', 'Rest matters, especially after night shifts'] },
      ],
      keyPoints: ['Study tip: when unsure on a question, choose the answer that keeps the resident safe, respects their rights, and involves the nurse.', 'Study tip: short sessions add up.'] },
    { id: 'skills-3', unit: 'u12', topic: 'skills', title: 'Oklahoma test day: what to expect', minutes: 15,
      summary: 'What happens at an Oklahoma CareerTech (HCP) test site, straight from the official Oklahoma testing documents.',
      sections: [
        { h: 'Before you go', list: ['You must finish an Oklahoma-approved training program first', 'Contact an HCP test site to register and pay; each site sets its own fee', 'Bring ORIGINALS (photocopies are not accepted): your HCP Training Verification Form, an unexpired driver\'s license or other current U.S. government photo ID, and proof of your Social Security number (card or Social Security letter, or an ITIN)', 'You will also complete an Affidavit of Lawful Presence'] },
        { h: 'Part 1: the Oklahoma CNA exam clinical skills test (7 skills in 60 minutes)', list: ['Long term care candidates perform 7 skills within 60 minutes, built into a realistic scenario', 'Every scenario includes walking with a transfer belt, a bed-to-wheelchair (or wheelchair-to-bed) transfer, range of motion, and vital signs including blood pressure', 'The other 3 skills come from the official Nurse Aide Skills List', 'You must do every critical task correctly and at least 80% of the other steps', 'The order of steps does not matter as long as the resident, you and the evaluator stay safe'] },
        { h: 'Critical tasks & vital sign accuracy on the Oklahoma skills test', list: ['Hand washing at the right times, done correctly', 'Putting on and removing gloves and other PPE correctly', 'Handling soiled linen and biohazard materials correctly; cleaning equipment', 'Using thermometer sheaths and other barriers', 'Checking the resident\'s identity', 'Raising and lowering the bed at the right times', 'Using the transfer belt correctly', 'Placing the call light within reach', 'Checking water temperature', 'Positioning the wheelchair and using the wheel locks and footrests', 'Preventing slips, trips and falls (for example bed linens and footwear)', 'Vital signs close to the evaluator\'s: temperature must match, pulse within 4 beats, respirations within 2 breaths, blood pressure within 4 mmHg'] },
        { h: 'Part 2: the written test', list: ['Taken after you pass the skills test', '70 questions in 2 hours (one official manual says 75 questions — ask your test site)', 'You need 70% or higher to pass', 'You may ask for the test to be read aloud (oral) when you register', 'If time runs out, unanswered questions are marked wrong'] },
      ],
      keyPoints: ['Skills test first: 7 skills in 60 minutes, always including walking with a transfer belt, a bed-to-wheelchair transfer, range of motion, and vital signs with blood pressure.', 'To pass the skills test, do every critical task correctly and at least 80% of the other steps.', 'Your vital signs must be close to the evaluator\'s: temperature must match, pulse within 4 beats, respirations within 2, blood pressure within 4 mmHg.', 'Bring originals: Training Verification Form, unexpired government photo ID, and proof of your Social Security number — photocopies are not accepted.'] },
  ];

  // Teaching order (Oklahoma Course Standards topic order). Each lesson's unit is set here so the list above is the one
  // place that decides order; the `unit` written inside each lesson is overwritten. Progress is saved by lesson id, so
  // reordering never loses completed lessons.
  const ORDER = [
    ['u1', 'role-1', 'role-2'],
    ['u11', 'documentation-1', 'documentation-2'],
    ['u5', 'communication-1', 'communication-2'],
    ['u3', 'infection-1', 'infection-2', 'infection-3', 'infection-4'],
    ['u4', 'safety-3', 'safety-1', 'safety-4', 'safety-2'],
    ['u2', 'rights-1', 'rights-2', 'rights-3'],
    ['u13', 'anatomy-1', 'role-3', 'dementia-1', 'dementia-2', 'dementia-6'],
    ['u14', 'personal-care-5', 'mobility-1'],
    ['u7', 'vitals-1', 'vitals-2'],
    ['u6', 'personal-care-1', 'personal-care-2', 'personal-care-6'],
    ['u9', 'mobility-2'],
    ['u8', 'nutrition-1', 'nutrition-2'],
    ['u15', 'personal-care-3', 'personal-care-4'],
    ['u10', 'dementia-3', 'dementia-4', 'dementia-5'],
    ['u12', 'skills-1', 'skills-2', 'skills-3'],
  ];
  const pos = {};
  ORDER.forEach(([unit, ...ids]) => ids.forEach((id) => { pos[id] = Object.keys(pos).length; const l = lessons.find((x) => x.id === id); if (l) l.unit = unit; }));
  lessons.sort((a, b) => (pos[a.id] === undefined ? 999 : pos[a.id]) - (pos[b.id] === undefined ? 999 : pos[b.id]));

  const api = { units, lessons };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.CNA = root.CNA || {}; root.CNA.curriculum = api; }
})(typeof self !== 'undefined' ? self : this);
