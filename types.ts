export interface YearLevel {
  id: string;
  name: string; // e.g., "Jahrgang 5"
}

export interface SchoolClass {
  id: string;
  yearLevelId: string;
  name: string; // e.g., "5a"
}

export interface Student {
  id: string;
  classId: string;
  firstName: string;
  lastName: string;
}

export enum IncidentCategory {
  PHYSICAL = "Körperliche Gewalt",
  VERBAL = "Verbale Gewalt",
  BULLYING = "Mobbing / Ausgrenzung",
  VANDALISM = "Sachbeschädigung",
  DISRUPTION = "Unterrichtsstörung",
  THEFT = "Diebstahl",
  OTHER = "Sonstiges"
}

export enum IncidentStatus {
  OPEN = "Offen",
  IN_PROGRESS = "In Bearbeitung",
  RESOLVED = "Geklärt",
  MONITORING = "Beobachtung"
}

export interface Incident {
  id: string;
  studentId: string;
  date: string; // ISO date string
  time: string;
  location: string;
  category: IncidentCategory;
  description: string;
  involvedPersons: string; // Free text for other students/teachers involved
  witnesses: string;
  immediateActions: string; // What happened immediately?
  agreements: string; // Agreements/Consequences
  parentContacted: boolean;
  
  // New fields
  socialServiceContacted: boolean;
  socialServiceAbbreviation?: string; // Kürzel
  administrationContacted: boolean;

  status: IncidentStatus;
  createdAt: number;
}

// Helper type for the full view
export interface EnrichedIncident extends Incident {
  studentName: string;
  className: string;
  classId?: string;
  yearLevelName: string;
}