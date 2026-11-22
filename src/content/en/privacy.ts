// The policy and the consent in English, laid over src/content/privacy.ts in the English build. A translation
// for the guest's convenience: the Russian text is the one that applies (t.privacy.lead and t.consent.lead
// say so on the page). Same clause ids, same {tokens}; change it whenever the Russian text changes.

const SITE = "www.kakdelacoffee.ru";

const NOTE_DATA = [
  "the text of the note and anything you tell us in it;",
  "the note’s topic (“All peachy”, “An idea”, “So-so”, “A question”) and the café, if you ticked them;",
  "your signature, if you left one;",
  "a phone number or email address for the reply, if you left one;",
  "the date and time it was sent, the note’s number and the mark of consent.",
];

const NOTE_DATA_MINE = [
  "the text of my note and anything I tell you in it;",
  "the note’s topic and the café, if I tick them;",
  "my signature, if I leave one;",
  "a phone number or email address for the reply, if I leave one;",
  "the date and time it was sent, the note’s number and the mark of consent.",
];

const ACTIONS =
  "Processing is automated, with transfer over the Internet. The following is done with the data: collection, recording, systematization, accumulation, storage, clarification, retrieval, use, transfer (granting access) to the operator’s employees, blocking, deletion, destruction.";

const deviceStorage = [
  { key: "kd-city", store: "localStorage", what: "The city you chose.", kept: "Until you clear the site’s data." },
  { key: "kd-last", store: "localStorage", what: "The answer you tore off on the home page, and the date.", kept: "Until you clear the site’s data." },
  { key: "kd-puzzle", store: "localStorage", what: "Your solution to the chess puzzle of the week.", kept: "Until you clear the site’s data; last week’s solution is not shown." },
  { key: "kd-runner", store: "localStorage", what: "Your best score in the cup game.", kept: "Until you clear the site’s data." },
  { key: "kd-sound", store: "localStorage", what: "That you turned off the New Year music: it won’t start by itself next time.", kept: "Until you clear the site’s data or turn the music back on." },
  { key: "kd-intro", store: "sessionStorage", what: "That the welcome animation has been shown: it runs shorter in this tab after that.", kept: "While the tab is open." },
  { key: "kd-scroll", store: "sessionStorage", what: "How far down the page you were when you left it: if not at the very top, the animation is skipped after a reload.", kept: "While the tab is open." },
];

