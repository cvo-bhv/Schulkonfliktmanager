import { YearLevel, SchoolClass, Student, Incident, IncidentCategory, IncidentStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

// HINWEIS: Wenn du lokal arbeitest (npm run dev), kann Vite kein PHP ausführen.
// Ändere diese URL zu deinem echten Server, z.B. 'https://dein-webspace.de/api.php'
// Oder lade den 'dist' Ordner nach dem Build auf den Server hoch.
const API_URL = './api.php'; 

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);
    
    // Prüfen ob die Antwort ok ist
    if (!response.ok) {
        throw new Error(`Server Fehler: ${response.status} ${response.statusText}`);
    }

    // Prüfen ob die Antwort wirklich JSON ist (fängt Vite/PHP Fehler ab)
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Server antwortete nicht mit JSON:", text.substring(0, 100) + "...");
        throw new Error("Die API hat kein gültiges JSON zurückgegeben. Läuft PHP?");
    }
  } catch (error) {
    console.error("API Fehler:", error);
    throw error;
  }
}

async function postJson<T>(url: string, data: any): Promise<T> {
  return fetchJson<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// --- Years ---
export const getYears = async (): Promise<YearLevel[]> => {
  return fetchJson<YearLevel[]>(`${API_URL}?type=years`);
};

export const saveYear = async (name: string): Promise<YearLevel> => {
  const newYear = { id: uuidv4(), name };
  await postJson(`${API_URL}?type=years`, newYear);
  return newYear;
};

export const deleteYear = async (id: string): Promise<void> => {
  await fetchJson(`${API_URL}?type=years&id=${id}`, { method: 'DELETE' });
};

// --- Classes ---
export const getClasses = async (): Promise<SchoolClass[]> => {
  return fetchJson<SchoolClass[]>(`${API_URL}?type=classes`);
};

export const getClassesByYear = async (yearId: string): Promise<SchoolClass[]> => {
  const classes = await getClasses();
  return classes.filter(c => c.yearLevelId === yearId);
};

export const getClass = async (id: string): Promise<SchoolClass | undefined> => {
  return fetchJson<SchoolClass>(`${API_URL}?type=classes&id=${id}`);
};

export const saveClass = async (yearId: string, name: string): Promise<SchoolClass> => {
  const newClass = { id: uuidv4(), yearLevelId: yearId, name };
  await postJson(`${API_URL}?type=classes`, newClass);
  return newClass;
};

export const deleteClass = async (id: string): Promise<void> => {
  await fetchJson(`${API_URL}?type=classes&id=${id}`, { method: 'DELETE' });
};

// --- Students ---
export const getStudents = async (): Promise<Student[]> => {
  return fetchJson<Student[]>(`${API_URL}?type=students`);
};

export const getStudentsByClass = async (classId: string): Promise<Student[]> => {
  const students = await getStudents();
  return students.filter(s => s.classId === classId);
};

export const getStudent = async (id: string): Promise<Student | undefined> => {
  return fetchJson<Student>(`${API_URL}?type=students&id=${id}`);
};

export const saveStudent = async (classId: string, firstName: string, lastName: string): Promise<Student> => {
  const newStudent = { id: uuidv4(), classId, firstName, lastName };
  await postJson(`${API_URL}?type=students`, newStudent);
  return newStudent;
};

export const updateStudent = async (id: string, firstName: string, lastName: string): Promise<void> => {
    const current = await getStudent(id);
    if (current) {
        await postJson(`${API_URL}?type=students`, { ...current, firstName, lastName });
    }
};

export const deleteStudent = async (id: string): Promise<void> => {
  await fetchJson(`${API_URL}?type=students&id=${id}`, { method: 'DELETE' });
};

// --- Incidents ---
export const getIncidents = async (): Promise<Incident[]> => {
  return fetchJson<Incident[]>(`${API_URL}?type=incidents`);
};

export const getIncident = async (id: string): Promise<Incident | undefined> => {
  return fetchJson<Incident>(`${API_URL}?type=incidents&id=${id}`);
};

export const saveIncident = async (incident: Omit<Incident, 'id' | 'createdAt'>): Promise<Incident> => {
  const newIncident = {
    ...incident,
    id: uuidv4(),
    createdAt: Date.now(),
  };
  await postJson(`${API_URL}?type=incidents`, newIncident);
  return newIncident;
};

export const updateIncident = async (incident: Incident): Promise<void> => {
    await postJson(`${API_URL}?type=incidents`, incident);
}

export const deleteIncident = async (id: string): Promise<void> => {
  await fetchJson(`${API_URL}?type=incidents&id=${id}`, { method: 'DELETE' });
};

// --- SEED DATA GENERATOR ---

const FIRST_NAMES = ["Leon", "Mia", "Noah", "Emma", "Paul", "Hannah", "Luca", "Sofia", "Elias", "Anna", "Ben", "Lea", "Luis", "Marie", "Jonas", "Lena", "Felix", "Emily", "Maximilian", "Lina"];
const LAST_NAMES = ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann", "Koch", "Bauer", "Richter", "Klein", "Wolf", "Schröder", "Neumann", "Schwarz", "Zimmermann"];

const SCENARIOS = [
    { cat: IncidentCategory.DISRUPTION, desc: "Hat während der Stillarbeit laut 'Skibidi Toilet' gesungen.", loc: "Klassenzimmer" },
    { cat: IncidentCategory.THEFT, desc: "Hat das Pausenbrot von Lukas entwendet und gegen Pokemon-Karten getauscht.", loc: "Pausenhof" },
    { cat: IncidentCategory.VANDALISM, desc: "Hat 'Ferien jetzt!' mit Edding an die Tafel geschrieben (permanent).", loc: "Raum 104" },
    { cat: IncidentCategory.PHYSICAL, desc: "Schubsen in der Mensa-Schlange, weil es Pommes gab.", loc: "Mensa" },
    { cat: IncidentCategory.DISRUPTION, desc: "Weigerte sich, die Sonnenbrille im Unterricht abzunehmen.", loc: "Chemie-Raum" },
    { cat: IncidentCategory.BULLYING, desc: "Hat Gerüchte über WhatsApp in der Klassengruppe verbreitet.", loc: "Digital / Schulweg" },
    { cat: IncidentCategory.OTHER, desc: "Hat versucht, den Schulhamster 'frei zu lassen'.", loc: "Biologie-Raum" },
    { cat: IncidentCategory.VERBAL, desc: "Beleidigung der Lehrkraft als 'Boomer'.", loc: "Flur" },
    { cat: IncidentCategory.DISRUPTION, desc: "Hat den Feueralarm 'aus Versehen' mit dem Ellbogen berührt.", loc: "Eingangshalle" },
    { cat: IncidentCategory.THEFT, desc: "Diebstahl von Kreidevorräten für private Kunstwerke.", loc: "Materiallager" },
    { cat: IncidentCategory.VANDALISM, desc: "Kaugummi unter den Lehrertisch geklebt.", loc: "Klassenzimmer" },
    { cat: IncidentCategory.DISRUPTION, desc: "Hat sich im Schrank versteckt, um die Klasse zu erschrecken.", loc: "Klassenzimmer" },
    { cat: IncidentCategory.OTHER, desc: "Betrieb einen illegalen Handel mit Energy-Drinks aus dem Spind.", loc: "Umkleide" },
    { cat: IncidentCategory.PHYSICAL, desc: "Schneeballschlacht im Treppenhaus.", loc: "Treppenhaus West" },
    { cat: IncidentCategory.VERBAL, desc: "Lautstarker Streit über Fußballergebnisse während der Klausur.", loc: "Raum 202" },
    { cat: IncidentCategory.DISRUPTION, desc: "Hat die Sprache des Smartboards auf Chinesisch gestellt.", loc: "Informatikraum" },
    { cat: IncidentCategory.BULLYING, desc: "Ausschließen von Mitschülern beim Völkerball.", loc: "Turnhalle" },
    { cat: IncidentCategory.VANDALISM, desc: "Hat versucht, ein TikTok-Video auf dem Lehrerpult zu drehen, Tisch verkratzt.", loc: "Raum 303" },
    { cat: IncidentCategory.OTHER, desc: "Hat Hausaufgaben durch ChatGPT erstellen lassen und den Prompt mit ausgedruckt.", loc: "Deutschunterricht" },
    { cat: IncidentCategory.DISRUPTION, desc: "Simulierte Ohnmacht, um dem Vokabeltest zu entgehen.", loc: "Englisch-Raum" }
];

const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

export const seedData = async (force: boolean = false) => {
    try {
        console.log("Checking if seeding is required...");
        // Check if API is reachable first by trying to get years
        let existingYears: YearLevel[] = [];
        try {
            existingYears = await getYears();
        } catch (e) {
            console.error("Kann Datenbank nicht erreichen. Seeding abgebrochen.", e);
            alert("Datenbank nicht erreichbar. Bitte Verbindung prüfen.");
            return;
        }

        if (!force && existingYears.length > 0) {
            console.log("Database already has data. Skipping seed.");
            return;
        }

        console.log("Starting extensive demo data seeding (100 items)...");
        
        // 1. Create Years 5-10
        const years: YearLevel[] = [];
        for (let i = 5; i <= 10; i++) {
            years.push(await saveYear(`Jahrgang ${i}`));
        }

        // 2. Create Classes and Students
        const allStudents: Student[] = [];
        
        for (const year of years) {
            for (const suffix of ['a', 'b', 'c']) {
                const cls = await saveClass(year.id, `${year.name.split(' ')[1]}${suffix}`);
                
                // 3-6 Students per class
                const numStudents = Math.floor(Math.random() * 4) + 3; 
                for (let i = 0; i < numStudents; i++) {
                    const s = await saveStudent(
                        cls.id, 
                        getRandom(FIRST_NAMES), 
                        getRandom(LAST_NAMES)
                    );
                    allStudents.push(s);
                }
            }
        }

        // 3. Create 100 Incidents
        const statuses = Object.values(IncidentStatus);
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 6);

        // Batch processing could be faster, but sequential ensures integrity for this demo
        for (let i = 0; i < 100; i++) {
            const student = getRandom(allStudents);
            const scenario = getRandom(SCENARIOS);
            const dateObj = getRandomDate(sixMonthsAgo, today);
            const dateStr = dateObj.toISOString().split('T')[0];
            
            // Weigh statuses
            let status = getRandom(statuses);
            const daysOld = (today.getTime() - dateObj.getTime()) / (1000 * 3600 * 24);
            if (daysOld > 30 && Math.random() > 0.3) status = IncidentStatus.RESOLVED;
            if (daysOld < 7 && Math.random() > 0.3) status = IncidentStatus.OPEN;

            const isSocial = Math.random() > 0.8;

            const incident: Omit<Incident, 'id' | 'createdAt'> = {
                studentId: student.id,
                date: dateStr,
                time: `${String(Math.floor(Math.random() * 6) + 8).padStart(2, '0')}:${Math.floor(Math.random() * 5)}0`, 
                location: scenario.loc,
                category: scenario.desc.includes("Smartboard") ? IncidentCategory.VANDALISM : scenario.cat,
                description: scenario.desc,
                involvedPersons: Math.random() > 0.7 ? "Diverse Mitschüler" : "",
                witnesses: Math.random() > 0.6 ? "Herr Müller" : "",
                immediateActions: "Gespräch gesucht, Ermahnung ausgesprochen.",
                agreements: status === IncidentStatus.RESOLVED ? "Schüler hat sich entschuldigt und den Schaden behoben." : "Noch zu klären.",
                parentContacted: Math.random() > 0.8,
                administrationContacted: Math.random() > 0.9,
                socialServiceContacted: isSocial,
                socialServiceAbbreviation: isSocial ? "Hr. Soz" : "",
                status: status
            };
            
            // Override category slightly based on scenario logic
            incident.category = scenario.cat;
            
            await saveIncident(incident);
        }
        console.log("Seeding complete!");
        return true;
    } catch (e) {
        console.error("Seeding failed critically", e);
        throw e;
    }
};

// Alias for compatibility
export const seedDataIfEmpty = async () => seedData(false);