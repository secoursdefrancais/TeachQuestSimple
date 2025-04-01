// src/types/index.ts - Fichier unifié pour tous les types

// Type pour la navigation principale de l'application
export type AppView = 'dashboard' | 'schedule' | 'timetable' | 'tasks' | 'students' | 'settings';

// Types liés à l'utilisateur et la gamification
export interface User {
  id: string;
  name: string;
  level: number;
  xp: number;
  xpForNextLevel: number;
  badges: string[];
  stats: UserStats;
  preferences: UserPreferences;
}

export interface UserStats {
  tasksCompleted: number;
  totalXpEarned: number;
  streakDays: number;
  categoryBreakdown: Record<string, number>;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  defaultCorrectionTime: number; // Temps en minutes
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedDate: string;
  requirements: Record<string, any>;
}

// Types liés aux tâches
export interface Task {
  id: string;
  name: string;
  description: string;
  categoryId: number;
  status: 'pending' | 'inProgress' | 'completed';
  dueDate: string;
  completionDate?: string;
  relatedGroups: string[];
  relatedSubject: string;
  priority: number;
  estimatedTime: number;
  actualTime?: number;
  earnedXP: number;
  notes: string;
}

export interface TaskCategory {
  id: number;
  name: string;
  xpValue: number;
  estimeValue: number;
  plaisirValue: number;
  icon: string;
  perUnit?: boolean;
  recurring?: string;
  recurringEvent?: string;
  deadline?: boolean;
  description: string;
}

// Types liés aux évaluations et corrections
export interface Evaluation {
  id: string;
  name: string;
  subject: string;
  group: string;
  type: string;
  date: string;
  rubricId: string;
  maxPoints: number;
  coefficient: number;
  theme: string;
  copies: Copy[];
}

export interface Copy {
  studentId: string;
  grade: number | null;
  comments: string;
  details: CriterionDetail[];
}

export interface CriterionDetail {
  id: string;
  points: number;
  subCriteria?: SubCriterionDetail[];
}

export interface SubCriterionDetail {
  id: string;
  points: number;
}

// Types liés aux barèmes de notation
export interface Rubric {
  id: string;
  name: string;
  evaluationType: string;
  totalPoints: number;
  passingThreshold?: number;
  creationDate: string;
  lastModified: string;
  relatedClasses?: string[];
  criteria: RubricCriterion[];
}

export interface RubricCriterion {
  id: string;
  name: string;
  points: number;
  subCriteria?: RubricSubCriterion[];
  description?: string;
}

export interface RubricSubCriterion {
  id: string;
  name: string;
  points: number;
  description?: string;
}

// Types liés aux élèves
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
}

export interface StudentGroup {
  group: string;
  students: Student[];
}

export interface StudentInternship {
  studentId: string;
  companyName: string;
  location: string;
  supervisorName: string;
  supervisorContact: string;
  supervisorPhone?: string; // Ajout du numéro de téléphone du tuteur
  startDate: string;
  endDate: string;
  visitRequired?: boolean;
  visitScheduled: boolean;
  visitDate: string | null;
  visitCompleted?: boolean; // Pour indiquer si la visite a été effectuée
  visitNotes?: string; // Pour ajouter des notes sur la visite
  notes?: string;
}

// Autres types utilitaires
export type Subject = "CULTURE GENE.ET EXPR" | "FRANCAIS" | "AP FRANCAIS" | "ATELIER PROFESS";

// Types liés à l'emploi du temps
export interface ScheduleClass {
  subject: string;
  group: string;
  room: string;
  startTime: string;
  endTime: string;
  alternating?: boolean;
  weekType?: 'odd' | 'even';
  note?: string;
}

export interface ScheduleDay {
  day: string;
  classes: ScheduleClass[];
}

export interface DateRangeEvent {
  type: string;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  groups?: string[];
}

export interface SingleDayEvent {
  type: string;
  name: string;
  date: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
  taskCategoryId?: number;
  note?: string;
  description?: string;
  groups?: string[];
}

export type PeriodEvent = DateRangeEvent | SingleDayEvent;

export interface InternshipPeriod {
  group: string;
  startDate: string;
  endDate: string;
  visitRequired: boolean;
  visitScheduled: boolean;
  reportDeadline: string;
}