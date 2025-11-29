
export enum ApplicationStatus {
  DRAFT = 'Brouillon',
  DOCS_PENDING = 'Documents Manquants',
  WAITING_APPOINTMENT = 'En attente RDV',
  APPOINTMENT_SET = 'RDV Fixé',
  SUBMITTED = 'Dépôt Effectué',
  PROCESSING = 'En Traitement',
  READY_PICKUP = 'Prêt au Retrait',
  COMPLETED = 'Clôturé / Accordé',
  REFUSED = 'Refusé'
}

export enum VisaType {
  TOURISM = 'Tourisme',
  BUSINESS = 'Affaires',
  STUDY = 'Études',
  FAMILY = 'Regroupement Familial',
  PARENT_FRENCH = 'Parent d\'un français',
  SPOUSE = 'Conjoint',
  RETURN = 'Visa de retour',
  TALON = 'Visa Talon'
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  status: 'valid' | 'pending' | 'expired';
  url?: string;
}

export interface Interaction {
  id: string;
  date: string;
  type: 'call' | 'whatsapp' | 'email' | 'meeting' | 'system';
  notes: string;
}

export type PriorityMode = 'auto' | 'urgent' | 'normal' | 'dormant';

export interface AppointmentConfig {
  portalLogin?: string;
  portalPassword?: string;
  portalUrl?: string;
  targetDateStart?: string;
  targetDateEnd?: string;
  lastChecked?: string;
  checkLog?: string[]; // New field for history of checks
  priorityMode?: PriorityMode;
  recommendedTime?: string;
  aiStrategyReason?: string;
}

export interface FamilyMember {
  id: string;
  fullName: string;
  passportNumber?: string;
  relation: 'Conjoint(e)' | 'Enfant' | 'Parent' | 'Autre';
}

export interface Application {
  id: string;
  destination: string;
  center?: string;
  visaType: string;
  status: ApplicationStatus;
  appointmentDate?: string;
  submissionDate?: string;
  documents: DocumentItem[];
  price?: number;
  deposit?: number;
  appointmentConfig?: AppointmentConfig;
  members?: FamilyMember[];
  refusalReason?: string;
  archived?: boolean;
}

export interface Client {
  id: string;
  fullName: string;
  passportNumber?: string;
  passportExpiry?: string;
  phone: string;
  email: string;
  address: string;
  avatarUrl: string;
  applications: Application[];
  history: Interaction[];
  notes?: string;
}

export interface VisaRequirement {
  id: string;
  visaType: string;
  content: string[];
  googleDocLink?: string;
}

export interface ExternalResource {
  id: string;
  title: string;
  category: string;
  description?: string;
  website?: string;
  phone?: string;
}

export interface AppSettings {
  agencyName: string;
  currency: string;
  darkMode: boolean;
  visaTypes: string[];
  destinations: string[];
  menuOrder: string[];
  appPassword?: string;
  centers: { name: string; url: string }[];
}

export interface TodoTask {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface LetterTemplate {
  id: string;
  name: string;
  content: string;
}

export interface OpeningLog {
  id: string;
  destination: string;
  center: string;
  visaType: string;
  foundAt: string;
  dayOfWeek: string;
  timeOfDay: string;
}

export type ViewState = 'dashboard' | 'clients' | 'archives' | 'calendar' | 'client-detail' | 'requirements' | 'appointment-tracker' | 'resources' | 'settings' | 'tasks' | 'templates' | 'kanban';
