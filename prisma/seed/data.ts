/** Datos de referencia para el seed. */

export const SPECIALTIES = {
  DOCTOR: [
    { fr: "Médecine générale", ar: "الطب العام" },
    { fr: "Pédiatrie", ar: "طب الأطفال" },
    { fr: "Gynécologie", ar: "أمراض النساء" },
    { fr: "Cardiologie", ar: "أمراض القلب" },
    { fr: "Dermatologie", ar: "الأمراض الجلدية" },
    { fr: "Gériatrie", ar: "طب الشيخوخة" },
    { fr: "Médecine interne", ar: "الطب الباطني" },
    { fr: "Urgences", ar: "طب الطوارئ" },
    { fr: "Neurologie", ar: "طب الأعصاب" },
    { fr: "Pneumologie", ar: "أمراض الرئة" },
  ],
  NURSE: [
    { fr: "Soins généraux", ar: "التمريض العام" },
    { fr: "Soins à domicile", ar: "الرعاية المنزلية" },
    { fr: "Pédiatrie", ar: "تمريض الأطفال" },
    { fr: "Gériatrie", ar: "رعاية المسنين" },
    { fr: "Perfusions et injections", ar: "الحقن والمحاليل" },
    { fr: "Pansements", ar: "الضمادات" },
    { fr: "Soins palliatifs", ar: "الرعاية التلطيفية" },
  ],
} as const;

type Seed = {
  first: string;
  last: string;
  sex: "MALE" | "FEMALE";
  type: "DOCTOR" | "NURSE";
  zone: string;
  workplace: string;
  langs: string[];
};

const W = {
  cnh: "Centre Hospitalier National",
  cheikh: "Hôpital Cheikh Zayed",
  amitie: "Hôpital de l'Amitié",
  mere: "Centre Hospitalier Mère et Enfant",
  cardio: "Centre National de Cardiologie",
  clinique: "Clinique Chiva",
  kissi: "Clinique Kissi",
  sebkha: "Centre de Santé de Sebkha",
  arafat: "Centre de Santé d'Arafat",
  teyarett: "Centre de Santé de Teyarett",
};