export const privacyEn = {
  blankCaption: {
    name: "operator’s full name",
    inn: "INN (taxpayer number)",
    ogrn: "OGRN (state registration number)",
    address: "operator’s address",
    email: "email address",
    responsible: "person responsible for processing",
    hosting: "hosting provider, address",
    mail: "mail service, address",
    registry: "number in the register of operators",
  },
  deviceStorage,
  brief: [
    "There are no counters, ad pixels or cookies on the site.",
    "Your city, your answer to “How are you?”, your best score, your solved puzzle and whether you turned the music off are kept only in your browser.",
    "Your browser works out where you are only when you press “Which one is nearest?”. That stays on your device.",
    "Only the text of a note is required. A signature and a contact are needed if you want a reply, and never for advertising.",
    "Notes are kept in Russia for no longer than a year, are never published and never go abroad.",
    "To find out what is kept about you, or to correct or delete it: write to {email}.",
  ],
  policy: {
    obshchee: {
      title: "General provisions",
      body: [
        `This policy sets out how {name} (the “operator”, “we”) processes the personal data of visitors to ${SITE} and how it protects them. It is issued under part 2 of article 18.1 of Federal Law No. 152-FZ of 27 July 2006 “On Personal Data” (the “Law”).`,
        "The policy covers all personal data the operator receives through the site, including through the “Feedback” form. The data of employees, job applicants and other people outside the site is governed by the operator’s other documents.",
        "Terms have the meanings given in article 3 of the Law. Personal data: any information relating directly or indirectly to an identified or identifiable person. Processing: any action with it, from collection to destruction.",
        `The policy is publicly available at ${SITE}/privacy. Every page of the site links to it, and so does the feedback form.`,
        `The consent to personal data processing is a separate document: ${SITE}/privacy/consent.`,
      ],
    },
    operator: {
      title: "Operator",
      body: [
        "Operator: {name}, INN {inn}, OGRN {ogrn}, address: {address}.",
        "Person responsible for organizing the processing of personal data: {responsible}.",
        "Requests about personal data are accepted by email at {email} and by letter to the operator’s address.",
        "The operator’s number in the register of operators processing personal data: {registry}.",
      ],
    },
    dannye: {
      title: "What data, why and on what basis",
      body: [
        "We process personal data for one purpose: to consider a note sent through the “Feedback” form and, if you left a contact, to reply to it.",
        "For this purpose we process:",
        { list: NOTE_DATA },
        "Data subjects: visitors to the site who sent a note.",
        "Sending a note, and leaving a signature and a contact in it, is optional. A note can be sent without a contact, but then we can’t reply. If you don’t want to give consent, call the café: the phone numbers are on the site.",
        "Basis: your consent (item 1 of part 1 of article 6 of the Law). You give it separately, by ticking the consent box in the form before sending. Without consent the note is not sent.",
        "If a note mentions other people, such as a member of the café’s staff or a guest, what it says about them is used only to deal with the note, on the basis of the operator’s legitimate interest (item 7 of part 1 of article 6 of the Law), is not published and is deleted with the note. Please don’t name them in full if you can avoid it: “the barista at the till” is enough. A reply to a request about your data does not include information about other people.",
        "Please don’t write about your health, beliefs or other special categories of data (article 10 of the Law) in a note. We don’t collect them. If such information does end up in a note, for instance in a complaint about feeling unwell after a meal, we use it only to consider the complaint and protect your rights (item 6 of part 2 of article 10 of the Law), and delete it with the note.",
        "We don’t use contacts for advertising or mailings, don’t publish notes and don’t pass them on for distribution. We take no decisions with legal consequences for you based solely on automated processing.",
        "If you are under 14, ask a parent or other legal representative to send the note for you: they give the consent.",
      ],
    },
    ustrojstvo: {
      title: "What stays on your device",
      body: [
        "The site sets no cookies and uses no analytics, ad pixels or third-party scripts. Fonts and images load from our own server. Links to maps, social networks and messengers lead to other sites with their own rules; until you follow them, those sites learn nothing about you.",
        "To remember your settings, the site keeps a few values in your browser’s storage. They are not sent to our server and cannot identify you:",
        {
          table: {
            caption: "What the site keeps in your browser",
            head: ["Key", "What it is", "How long it’s kept"],
            rows: deviceStorage.map((d) => [d.key, d.what, d.kept]),
          },
        },
        "You can delete these values in your browser’s settings by clearing the site’s data.",
        "The “Which one is nearest?” button asks your browser for your location only after you press it, and only with your permission. The coordinates are used on your device to work out the distance to the cafés and are sent nowhere. If the nearest café is in another city, the site remembers that city (kd-city).",
        "Like any web server, the site’s server may record in a technical log the IP address, browser details, the page or file requested and the time of the request. The log is needed to run and protect the site (the operator’s legitimate interest, item 7 of part 1 of article 6 of the Law), is not used to identify visitors and is kept for no longer than 30 days.",
      ],
    },
    obrabotka: {
      title: "How the data is processed",
      body: [
        ACTIONS,
        "A note reaches the site’s server and is sent straight on by email to the operator’s mailbox. The site’s server does not keep notes and does not write them to logs.",
        "Notes are kept in the operator’s mailbox. The site’s server and the mail service are in the Russian Federation: the personal data of Russian citizens is recorded, stored and updated in databases on its territory (part 5 of article 18 of the Law).",
        "On the operator’s instructions the data is processed by {hosting} (hosting the site) and {mail} (the mail service). They must keep it confidential and comply with the Law (part 3 of article 6 of the Law). The operator answers to you for their actions.",
        "Personal data is not transferred across borders.",
        "Only those of the operator’s employees who need the notes to reply have access to them. Data is passed to state bodies only in cases provided for by law.",
        "If you left a phone number, we will call or text that number; if an email address, we will reply by email. We reply only from the operator’s phone and mailbox.",
      ],
    },
    sroki: {
      title: "Retention and destruction",
      body: [
        "We keep a note and the data connected with it until we have replied and finished with it, but no longer than one year from the date it was sent.",
        "The data is destroyed within 30 days once the purpose of processing is achieved, the retention period expires or you withdraw your consent (parts 4 and 5 of article 21 of the Law). If it cannot be destroyed within that time, we block it and destroy it within six months at the latest.",
        "Destruction is confirmed in the manner set by Roskomnadzor.",
        "If unlawful processing comes to light, we stop it within three working days. If it cannot be made lawful, we destroy the data within ten working days and let you know.",
      ],
    },
    prava: {
      title: "Your rights",
      body: [
        "You have the right to:",
        {
          list: [
            "receive information about the processing of your data: the basis, purposes and methods, what data is processed and for how long, and who processes it on the operator’s instructions (part 7 of article 14 of the Law);",
            "demand that data be clarified, blocked or destroyed if it is incomplete, out of date, inaccurate, unlawfully obtained or not needed for the purpose of processing;",
            "withdraw your consent at any time;",
            "demand that processing stop;",
            "appeal against the operator’s actions to Roskomnadzor or in court.",
          ],
        },
        "Requests are sent by email to {email} or by letter to the operator’s address. A request must include the number of your main identity document, its date of issue and the issuing authority, information confirming your dealings with the operator (for instance, the date and number of your note, which you see after sending it, or the contact you left), and your signature (part 3 of article 14 of the Law). An electronic request is signed with an electronic signature.",
        "To withdraw your consent, an email to {email} from the same address, or with your contact and the note’s number, is enough. Processing stops, and the data is destroyed within 30 days.",
        "We reply within 10 working days of receiving a request. The time may be extended by another 5 working days if we tell you why. We reply in the same form the request came in, unless it says otherwise.",
        "We correct inaccurate data within 7 working days after you confirm the inaccuracy. Data obtained unlawfully or not needed for the purpose of processing is destroyed within the same time. A demand to stop processing is carried out within 10 working days, which may be extended by 5.",
      ],
    },
    zashchita: {
      title: "Personal data protection requirements in place",
      body: [
        "The operator appoints a person responsible for organizing personal data processing, approves this policy and internal rules on processing, assesses the harm that could be caused to data subjects and makes its employees familiar with the requirements of the Law (article 18.1 of the Law).",
        "Legal, organizational and technical measures protect the data (article 19 of the Law):",
        {
          list: [
            "the site works only over the secure HTTPS protocol;",
            "the site’s server does not keep notes, and the passwords and keys to the mailbox are kept only in the server’s protected settings;",
            "only the employees who need it have access to the mailbox with the notes, through personal accounts;",
            "threats to the data and its level of protection are identified, and actions with the data are recorded;",
            "employees may not forward guests’ notes and contacts to personal email or messengers;",
            "employees with access to the data must keep it confidential (article 7 of the Law).",
          ],
        },
        "In case of a leak, the operator notifies Roskomnadzor within 24 hours and reports the results of its investigation within 72 hours (part 3.1 of article 21 of the Law).",
      ],
    },
    izmeneniya: {
      title: "Changes to the policy",
      body: [
        "We change the policy when the law changes or when the way the site works changes. A new version applies from the moment it is published on this page. The version date is at the top.",
        "If the purposes of processing or the data involved change, we will ask for your consent again.",
      ],
    },
  },
  consent: {
    cel: {
      title: "Purpose",
      body: ["To consider my note and, if I leave a contact, to reply to it. The data is not used for advertising or mailings and is not distributed."],
    },
    dannye: { title: "Data", body: ["Processed:", { list: NOTE_DATA_MINE }] },
    dejstviya: { title: "Actions and methods", body: [ACTIONS] },
    kto: {
      title: "Who processes it",
      body: [
        "I agree that the operator entrusts the processing of my data to {hosting} (hosting the site) and {mail} (the mail service) under a contract with them (part 3 of article 6 of Federal Law No. 152-FZ “On Personal Data”). The data is recorded and stored in databases on the territory of the Russian Federation. It is not transferred across borders.",
      ],
    },
    srok: {
      title: "Term",
      body: ["The consent is valid until the purpose of processing is achieved, but no longer than one year from the date the note was sent. After that the data is destroyed within 30 days."],
    },
    otzyv: {
      title: "Withdrawing consent",
      body: [
        "I may withdraw my consent by writing to {email} or to the operator’s address. The operator stops processing and destroys the data within 30 days of receiving the withdrawal (part 5 of article 21 of Federal Law No. 152-FZ “On Personal Data”).",
      ],
    },
    osobye: {
      title: "Special categories",
      body: ["I am aware that a note need not contain information about health, beliefs or other special categories of data."],
    },
    dobrovolno: {
      title: "Voluntary",
      body: [
        "I am aware that a signature and a contact are optional: without a contact there will be no reply. If I am under 14, a parent or other legal representative sends the note for me and gives the consent.",
      ],
    },
    politika: {
      title: "Policy",
      body: [`How the operator processes and protects personal data is described in the policy: ${SITE}/privacy.`],
    },
  },
};

export const EDITION_LABEL_EN = "21 November 2026";
export const consentIntroEn = `By sending a note through the “Feedback” form on ${SITE} and ticking the consent box in that form, I freely, of my own will and in my own interest give {name} (INN {inn}, OGRN {ogrn}, address: {address}) my consent to the processing of my personal data on the following terms.`;