/** 20 médicos + 10 enfermeros con nombres mauritanos ficticios. */
export const PROFESSIONALS: Seed[] = [
  { first: "Mohamed", last: "Ould Abdallahi", sex: "MALE", type: "DOCTOR", zone: "Tevragh Zeina", workplace: W.cnh, langs: ["ar", "hassaniya", "fr"] },
  { first: "Mariem", last: "Mint Ahmed", sex: "FEMALE", type: "DOCTOR", zone: "Ksar", workplace: W.mere, langs: ["ar", "hassaniya", "fr", "en"] },
  { first: "Sidi", last: "Ould Cheikh", sex: "MALE", type: "DOCTOR", zone: "Teyarett", workplace: W.cheikh, langs: ["ar", "hassaniya", "fr"] },
  { first: "Mamadou", last: "Ba", sex: "MALE", type: "DOCTOR", zone: "Sebkha", workplace: W.sebkha, langs: ["ff", "fr", "hassaniya", "wo"] },
  { first: "Fatimetou", last: "Mint Mohamed Vall", sex: "FEMALE", type: "DOCTOR", zone: "Tevragh Zeina", workplace: W.clinique, langs: ["ar", "hassaniya", "fr"] },
  { first: "Cheikh", last: "Ould Brahim", sex: "MALE", type: "DOCTOR", zone: "Dar Naim", workplace: W.amitie, langs: ["ar", "hassaniya"] },
  { first: "Aminetou", last: "Mint Sidi", sex: "FEMALE", type: "DOCTOR", zone: "Arafat", workplace: W.arafat, langs: ["ar", "hassaniya", "fr"] },
  { first: "Oumar", last: "Diallo", sex: "MALE", type: "DOCTOR", zone: "El Mina", workplace: W.cnh, langs: ["ff", "fr", "wo"] },
  { first: "El Hacen", last: "Ould Mohamedou", sex: "MALE", type: "DOCTOR", zone: "Ksar", workplace: W.cardio, langs: ["ar", "hassaniya", "fr", "en"] },
  { first: "Khadijetou", last: "Mint Yahya", sex: "FEMALE", type: "DOCTOR", zone: "Toujounine", workplace: W.amitie, langs: ["ar", "hassaniya"] },
  { first: "Moussa", last: "Camara", sex: "MALE", type: "DOCTOR", zone: "Riyad", workplace: W.kissi, langs: ["snk", "fr", "hassaniya"] },
  { first: "Abdallahi", last: "Ould Isselmou", sex: "MALE", type: "DOCTOR", zone: "Tevragh Zeina", workplace: W.cheikh, langs: ["ar", "hassaniya", "fr"] },
  { first: "Coumba", last: "Sy", sex: "FEMALE", type: "DOCTOR", zone: "El Mina", workplace: W.mere, langs: ["ff", "fr", "wo"] },
  { first: "Brahim", last: "Ould Ely", sex: "MALE", type: "DOCTOR", zone: "Arafat", workplace: W.arafat, langs: ["ar", "hassaniya"] },
  { first: "Mekfoula", last: "Mint Ahmedou", sex: "FEMALE", type: "DOCTOR", zone: "Teyarett", workplace: W.teyarett, langs: ["ar", "hassaniya", "fr"] },
  { first: "Yahya", last: "Ould Sidi Mohamed", sex: "MALE", type: "DOCTOR", zone: "Dar Naim", workplace: W.cnh, langs: ["ar", "hassaniya", "fr"] },
  { first: "Hawa", last: "Kane", sex: "FEMALE", type: "DOCTOR", zone: "Sebkha", workplace: W.sebkha, langs: ["ff", "wo", "fr"] },
  { first: "Ely", last: "Ould Boubacar", sex: "MALE", type: "DOCTOR", zone: "Ksar", workplace: W.clinique, langs: ["ar", "hassaniya", "fr", "en"] },
  { first: "Aicha", last: "Mint Cheikh", sex: "FEMALE", type: "DOCTOR", zone: "Riyad", workplace: W.kissi, langs: ["ar", "hassaniya"] },
  { first: "Ousmane", last: "Diagana", sex: "MALE", type: "DOCTOR", zone: "Toujounine", workplace: W.amitie, langs: ["snk", "fr", "hassaniya"] },
  { first: "Vatimetou", last: "Mint Brahim", sex: "FEMALE", type: "NURSE", zone: "Tevragh Zeina", workplace: W.cnh, langs: ["ar", "hassaniya", "fr"] },
  { first: "Ahmed", last: "Ould Salem", sex: "MALE", type: "NURSE", zone: "Ksar", workplace: W.cheikh, langs: ["ar", "hassaniya"] },
  { first: "Toutou", last: "Mint Ely", sex: "FEMALE", type: "NURSE", zone: "Arafat", workplace: W.arafat, langs: ["ar", "hassaniya"] },
  { first: "Aliou", last: "Sow", sex: "MALE", type: "NURSE", zone: "El Mina", workplace: W.sebkha, langs: ["ff", "wo", "fr"] },
  { first: "Lalla", last: "Mint Mohamed", sex: "FEMALE", type: "NURSE", zone: "Dar Naim", workplace: W.amitie, langs: ["ar", "hassaniya", "fr"] },
  { first: "Isselmou", last: "Ould Ahmed Salem", sex: "MALE", type: "NURSE", zone: "Teyarett", workplace: W.teyarett, langs: ["ar", "hassaniya"] },
  { first: "Fatou", last: "Ndiaye", sex: "FEMALE", type: "NURSE", zone: "Sebkha", workplace: W.sebkha, langs: ["wo", "fr", "hassaniya"] },
  { first: "Mohamedou", last: "Ould Mahmoud", sex: "MALE", type: "NURSE", zone: "Riyad", workplace: W.kissi, langs: ["ar", "hassaniya", "fr"] },
  { first: "Salka", last: "Mint Abdallahi", sex: "FEMALE", type: "NURSE", zone: "Toujounine", workplace: W.mere, langs: ["ar", "hassaniya"] },
  { first: "Demba", last: "Sylla", sex: "MALE", type: "NURSE", zone: "Ksar", workplace: W.cnh, langs: ["snk", "fr", "ar"] },
];

export const BIOS = [
  "Visites à domicile le soir et le week-end. Suivi des maladies chroniques.",
  "Disponible pour consultations rapides à domicile, enfants et adultes.",
  "Expérience en urgences. Je me déplace rapidement dans toute la ville.",
  "Prise en charge des personnes âgées et suivi post-hospitalisation.",
  "Soins attentifs et ponctuels. Matériel de base toujours avec moi.",
  "",
];
